import { useMemo, useState } from 'react';

const API_BASE_URL = 'http://localhost:4000';

const prettyJson = (value) => JSON.stringify(value, null, 2);

function App() {
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('password123');
  const [authType, setAuthType] = useState('cookie');
  const [jwtToken, setJwtToken] = useState('');
  const [includeAuth, setIncludeAuth] = useState(true);
  const [authResponse, setAuthResponse] = useState('Authenticate to see the API response here.');
  const [statusResponse, setStatusResponse] = useState(
    'Use the protected request button to test authenticated and unauthenticated calls.',
  );
  const [isLoading, setIsLoading] = useState(false);

  const loginEndpoint = useMemo(
    () => (authType === 'cookie' ? '/auth/cookie/login' : '/auth/jwt/login'),
    [authType],
  );

  const statusEndpoint = useMemo(
    () => (authType === 'cookie' ? '/auth/cookie/status' : '/auth/jwt/status'),
    [authType],
  );

  async function authenticate() {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: authType === 'cookie' ? 'include' : 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (authType === 'jwt') {
        setJwtToken(data.token ?? '');
      } else {
        setJwtToken('');
      }

      setAuthResponse(prettyJson({ status: response.status, data }));
    } catch (error) {
      setAuthResponse(`Request failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkStatus() {
    setIsLoading(true);

    const headers = {};

    if (authType === 'jwt' && includeAuth && jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${statusEndpoint}`, {
        method: 'GET',
        headers,
        credentials: authType === 'cookie' && includeAuth ? 'include' : 'same-origin',
      });

      const data = await response.json();
      setStatusResponse(prettyJson({ status: response.status, data }));
    } catch (error) {
      setStatusResponse(`Request failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <div className="title-row">
          <div>
            <p className="eyebrow">Educational auth demo</p>
            <h1>Cookie vs JWT authentication</h1>
          </div>
          <span className="status-chip">{isLoading ? 'Working...' : 'Ready'}</span>
        </div>

        <p className="description">
          Backend credentials: <code>student</code> / <code>password123</code>
        </p>

        <div className="field-grid">
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="student"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password123"
            />
          </label>
        </div>

        <fieldset className="auth-switcher">
          <legend>Authentication type</legend>

          <label>
            <input
              type="radio"
              name="authType"
              checked={authType === 'cookie'}
              onChange={() => setAuthType('cookie')}
            />
            Cookie session
          </label>

          <label>
            <input
              type="radio"
              name="authType"
              checked={authType === 'jwt'}
              onChange={() => setAuthType('jwt')}
            />
            JWT token
          </label>
        </fieldset>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeAuth}
            onChange={(event) => setIncludeAuth(event.target.checked)}
          />
          Include authentication data when calling the protected route
        </label>

        <div className="button-row">
          <button onClick={authenticate} disabled={isLoading}>
            Authenticate
          </button>
          <button className="secondary" onClick={checkStatus} disabled={isLoading}>
            Call protected route
          </button>
        </div>

        <div className="endpoint-grid">
          <div className="endpoint">
            <span>Login endpoint</span>
            <code>{loginEndpoint}</code>
          </div>
          <div className="endpoint">
            <span>Protected endpoint</span>
            <code>{statusEndpoint}</code>
          </div>
        </div>

        <div className="response-grid">
          <section className="response-box">
            <h2>Authentication response</h2>
            <pre>{authResponse}</pre>
          </section>

          <section className="response-box">
            <h2>Protected route response</h2>
            <pre>{statusResponse}</pre>
          </section>
        </div>

        {authType === 'jwt' && (
          <section className="token-box">
            <h2>Stored JWT</h2>
            <pre>{jwtToken || 'No token stored yet.'}</pre>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
