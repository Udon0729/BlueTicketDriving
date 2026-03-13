"""Augment only 一時停止 (stop sign) images to address class imbalance.

Applies color-space augmentations that preserve bounding box coordinates,
so label files are copied as-is. No horizontal flip.

Usage:
    python data/augment_stop_signs.py          # default 5x augmentation
    python data/augment_stop_signs.py --multiplier 8
"""

import argparse
import random
import shutil
from pathlib import Path

import cv2
import numpy as np

DATASET_DIR = Path(__file__).parent / "road_signs_yolo"
TRAIN_IMAGES = DATASET_DIR / "train" / "images"
TRAIN_LABELS = DATASET_DIR / "train" / "labels"

ICHIJI_TEISHI_IDX = 70  # remapped class index for 一時停止

SEED = 42


def find_stop_sign_files() -> list[str]:
    """Find all training image stems that contain a stop sign annotation."""
    stems = []
    for label_path in sorted(TRAIN_LABELS.glob("*.txt")):
        lines = label_path.read_text().strip().splitlines()
        for line in lines:
            if line.startswith(f"{ICHIJI_TEISHI_IDX} "):
                stems.append(label_path.stem)
                break
    return stems


def augment_hsv(img: np.ndarray, h_gain: float, s_gain: float, v_gain: float) -> np.ndarray:
    """Random HSV jitter."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 0] = np.clip(hsv[:, :, 0] * (1 + h_gain), 0, 179)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * (1 + s_gain), 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * (1 + v_gain), 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def augment_brightness_contrast(
    img: np.ndarray, alpha: float, beta: int,
) -> np.ndarray:
    """Adjust brightness (beta) and contrast (alpha)."""
    return np.clip(img.astype(np.float32) * alpha + beta, 0, 255).astype(np.uint8)


def augment_gaussian_noise(img: np.ndarray, sigma: float) -> np.ndarray:
    """Add Gaussian noise."""
    noise = np.random.normal(0, sigma, img.shape).astype(np.float32)
    return np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)


def augment_blur(img: np.ndarray, ksize: int) -> np.ndarray:
    """Gaussian blur."""
    return cv2.GaussianBlur(img, (ksize, ksize), 0)


def augment_jpeg_compress(img: np.ndarray, quality: int) -> np.ndarray:
    """Simulate JPEG compression artifacts."""
    _, enc = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return cv2.imdecode(enc, cv2.IMREAD_COLOR)


def generate_augmentation(img: np.ndarray, rng: random.Random) -> np.ndarray:
    """Apply a random combination of augmentations to one image."""
    result = img.copy()

    # HSV jitter
    if rng.random() < 0.8:
        h_gain = rng.uniform(-0.02, 0.02)
        s_gain = rng.uniform(-0.4, 0.4)
        v_gain = rng.uniform(-0.3, 0.3)
        result = augment_hsv(result, h_gain, s_gain, v_gain)

    # Brightness / contrast
    if rng.random() < 0.5:
        alpha = rng.uniform(0.7, 1.3)  # contrast
        beta = rng.randint(-30, 30)    # brightness
        result = augment_brightness_contrast(result, alpha, beta)

    # Gaussian noise
    if rng.random() < 0.3:
        sigma = rng.uniform(5, 20)
        result = augment_gaussian_noise(result, sigma)

    # Blur
    if rng.random() < 0.2:
        ksize = rng.choice([3, 5])
        result = augment_blur(result, ksize)

    # JPEG compression
    if rng.random() < 0.3:
        quality = rng.randint(30, 70)
        result = augment_jpeg_compress(result, quality)

    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--multiplier", type=int, default=5,
        help="Number of augmented copies per stop sign image",
    )
    args = parser.parse_args()

    rng = random.Random(SEED)
    np.random.seed(SEED)

    stems = find_stop_sign_files()
    print(f"Found {len(stems)} training images with 一時停止 annotations")

    generated = 0
    for stem in stems:
        img_path = TRAIN_IMAGES / f"{stem}.jpg"
        label_path = TRAIN_LABELS / f"{stem}.txt"

        img = cv2.imread(str(img_path))
        if img is None:
            print(f"  Warning: could not read {img_path}")
            continue

        label_text = label_path.read_text()

        for i in range(args.multiplier):
            aug_stem = f"{stem}_aug{i}"
            aug_img = generate_augmentation(img, rng)

            cv2.imwrite(str(TRAIN_IMAGES / f"{aug_stem}.jpg"), aug_img)
            (TRAIN_LABELS / f"{aug_stem}.txt").write_text(label_text)
            generated += 1

    total_stop = len(stems) + generated
    print(f"Generated {generated} augmented images")
    print(f"一時停止 training images: {len(stems)} original + {generated} augmented = {total_stop} total")


if __name__ == "__main__":
    main()
