import { useState } from "react";

function Login({ onLogin }) {

  const [role, setRole] = useState("Welfare Officer");

  const [personnelId, setPersonnelId] =
    useState("P32120");


  const handleLogin = (event) => {

    event.preventDefault();

    onLogin(
      role,
      role === "Personnel"
        ? personnelId
        : null
    );

  };


  return (

    <div className="login-page">

      <div className="login-card">

        <h1>
          SentinelMind
        </h1>

        <p className="login-subtitle">
          Personnel Stress & Welfare Monitoring
        </p>

        <h2>
          Secure Access
        </h2>


        <form onSubmit={handleLogin}>


          {/* ROLE */}

          <label>
            Role
          </label>

          <select
            value={role}
            onChange={(event) => {

              setRole(
                event.target.value
              );

            }}
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


          {/* PERSONNEL ID */}

          {role === "Personnel" && (

            <>

              <label>
                Personnel ID
              </label>

              <input
                type="text"
                value={personnelId}
                onChange={(event) => {

                  setPersonnelId(
                    event.target.value
                  );

                }}
                placeholder="e.g. P32120"
                required
              />

            </>

          )}


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