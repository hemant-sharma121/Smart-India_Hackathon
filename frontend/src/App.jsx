import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";


function App() {

  // =====================================================
  // LOGIN STATE
  // =====================================================

  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [loggedInPersonnelId, setLoggedInPersonnelId] =
    useState("");


  // =====================================================
  // DASHBOARD STATE
  // =====================================================

  const [dashboard, setDashboard] = useState(null);

  const [personnelList, setPersonnelList] = useState([]);

  const [selectedPersonnelId, setSelectedPersonnelId] =
    useState("");

  const [analysis, setAnalysis] = useState(null);

  const [trend, setTrend] = useState(null);

  const [latestWellness, setLatestWellness] =
    useState(null);

  const [auditLogs, setAuditLogs] = useState([]);

  const [error, setError] = useState("");

  const [checkinMessage, setCheckinMessage] =
    useState("");


  // =====================================================
  // WELLNESS FORM
  // =====================================================

  const [wellnessForm, setWellnessForm] = useState({
    sleep_hours: "",
    stress_level: "",
    energy_level: "",
    wellness_score: "",
    workload_level: "Medium"
  });


  // =====================================================
  // AUDIT LOG HELPER
  // =====================================================

  const createAuditLog = async (
    action,
    personnelId = null
  ) => {

    try {

      const params = new URLSearchParams();

      params.append(
        "user_role",
        userRole
      );

      params.append(
        "action",
        action
      );

      if (personnelId) {

        params.append(
          "personnel_id",
          personnelId
        );

      }

      await fetch(
        `http://127.0.0.1:8000/audit-log?${params.toString()}`,
        {
          method: "POST"
        }
      );

    } catch (error) {

      console.error(
        "Audit log error:",
        error
      );

    }

  };


  // =====================================================
  // REFRESH AUDIT LOGS
  // =====================================================

  const refreshAuditLogs = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/audit-logs"
      );

      if (response.ok) {

        const data =
          await response.json();

        setAuditLogs(data);

      }

    } catch (error) {

      console.error(
        "Could not refresh audit logs:",
        error
      );

    }

  };


  // =====================================================
  // LOAD DASHBOARD + PERSONNEL + AUDIT LOGS
  // =====================================================

  useEffect(() => {

    Promise.all([
      fetch(
        "http://127.0.0.1:8000/dashboard/summary"
      ),

      fetch(
        "http://127.0.0.1:8000/personnel"
      ),

      fetch(
        "http://127.0.0.1:8000/audit-logs"
      )
    ])

      .then(
        async ([
          dashboardResponse,
          personnelResponse,
          auditResponse
        ]) => {

          if (!dashboardResponse.ok) {

            throw new Error(
              "Could not load dashboard"
            );

          }

          if (!personnelResponse.ok) {

            throw new Error(
              "Could not load personnel"
            );

          }

          if (!auditResponse.ok) {

            throw new Error(
              "Could not load audit logs"
            );

          }

          return {

            dashboardData:
              await dashboardResponse.json(),

            personnelData:
              await personnelResponse.json(),

            auditData:
              await auditResponse.json()

          };

        }
      )

      .then(
        ({
          dashboardData,
          personnelData,
          auditData
        }) => {

          setDashboard(
            dashboardData
          );

          setPersonnelList(
            personnelData
          );

          setAuditLogs(
            auditData
          );


          if (
            personnelData.length > 0
          ) {

            setSelectedPersonnelId(
              personnelData[0].personnel_id
            );

          }

        }
      )

      .catch((err) => {

        setError(
          err.message
        );

      });

  }, []);


  // =====================================================
  // LOAD PERSONNEL ANALYSIS
  // =====================================================

  const loadAnalysis = async () => {

    if (!selectedPersonnelId) {
      return;
    }

    try {

      setError("");


      // AI ANALYSIS

      const analysisResponse =
        await fetch(
          `http://127.0.0.1:8000/personnel/${selectedPersonnelId}/analysis`
        );


      if (!analysisResponse.ok) {

        throw new Error(
          "Could not load personnel analysis"
        );

      }


      const analysisData =
        await analysisResponse.json();


      setAnalysis(
        analysisData
      );


      // WELLNESS TREND

      const trendResponse =
        await fetch(
          `http://127.0.0.1:8000/wellness-checkins/${selectedPersonnelId}/trend`
        );


      if (!trendResponse.ok) {

        throw new Error(
          "Could not load wellness trend"
        );

      }


      const trendData =
        await trendResponse.json();


      setTrend(
        trendData
      );


      // LATEST WELLNESS

      const latestResponse =
        await fetch(
          `http://127.0.0.1:8000/wellness-checkins/${selectedPersonnelId}/latest`
        );


      if (!latestResponse.ok) {

        throw new Error(
          "Could not load latest wellness"
        );

      }


      const latestData =
        await latestResponse.json();


      setLatestWellness(
        latestData
      );


      // AUDIT

      await createAuditLog(
        userRole === "Personnel"
          ? "Viewed own wellness"
          : "Viewed personnel analysis",
        selectedPersonnelId
      );


      await refreshAuditLogs();

    } catch (err) {

      setError(
        err.message
      );

    }

  };


  // =====================================================
  // HANDLE WELLNESS FORM INPUT
  // =====================================================

  const handleWellnessChange = (
    event
  ) => {

    const {
      name,
      value
    } = event.target;


    setWellnessForm(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );


    setCheckinMessage("");

  };


  // =====================================================
  // SUBMIT WELLNESS CHECK-IN
  // =====================================================

  const submitWellnessCheckin =
    async (event) => {

      event.preventDefault();

      setError("");
      setCheckinMessage("");


      if (!selectedPersonnelId) {

        setCheckinMessage(
          "Please select a personnel member."
        );

        return;

      }


      try {

        const payload = {

          personnel_id:
            selectedPersonnelId,

          sleep_hours:
            Number(
              wellnessForm.sleep_hours
            ),

          stress_level:
            Number(
              wellnessForm.stress_level
            ),

          energy_level:
            Number(
              wellnessForm.energy_level
            ),

          wellness_score:
            Number(
              wellnessForm.wellness_score
            ),

          workload_level:
            wellnessForm.workload_level

        };


        // SAVE CHECK-IN

        const response =
          await fetch(
            "http://127.0.0.1:8000/wellness-checkin",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )

            }
          );


        if (!response.ok) {

          throw new Error(
            "Could not save wellness check-in"
          );

        }


        const savedCheckin =
          await response.json();


        // AUDIT

        await createAuditLog(
          "Submitted wellness check-in",
          selectedPersonnelId
        );


        setCheckinMessage(
          `Check-in saved successfully. ID: ${savedCheckin.checkin_id}`
        );


        // REFRESH LATEST ANALYSIS

        await loadAnalysis();


        // REFRESH DASHBOARD SUMMARY

        const dashboardResponse =
          await fetch(
            "http://127.0.0.1:8000/dashboard/summary"
          );


        if (dashboardResponse.ok) {

          const dashboardData =
            await dashboardResponse.json();

          setDashboard(
            dashboardData
          );

        }


        // CLEAR FORM

        setWellnessForm({

          sleep_hours: "",

          stress_level: "",

          energy_level: "",

          wellness_score: "",

          workload_level: "Medium"

        });

      } catch (err) {

        setCheckinMessage(
          err.message
        );

      }

    };


  // =====================================================
  // LOGIN
  // =====================================================

  if (!loggedIn) {

    return (

      <Login
        onLogin={(
          role,
          personnelId
        ) => {

          setUserRole(
            role
          );


          setLoggedInPersonnelId(
            personnelId || ""
          );


          setSelectedPersonnelId(
            personnelId || ""
          );


          setLoggedIn(
            true
          );

        }}
      />

    );

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (!dashboard) {

    return (

      <div className="app">

        <header className="header">

          <div>

            <h1>
              SentinelMind
            </h1>

            <p>
              Personnel Stress & Welfare Monitoring
            </p>

          </div>

        </header>


        <main>

          {error ? (

            <p className="error">
              {error}
            </p>

          ) : (

            <p>
              Loading dashboard...
            </p>

          )}

        </main>

      </div>

    );

  }


  // =====================================================
  // HEADER
  // =====================================================

  const header = (

    <header className="header">

      <div>

        <h1>
          SentinelMind
        </h1>

        <p>
          Personnel Stress & Welfare Monitoring
        </p>

      </div>


      <div className="header-right">

        <div className="status">
          ● System Online
        </div>

        <small>
          Role: {userRole}
        </small>


        <button
          className="logout-button"
          onClick={() => {

            setLoggedIn(
              false
            );

            setUserRole("");

            setLoggedInPersonnelId("");

            setAnalysis(null);

            setTrend(null);

            setLatestWellness(null);

            setCheckinMessage("");

          }}
        >

          Logout

        </button>

      </div>

    </header>

  );


  // =====================================================
  // SUMMARY CARDS
  // =====================================================

  const summaryCards = (

    <section className="cards">

      <div className="card">

        <h3>
          Total Personnel
        </h3>

        <p className="number">
          {dashboard.total_personnel}
        </p>

      </div>


      <div className="card">

        <h3>
          High Risk
        </h3>

        <p className="number high">
          {dashboard.high_risk}
        </p>

      </div>


      <div className="card">

        <h3>
          Moderate Risk
        </h3>

        <p className="number moderate">
          {dashboard.moderate_risk}
        </p>

      </div>


      <div className="card">

        <h3>
          Low Risk
        </h3>

        <p className="number low">
          {dashboard.low_risk}
        </p>

      </div>

    </section>

  );


  // =====================================================
  // COMMANDER VIEW
  // =====================================================

  if (userRole === "Commander") {

    return (

      <div className="app">

        {header}

        <main>

          {summaryCards}


          <section className="panel">

            <h2>
              Command Overview
            </h2>

            <p>
              This view provides aggregated
              welfare-risk information without
              displaying individual wellness
              details.
            </p>


            <div className="cards">

              <div className="card">

                <h3>
                  Personnel Monitored
                </h3>

                <p className="number">
                  {dashboard.total_personnel}
                </p>

              </div>


              <div className="card">

                <h3>
                  Current High Risk
                </h3>

                <p className="number high">
                  {dashboard.high_risk}
                </p>

              </div>


              <div className="card">

                <h3>
                  Current Moderate Risk
                </h3>

                <p className="number moderate">
                  {dashboard.moderate_risk}
                </p>

              </div>


              <div className="card">

                <h3>
                  Current Low Risk
                </h3>

                <p className="number low">
                  {dashboard.low_risk}
                </p>

              </div>

            </div>


            <div className="disclaimer">

              Individual wellness and
              contributing-factor details are
              restricted in the Commander view.

            </div>

          </section>


          <div className="disclaimer">

            SentinelMind is designed as a
            welfare-support system.

            <br />

            Risk outputs are indicators, not
            clinical diagnoses. Human review is
            required before intervention.

          </div>

        </main>

      </div>

    );

  }


  // =====================================================
  // PERSONNEL VIEW
  // =====================================================

  if (userRole === "Personnel") {

    return (

      <div className="app">

        {header}

        <main>

          <section className="panel">

            <h2>
              My Wellness
            </h2>

            <p>
              Your wellness information is
              presented for your own review.
            </p>


            <div className="trend-card">

              <h3>
                Personnel ID
              </h3>

              <strong>
                {loggedInPersonnelId}
              </strong>

            </div>


            <button
              className="analysis-button"
              onClick={loadAnalysis}
            >

              View My Wellness

            </button>


            {latestWellness && (

              <div className="trend-card">

                <h3>
                  Latest Wellness
                </h3>

                <p>
                  Sleep:{" "}
                  {latestWellness.sleep_hours}
                  {" "}hours
                </p>

                <p>
                  Stress:{" "}
                  {latestWellness.stress_level}/10
                </p>

                <p>
                  Energy:{" "}
                  {latestWellness.energy_level}/10
                </p>

                <p>
                  Wellness:{" "}
                  {latestWellness.wellness_score}/100
                </p>

                <p>
                  Workload:{" "}
                  {latestWellness.workload_level}
                </p>

              </div>

            )}


            {trend && (

              <div className="trend-card">

                <h3>
                  My Wellness Trend
                </h3>

                <p>
                  Wellness:{" "}
                  {trend.wellness_trend}
                </p>

                <p>
                  Stress:{" "}
                  {trend.stress_trend}
                </p>

                <p>
                  Sleep:{" "}
                  {trend.sleep_trend}
                </p>

              </div>

            )}

          </section>


          <div className="disclaimer">

            SentinelMind is designed as a
            welfare-support system.

            <br />

            Risk outputs are indicators, not
            clinical diagnoses.

          </div>

        </main>

      </div>

    );

  }


  // =====================================================
  // WELFARE OFFICER VIEW
  // =====================================================

  return (

    <div className="app">

      {header}

      <main>

        {summaryCards}


        {/* RECENT ASSESSMENTS */}

        <section className="panel">

          <h2>
            Recent Risk Assessments
          </h2>


          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>
                    Personnel ID
                  </th>

                  <th>
                    Risk Score
                  </th>

                  <th>
                    Risk Level
                  </th>

                  <th>
                    Assessment Time
                  </th>

                </tr>

              </thead>


              <tbody>

                {dashboard.recent_predictions.map(
                  (
                    prediction,
                    index
                  ) => (

                    <tr key={index}>

                      <td>
                        {prediction.personnel_id}
                      </td>


                      <td>

                        {Number(
                          prediction.risk_score
                        ).toFixed(2)}
                        %

                      </td>


                      <td>

                        <span
                          className={`badge ${prediction.risk_level.toLowerCase()}`}
                        >

                          {
                            prediction.risk_level
                          }

                        </span>

                      </td>


                      <td>

                        {
                          prediction.created_at
                            ? new Date(
                                prediction.created_at
                              ).toLocaleString()
                            : "Not available"
                        }

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* PERSONNEL ANALYSIS */}

        <section className="panel">

          <div className="analysis-header">

            <div>

              <h2>
                Personnel Risk Analysis
              </h2>

              <p>
                Select a personnel member
              </p>

            </div>


            <div className="personnel-selector">

              <select
                value={
                  selectedPersonnelId
                }
                onChange={(event) => {

                  setSelectedPersonnelId(
                    event.target.value
                  );

                  setAnalysis(
                    null
                  );

                  setTrend(
                    null
                  );

                  setLatestWellness(
                    null
                  );

                  setCheckinMessage(
                    ""
                  );

                }}
              >

                {personnelList.map(
                  (person) => (

                    <option
                      key={
                        person.personnel_id
                      }
                      value={
                        person.personnel_id
                      }
                    >

                      {
                        person.personnel_id
                      }

                    </option>

                  )
                )}

              </select>


              <button
                className="analysis-button"
                onClick={loadAnalysis}
              >

                Analyze Personnel

              </button>

            </div>

          </div>


          {!analysis && (

            <div className="empty-analysis">

              <p>
                Select a personnel member
                and click "Analyze Personnel".
              </p>

            </div>

          )}


          {analysis && (

            <div>


              {/* RISK + FACTORS + RECOMMENDATIONS */}

              <div className="analysis-grid">


                {/* RISK */}

                <div className="analysis-card">

                  <h3>
                    Welfare Risk
                  </h3>


                  <div
                    className={`risk-large ${analysis.risk_level.toLowerCase()}`}
                  >

                    {
                      analysis.risk_level
                    }

                  </div>


                  <p className="risk-score">

                    {Number(
                      analysis.risk_score
                    ).toFixed(2)}
                    %

                  </p>


                  <p className="risk-note">

                    Model-generated welfare
                    risk indicator

                  </p>

                </div>


                {/* FACTORS */}

                <div className="analysis-card">

                  <h3>
                    Top Contributing Factors
                  </h3>


                  <div className="factor-list">

                    {analysis.contributing_factors.map(
                      (
                        factor,
                        index
                      ) => (

                        <div
                          className="factor"
                          key={index}
                        >

                          <div>

                            <strong>
                              {factor.feature}
                            </strong>

                            <small>
                              Value: {factor.value}
                            </small>

                          </div>


                          <span
                            className={
                              factor.direction ===
                              "INCREASES risk"
                                ? "factor-up"
                                : "factor-down"
                            }
                          >

                            {
                              factor.direction
                            }

                          </span>

                        </div>

                      )
                    )}

                  </div>

                </div>


                {/* RECOMMENDATIONS */}

                <div className="analysis-card">

                  <h3>
                    Welfare Recommendations
                  </h3>


                  <ul>

                    {analysis.recommendations.map(
                      (
                        recommendation,
                        index
                      ) => (

                        <li key={index}>
                          {recommendation}
                        </li>

                      )
                    )}

                  </ul>

                </div>

              </div>


              {/* WELLNESS CHECK-IN */}

              <div className="trend-card">

                <h3>
                  Voluntary Wellness Check-in
                </h3>


                <p className="form-description">

                  Submit a voluntary wellness
                  assessment for the selected
                  personnel member.

                </p>


                <form
                  className="wellness-form"
                  onSubmit={
                    submitWellnessCheckin
                  }
                >


                  <div className="form-field">

                    <label>
                      Sleep Hours
                    </label>

                    <input
                      type="number"
                      name="sleep_hours"
                      min="0"
                      max="24"
                      step="0.1"
                      value={
                        wellnessForm.sleep_hours
                      }
                      onChange={
                        handleWellnessChange
                      }
                      required
                    />

                  </div>


                  <div className="form-field">

                    <label>
                      Stress Level (0-10)
                    </label>

                    <input
                      type="number"
                      name="stress_level"
                      min="0"
                      max="10"
                      step="0.1"
                      value={
                        wellnessForm.stress_level
                      }
                      onChange={
                        handleWellnessChange
                      }
                      required
                    />

                  </div>


                  <div className="form-field">

                    <label>
                      Energy Level (0-10)
                    </label>

                    <input
                      type="number"
                      name="energy_level"
                      min="0"
                      max="10"
                      step="0.1"
                      value={
                        wellnessForm.energy_level
                      }
                      onChange={
                        handleWellnessChange
                      }
                      required
                    />

                  </div>


                  <div className="form-field">

                    <label>
                      Wellness Score (0-100)
                    </label>

                    <input
                      type="number"
                      name="wellness_score"
                      min="0"
                      max="100"
                      step="1"
                      value={
                        wellnessForm.wellness_score
                      }
                      onChange={
                        handleWellnessChange
                      }
                      required
                    />

                  </div>


                  <div className="form-field">

                    <label>
                      Workload Level
                    </label>

                    <select
                      name="workload_level"
                      value={
                        wellnessForm.workload_level
                      }
                      onChange={
                        handleWellnessChange
                      }
                    >

                      <option value="Low">
                        Low
                      </option>

                      <option value="Medium">
                        Medium
                      </option>

                      <option value="High">
                        High
                      </option>

                    </select>

                  </div>


                  <button
                    type="submit"
                    className="analysis-button"
                  >

                    Submit Wellness Check-in

                  </button>

                </form>


                {checkinMessage && (

                  <p className="checkin-message">
                    {checkinMessage}
                  </p>

                )}

              </div>


              {/* LATEST WELLNESS */}

              {latestWellness && (

                <div className="trend-card">

                  <h3>
                    Latest Wellness Check-in
                  </h3>


                  <div className="trend-summary">

                    <div>

                      <span>
                        Sleep
                      </span>

                      <strong>
                        {
                          latestWellness.sleep_hours
                        } hrs
                      </strong>

                    </div>


                    <div>

                      <span>
                        Stress
                      </span>

                      <strong>
                        {
                          latestWellness.stress_level
                        }/10
                      </strong>

                    </div>


                    <div>

                      <span>
                        Energy
                      </span>

                      <strong>
                        {
                          latestWellness.energy_level
                        }/10
                      </strong>

                    </div>


                    <div>

                      <span>
                        Wellness
                      </span>

                      <strong>
                        {
                          latestWellness.wellness_score
                        }/100
                      </strong>

                    </div>


                    <div>

                      <span>
                        Workload
                      </span>

                      <strong>
                        {
                          latestWellness.workload_level
                        }
                      </strong>

                    </div>

                  </div>

                </div>

              )}


              {/* WELLNESS TREND */}

              {trend && (

                <div className="trend-card">

                  <h3>
                    Wellness Trend
                  </h3>


                  <div className="trend-summary">

                    <div>

                      <span>
                        Average Wellness
                      </span>

                      <strong>
                        {
                          trend.average_wellness_score
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Average Stress
                      </span>

                      <strong>
                        {
                          trend.average_stress_level
                        }/10
                      </strong>

                    </div>


                    <div>

                      <span>
                        Average Sleep
                      </span>

                      <strong>
                        {
                          trend.average_sleep_hours
                        } hrs
                      </strong>

                    </div>

                  </div>


                  <div className="chart-container">

                    <ResponsiveContainer
                      width="100%"
                      height={320}
                    >

                      <LineChart
                        data={
                          trend.history
                        }
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="checkin_id"
                        />

                        <YAxis
                          domain={[
                            0,
                            100
                          ]}
                        />

                        <Tooltip />

                        <Line
                          type="monotone"
                          dataKey="wellness_score"
                          name="Wellness Score"
                          strokeWidth={3}
                          dot={{
                            r: 5
                          }}
                        />

                      </LineChart>

                    </ResponsiveContainer>

                  </div>


                  <div className="trend-status">

                    <span>

                      Wellness:{" "}

                      <strong>
                        {
                          trend.wellness_trend
                        }
                      </strong>

                    </span>


                    <span>

                      Stress:{" "}

                      <strong>
                        {
                          trend.stress_trend
                        }
                      </strong>

                    </span>


                    <span>

                      Sleep:{" "}

                      <strong>
                        {
                          trend.sleep_trend
                        }
                      </strong>

                    </span>

                  </div>

                </div>

              )}

            </div>

          )}

        </section>


        {/* AUDIT TRAIL */}

        <section className="panel">

          <h2>
            Audit Trail
          </h2>


          {auditLogs.length === 0 ? (

            <p>
              No audit events recorded.
            </p>

          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Role
                    </th>

                    <th>
                      Action
                    </th>

                    <th>
                      Personnel ID
                    </th>

                    <th>
                      Time
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {auditLogs.map(
                    (log, index) => (

                      <tr key={index}>

                        <td>
                          {log.user_role}
                        </td>

                        <td>
                          {log.action}
                        </td>

                        <td>
                          {
                            log.personnel_id
                            || "-"
                          }
                        </td>

                        <td>

                          {
                            log.created_at
                              ? new Date(
                                  log.created_at
                                ).toLocaleString()
                              : "Not available"
                          }

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* DISCLAIMER */}

        <div className="disclaimer">

          <strong>
            Important:
          </strong>

          {" "}

          SentinelMind is designed as a
          welfare-support system.

          <br />

          Risk outputs are indicators, not
          clinical diagnoses. Human review is
          required before intervention.

        </div>

      </main>

    </div>
  );
}


export default App;