# Backend (Flask + MongoDB)

## Setup

1. Create `.env` (copy `.env.example` at repo root).
2. Create venv & install:
3. Run MongoDB locally or via docker-compose.
4. Start:

## API

- `POST /api/auth/register` { email, password }
- `POST /api/auth/login` { email, password } → { access_token, refresh_token }
- `POST /api/auth/refresh` { refresh_token }
- `GET /api/vault` (Bearer access_token)
- `POST /api/vault` { blob } (Bearer access_token)
