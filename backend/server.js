const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 4000;
const FRONTEND_ORIGIN = 'http://localhost:5173';
const JWT_SECRET = 'educational-demo-secret';
const SESSION_COOKIE_NAME = 'demo_session';

const sessions = new Map();

const DEMO_USER = {
  username: 'student',
  password: 'password123',
};

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

function validateCredentials(username, password) {
  return username === DEMO_USER.username && password === DEMO_USER.password;
}

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/auth/cookie/login', (request, response) => {
  const { username, password } = request.body;

  if (!validateCredentials(username, password)) {
    return response.status(401).json({
      ok: false,
      message: 'Invalid username or password for cookie auth.',
    });
  }

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { username });

  response.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60,
  });

  return response.json({
    ok: true,
    authType: 'cookie',
    message: 'Cookie session created.',
    username,
  });
});

app.get('/auth/cookie/status', (request, response) => {
  const sessionId = request.cookies[SESSION_COOKIE_NAME];

  if (!sessionId || !sessions.has(sessionId)) {
    return response.status(401).json({
      ok: false,
      authType: 'cookie',
      isAuthenticated: false,
      message: 'Missing or invalid session cookie.',
    });
  }

  const session = sessions.get(sessionId);

  return response.json({
    ok: true,
    authType: 'cookie',
    isAuthenticated: true,
    message: 'Valid session cookie.',
    username: session.username,
  });
});

app.post('/auth/jwt/login', (request, response) => {
  const { username, password } = request.body;

  if (!validateCredentials(username, password)) {
    return response.status(401).json({
      ok: false,
      message: 'Invalid username or password for JWT auth.',
    });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

  return response.json({
    ok: true,
    authType: 'jwt',
    message: 'JWT created.',
    token,
  });
});

app.get('/auth/jwt/status', (request, response) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({
      ok: false,
      authType: 'jwt',
      isAuthenticated: false,
      message: 'Missing Bearer token.',
    });
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    return response.json({
      ok: true,
      authType: 'jwt',
      isAuthenticated: true,
      message: 'Valid JWT.',
      username: payload.username,
    });
  } catch (_error) {
    return response.status(401).json({
      ok: false,
      authType: 'jwt',
      isAuthenticated: false,
      message: 'Invalid or expired JWT.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Auth demo backend is running on http://localhost:${PORT}`);
  console.log(
    `Use username "${DEMO_USER.username}" and password "${DEMO_USER.password}"`,
  );
});
