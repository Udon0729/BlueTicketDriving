"""Fine-tune YOLOv8n on GeoTechnologies JP road signs dataset.

Produces a stop-sign-specialized model for 一時不停止 detection.
Traffic light detection uses the separate COCO pretrained model.

Usage:
    cd BlueTicketDriving
    uv run --with ultralytics data/train_road_signs.py --device 0
"""

import argparse
from pathlib import Path

from ultralytics import YOLO

DATA_YAML = Path(__file__).parent / "road_signs_yolo" / "data.yaml"

# Key class indices (road_signs_yolo, 0-indexed after remap)
ICHIJI_TEISHI_IDX = 70
STOP_LINE_IDX = 74


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", default="cpu", help="cuda device (0, 1, ...) or cpu")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--patience", type=int, default=20, help="early stopping patience")
    parser.add_argument("--base-model", default="yolov8n.pt", help="pretrained model")
    args = parser.parse_args()

    model = YOLO(args.base_model)

    model.train(
        data=str(DATA_YAML),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        patience=args.patience,
        # Augmentation — no horizontal flip (止まれ text is directional)
        fliplr=0.0,
        mosaic=1.0,
        mixup=0.1,
        scale=0.5,
        translate=0.1,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        # Training
        amp=False,  # Disable AMP (Blackwell GPU compatibility)
        # Output
        project="runs/road_signs",
        name="yolov8n_stop_sign",
        exist_ok=True,
    )

    # Validate and print per-class metrics
    metrics = model.val()
    print("\n=== Validation Results ===")
    print(f"mAP50 (all classes): {metrics.box.map50:.3f}")
    print(f"mAP50-95 (all classes): {metrics.box.map:.3f}")

    key_classes = [
        (ICHIJI_TEISHI_IDX, "ichiji_teishi"),
        (STOP_LINE_IDX, "stop_line"),
    ]
    if hasattr(metrics.box, "ap50") and metrics.box.ap50 is not None:
        ap50 = metrics.box.ap50
        for idx, name in key_classes:
            if idx < len(ap50):
                print(f"  {name}: AP50={ap50[idx]:.3f}")

    best_pt = Path("runs/road_signs/yolov8n_stop_sign/weights/best.pt")
    if best_pt.exists():
        print(f"\nBest model: {best_pt}")
        print("Deploy:")
        print(f"  cp {best_pt} backend/models/yolov8n_stop_sign.pt")
        print("  Set BTD_STOP_SIGN_MODEL=models/yolov8n_stop_sign.pt")


if __name__ == "__main__":
    main()
