import { useMemo, useState } from 'react';

/*
  STUDENT GUIDE

  This frontend demonstrates two common authentication patterns:

  1. Cookie/session authentication
     - The user sends username + password to the backend.
     - If the credentials are valid, the backend creates a server-side session.
     - The backend sends a cookie back to the browser.
     - On later requests, the browser can automatically send that cookie again.
     - The backend reads the cookie, finds the matching session, and decides
       whether the user is authenticated.

  2. JWT authentication
     - The user sends username + password to the backend.
     - If the credentials are valid, the backend returns a JWT string.
     - The frontend stores that token and is responsible for sending it later.
     - On later requests, the frontend adds the token to the Authorization header.
     - The backend verifies the token signature and decides whether the user
       is authenticated.

  The most important difference:
  - Cookie auth usually relies on the browser automatically sending cookies.
  - JWT auth usually relies on the frontend manually sending a Bearer token.

  This demo also lets students intentionally turn auth data off before calling
  the protected endpoint, so they can see the failure case on purpose.
*/

// The React app talks to the Express backend running on port 4000.
const API_BASE_URL = 'http://localhost:4000';

// Pretty-print backend responses so students can inspect them easily.
const prettyJson = (value) => JSON.stringify(value, null, 2);

function App() {
  // ----------------------------
  // Form inputs
  // ----------------------------
  // The login form always starts with username + password.
  // Both cookie auth and JWT auth use the same credentials here.
  // These inputs are sent to either login endpoint.
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('password123');

  // ----------------------------
  // Demo mode selection
  // ----------------------------
  // This state decides which authentication model we are demonstrating.
  // This toggle decides which authentication story the student is exploring:
  // 1. "cookie" means the server creates a session and the browser stores a cookie.
  // 2. "jwt" means the server returns a token and the frontend stores it in state.
  const [authType, setAuthType] = useState('cookie');

  // ----------------------------
  // JWT-specific state
  // ----------------------------
  // Cookie auth does not need frontend-managed token storage.
  // JWT auth does, so we keep the token here after login succeeds.
  // We keep the JWT in React state so students can see when it exists.
  // In this demo it is intentionally visible for learning purposes.
  const [jwtToken, setJwtToken] = useState('');

  // ----------------------------
  // Teaching control
  // ----------------------------
  // This state is not required by auth itself.
  // It exists so students can flip between:
  // - sending auth data
  // - not sending auth data
  // and then compare the backend responses.
  // This checkbox is the teaching trick in the UI:
  // if students uncheck it, the protected request is sent without cookie/JWT data.
  // That makes the difference between "authenticated" and "unauthenticated" obvious.
  const [includeAuth, setIncludeAuth] = useState(true);

  // ----------------------------
  // Output shown to students
  // ----------------------------
  // These blocks store backend responses so the UI can show exactly what happened.
  // These strings hold the raw API responses shown on screen.
  const [authResponse, setAuthResponse] = useState('Authenticate to see the API response here.');
  const [statusResponse, setStatusResponse] = useState(
    'Use the protected request button to test authenticated and unauthenticated calls.',
  );

  // This helps disable buttons while a request is in progress.
  // That makes the UI easier to reason about during async work.
  const [isLoading, setIsLoading] = useState(false);

  // ----------------------------
  // Derived values
  // ----------------------------
  // `useMemo` is not strictly necessary here, but it makes the code expressive:
  // "given the selected auth type, what login route should be used?"
  // The selected auth mode decides which login route the frontend will call.
  // Cookie auth and JWT auth have separate endpoints in the backend.
  const loginEndpoint = useMemo(
    () => (authType === 'cookie' ? '/auth/cookie/login' : '/auth/jwt/login'),
    [authType],
  );

  // Same idea for the protected route:
  // the cookie demo and JWT demo have different backend endpoints.
  // The protected route also depends on the selected auth mode.
  // For cookies the server checks the session cookie.
  // For JWT the server checks the Bearer token in the Authorization header.
  const statusEndpoint = useMemo(
    () => (authType === 'cookie' ? '/auth/cookie/status' : '/auth/jwt/status'),
    [authType],
  );

  // -----------------------------------------
  // Step 1: Authenticate with username/password
  // -----------------------------------------
  // This function represents the "login" step for both auth approaches.
  async function authenticate() {
    // Mark the UI as busy before starting the network request.
    setIsLoading(true);

    try {
      // Send credentials to whichever login route matches the selected auth mode.
      const response = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
        method: 'POST',
        headers: {
          // We send JSON, so tell the backend how to parse the body.
          'Content-Type': 'application/json',
        },
        // Cookie flow:
        // - `include` tells the browser it may accept and later send cookies
        //   for this cross-origin request (`5173` frontend -> `4000` backend).
        //
        // JWT flow:
        // - no cookie needs to be stored, so special credentials handling
        //   is not required for the token itself.
        credentials: authType === 'cookie' ? 'include' : 'same-origin',
        // Both flows start the same way: send username and password to a login route.
        body: JSON.stringify({ username, password }),
      });

      // Convert the backend response body into a JavaScript object.
      const data = await response.json();

      if (authType === 'jwt') {
        // JWT flow:
        // the backend returns a token string and the frontend must remember it.
        // Later we manually attach this token to the protected request.
        //
        // If login fails, `data.token` may be missing, so we fall back to ''.
        setJwtToken(data.token ?? '');
      } else {
        // Cookie flow:
        // there is no token for the frontend to manage.
        // The browser stores the cookie automatically after a successful login.
        //
        // We also clear any previously shown JWT because the student switched
        // into cookie mode and that old token is no longer relevant to the demo.
        setJwtToken('');
      }

      // Show the full login response so students can compare both modes.
      // This lets students inspect:
      // - the HTTP status code
      // - whether login succeeded
      // - whether a token was returned
      setAuthResponse(prettyJson({ status: response.status, data }));
    } catch (error) {
      // If the request fails before the backend answers, show the error directly.
      setAuthResponse(`Request failed: ${error.message}`);
    } finally {
      // Always stop the loading indicator, whether the request passed or failed.
      setIsLoading(false);
    }
  }

  // -------------------------------------------------
  // Step 2: Call a protected route after login
  // -------------------------------------------------
  // This function demonstrates how later requests carry authentication data.
  async function checkStatus() {
    // Again, mark the UI as busy while the request is running.
    setIsLoading(true);

    // We build headers dynamically because only JWT auth needs Authorization.
    // Cookie auth does not need a manual auth header in this demo.
    const headers = {};

    if (authType === 'jwt' && includeAuth && jwtToken) {
      // JWT flow:
      // the token is sent explicitly by the frontend in a Bearer header.
      // If the checkbox is off, we skip this header on purpose.
      //
      // This is the key JWT idea:
      // the frontend is responsible for attaching the token itself.
      headers.Authorization = `Bearer ${jwtToken}`;
    }

    try {
      // Call the protected endpoint for the currently selected auth mode.
      const response = await fetch(`${API_BASE_URL}${statusEndpoint}`, {
        method: 'GET',
        headers,
        // Cookie flow:
        // when the checkbox is on, `include` allows the browser to attach
        // the previously stored session cookie to the request.
        //
        // If the checkbox is off, the request is intentionally sent without
        // the cookie so students can observe the backend reject it.
        credentials: authType === 'cookie' && includeAuth ? 'include' : 'same-origin',
      });

      // Parse the backend result so it can be displayed on screen.
      const data = await response.json();
      // Show whether the protected route accepted or rejected the request.
      // This is where students can clearly see:
      // - authenticated success
      // - missing cookie failure
      // - missing JWT failure
      // - invalid token failure
      setStatusResponse(prettyJson({ status: response.status, data }));
    } catch (error) {
      // Network errors are displayed directly to keep the demo transparent.
      setStatusResponse(`Request failed: ${error.message}`);
    } finally {
      // Reset the loading flag after the protected request finishes.
      setIsLoading(false);
    }
  }

  // -----------------------------------------
  // Render the teaching UI
  // -----------------------------------------
  // The JSX below is intentionally simple:
  // - controls at the top
  // - route info in the middle
  // - backend responses at the bottom
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

        {/* These inputs represent the identity the user is trying to prove. */}
        {/* Students type the same credentials for both auth mechanisms. */}
        <div className="field-grid">
          <label className="field">
            <span>Username</span>
            <input
              // The username box is controlled by React state.
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="student"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              // The password box is also controlled by React state.
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password123"
            />
          </label>
        </div>

        {/* Selecting cookie mode means:
            "let the browser store and send a cookie after login."
            Selecting JWT mode means:
            "let the frontend store a token and send it manually later." */}
        {/* This switch changes both the login route and the protected route. */}
        <fieldset className="auth-switcher">
          <legend>Authentication type</legend>

          <label>
            <input
              type="radio"
              name="authType"
              checked={authType === 'cookie'}
              // Switch the demo into cookie/session mode.
              onChange={() => setAuthType('cookie')}
            />
            Cookie session
          </label>

          <label>
            <input
              type="radio"
              name="authType"
              checked={authType === 'jwt'}
              // Switch the demo into JWT/token mode.
              onChange={() => setAuthType('jwt')}
            />
            JWT token
          </label>
        </fieldset>

        {/* With the checkbox on:
            - cookie mode sends the session cookie
            - JWT mode sends the Bearer token

            With the checkbox off:
            - cookie mode omits the cookie
            - JWT mode omits the Authorization header

            This is useful because students can test both success and failure
            without changing the backend. */}
        {/* This checkbox lets students simulate "send auth" vs "do not send auth". */}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeAuth}
            onChange={(event) => setIncludeAuth(event.target.checked)}
          />
          Include authentication data when calling the protected route
        </label>

        {/* First button: prove identity with username/password.
            Second button: try to access a route that requires prior authentication. */}
        <div className="button-row">
          <button onClick={authenticate} disabled={isLoading}>
            {/* Login step:
                cookie mode => backend creates session + sends cookie
                JWT mode => backend returns token */}
            Authenticate
          </button>
          <button className="secondary" onClick={checkStatus} disabled={isLoading}>
            {/* Protected step:
                backend checks whatever auth material was attached to this request */}
            Call protected route
          </button>
        </div>

        {/* These route labels help students connect UI actions to backend endpoints.
            When the auth type changes, these route names change too. */}
        {/* These labels make the current backend routes visible to the student. */}
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

        {/* The two response panels help compare:
            1. what the backend returns during login
            2. what the backend returns when access is checked later */}
        <div className="response-grid">
          <section className="response-box">
            <h2>Authentication response</h2>
            {/* Students can inspect whether login succeeded, failed,
                or returned a token. */}
            <pre>{authResponse}</pre>
          </section>

          <section className="response-box">
            <h2>Protected route response</h2>
            {/* Students can inspect whether the protected request was accepted
                and why it was accepted or rejected. */}
            <pre>{statusResponse}</pre>
          </section>
        </div>

        {authType === 'jwt' && (
          // This section only appears in JWT mode because cookies are handled
          // automatically by the browser and do not need to be displayed here.
          <section className="token-box">
            <h2>Stored JWT</h2>
            {/* We show the raw JWT only because this app is for education.
                In a real product you would be more careful about how tokens are handled. */}
            {/* Students can see that JWT auth usually involves a client-managed token,
                unlike cookie auth where the browser manages the cookie automatically. */}
            <pre>{jwtToken || 'No token stored yet.'}</pre>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
