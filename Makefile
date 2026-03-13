.PHONY: dev dev-frontend dev-backend ssl-cert

# フロントエンド + バックエンド(HTTPS)を同時起動
dev:
	@trap 'kill 0' EXIT; \
	cd backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
		--ssl-keyfile certs/key.pem --ssl-certfile certs/cert.pem & \
	cd frontend && npm run dev & \
	wait

# フロントエンドのみ
dev-frontend:
	cd frontend && npm run dev

# バックエンドのみ（HTTPS）
dev-backend:
	cd backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
		--ssl-keyfile certs/key.pem --ssl-certfile certs/cert.pem

# 自己署名SSL証明書を生成（初回のみ）
ssl-cert:
	mkdir -p backend/certs
	openssl req -x509 -newkey rsa:2048 \
		-keyout backend/certs/key.pem -out backend/certs/cert.pem \
		-days 365 -nodes -subj "/CN=localhost"
