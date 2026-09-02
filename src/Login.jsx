import { useState } from "react";

function Login({ onLogin }) {

  const [role, setRole] = useState("Welfare Officer");

  const handleLogin = (event) => {
    event.preventDefault();

    onLogin(role);
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>SentinelMind</h1>

        <p className="login-subtitle">
          Personnel Stress & Welfare Monitoring
        </p>

        <h2>Secure Access</h2>

        <form onSubmit={handleLogin}>

          <label>
            Role
          </label>

          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
          >

            <option value="Welfare Officer">
              Welfare Officer
            </option>

            <option value="Commander">
              Commander
            </option>

            <option value="Personnel">
              Personnel
            </option>

          </select>

          <button
            type="submit"
            className="analysis-button"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;