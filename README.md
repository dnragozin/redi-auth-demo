# Auth Demo Apps

This workspace contains two separate educational applications:

- `backend`: a simple Node.js + Express API showing cookie-based auth and JWT auth
- `frontend`: a React app that can authenticate with either mode and call protected routes with or without auth data

## Demo credentials

- Username: `student`
- Password: `password123`

## Backend routes

- `POST /auth/cookie/login`
- `GET /auth/cookie/status`
- `POST /auth/jwt/login`
- `GET /auth/jwt/status`

## Run the apps

### 1. Start the backend

```bash
cd backend
npm start
```

The API runs on `http://localhost:4000`.

### 2. Start the frontend

```bash
cd frontend
npm run dev
```

The UI runs on `http://localhost:5173`.
