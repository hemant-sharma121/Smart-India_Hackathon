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
  // STATE
  // =====================================================

  const [dashboard, setDashboard] = useState(null);

  const [personnelList, setPersonnelList] = useState([]);

  const [selectedPersonnelId, setSelectedPersonnelId] =
    useState("");

  const [analysis, setAnalysis] = useState(null);

  const [trend, setTrend] = useState(null);

  const [latestWellness, setLatestWellness] =
    useState(null);

  const [error, setError] = useState("");

  const [checkinMessage, setCheckinMessage] =
    useState("");

  const [wellnessForm, setWellnessForm] = useState({
    sleep_hours: "",
    stress_level: "",
    energy_level: "",
    wellness_score: "",
    workload_level: "Medium"
  });


  // =====================================================
  // LOAD DASHBOARD + PERSONNEL
  // =====================================================

  useEffect(() => {
    Promise.all([
      fetch(
        "http://127.0.0.1:8000/dashboard/summary"
      ),

      fetch(
        "http://127.0.0.1:8000/personnel"
      )
    ])

      .then(
        async ([
          dashboardResponse,
          personnelResponse
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

          return {
            dashboardData:
              await dashboardResponse.json(),

            personnelData:
              await personnelResponse.json()
          };
        }
      )

      .then(
        ({
          dashboardData,
          personnelData
        }) => {
          setDashboard(dashboardData);

          setPersonnelList(personnelData);

          if (personnelData.length > 0) {
            setSelectedPersonnelId(
              personnelData[0].personnel_id
            );
          }
        }
      )

      .catch((err) => {
        setError(err.message);
      });
  }, []);


  // =====================================================
  // LOAD COMPLETE PERSONNEL ANALYSIS
  // =====================================================

  const loadAnalysis = async () => {
    if (!selectedPersonnelId) {
      return;
    }

    try {
      setError("");

      // -----------------------------------------------
      // 1. AI analysis
      // -----------------------------------------------

      const analysisResponse = await fetch(
        `http://127.0.0.1:8000/personnel/${selectedPersonnelId}/analysis`
      );

      if (!analysisResponse.ok) {
        throw new Error(
          "Could not load personnel analysis"
        );
      }

      const analysisData =
        await analysisResponse.json();

      setAnalysis(analysisData);


      // -----------------------------------------------
      // 2. Wellness trend
      // -----------------------------------------------

      const trendResponse = await fetch(
        `http://127.0.0.1:8000/wellness-checkins/${selectedPersonnelId}/trend`
      );

      if (!trendResponse.ok) {
        throw new Error(
          "Could not load wellness trend"
        );
      }

      const trendData =
        await trendResponse.json();

      setTrend(trendData);


      // -----------------------------------------------
      // 3. Latest wellness
      // -----------------------------------------------

      const latestResponse = await fetch(
        `http://127.0.0.1:8000/wellness-checkins/${selectedPersonnelId}/latest`
      );

      if (!latestResponse.ok) {
        throw new Error(
          "Could not load latest wellness"
        );
      }

      const latestData =
        await latestResponse.json();

      setLatestWellness(latestData);

    } catch (err) {
      setError(err.message);
    }
  };


  // =====================================================
  // HANDLE WELLNESS FORM
  // =====================================================

  const handleWellnessChange = (event) => {
    const {
      name,
      value
    } = event.target;

    setWellnessForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setCheckinMessage("");
  };


  // =====================================================
  // SUBMIT WELLNESS CHECK-IN
  // =====================================================

  const submitWellnessCheckin = async (event) => {
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
      // -----------------------------------------------
      // 1. Prepare data
      // -----------------------------------------------

      const payload = {
        personnel_id: selectedPersonnelId,

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


      // -----------------------------------------------
      // 2. Save wellness check-in
      // -----------------------------------------------

      const response = await fetch(
        "http://127.0.0.1:8000/wellness-checkin",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not save wellness check-in"
        );
      }

      const savedCheckin =
        await response.json();

      setCheckinMessage(
        `Check-in saved successfully. ID: ${savedCheckin.checkin_id}`
      );


      // -----------------------------------------------
      // 3. Get latest wellness
      // -----------------------------------------------

      const latestResponse = await fetch(
        `http://127.0.0.1:8000/wellness-checkins/${selectedPersonnelId}/latest`
      );

      if (!latestResponse.ok) {
        throw new Error(
          "Could not refresh latest wellness"
        );
      }

      const latestData =
        await latestResponse.json();

      setLatestWellness(latestData);


      // -----------------------------------------------
      // 4. Get updated trend
      // -----------------------------------------------

      const trendResponse = await fetch(
        `http://127.0.0.1:8000/wellness-checkins/${selectedPersonnelId}/trend`
      );

      if (!trendResponse.ok) {
        throw new Error(
          "Could not refresh wellness trend"
        );
      }

      const trendData =
        await trendResponse.json();

      setTrend(trendData);


      // -----------------------------------------------
      // 5. IMPORTANT:
      //    Re-run AI after new check-in
      // -----------------------------------------------

      const analysisResponse = await fetch(
        `http://127.0.0.1:8000/personnel/${selectedPersonnelId}/analysis`
      );

      if (!analysisResponse.ok) {
        throw new Error(
          "Could not refresh risk analysis"
        );
      }

      const analysisData =
        await analysisResponse.json();

      setAnalysis(analysisData);


      // -----------------------------------------------
      // 6. Clear form
      // -----------------------------------------------

      setWellnessForm({
        sleep_hours: "",
        stress_level: "",
        energy_level: "",
        wellness_score: "",
        workload_level: "Medium"
      });

    } catch (err) {
      setCheckinMessage(err.message);
    }
  };


  // =====================================================
  // LOADING SCREEN
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
  // DASHBOARD
  // =====================================================

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div>

          <h1>
            SentinelMind
          </h1>

          <p>
            Personnel Stress & Welfare Monitoring
          </p>

        </div>

        <div className="status">
          ● System Online
        </div>

      </header>


      <main>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

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


        {/* =================================================
            RECENT RISK ASSESSMENTS
        ================================================= */}

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
                  (prediction, index) => (

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
                          {prediction.risk_level}
                        </span>

                      </td>

                      <td>

                        {prediction.created_at
                          ? new Date(
                              prediction.created_at
                            ).toLocaleString()
                          : "Not available"}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* =================================================
            PERSONNEL ANALYSIS
        ================================================= */}

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
                value={selectedPersonnelId}
                onChange={(event) => {

                  setSelectedPersonnelId(
                    event.target.value
                  );

                  setAnalysis(null);
                  setTrend(null);
                  setLatestWellness(null);
                  setCheckinMessage("");

                }}
              >

                {personnelList.map(
                  (person) => (

                    <option
                      key={person.personnel_id}
                      value={person.personnel_id}
                    >
                      {person.personnel_id}
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


          {/* ===============================================
              BEFORE ANALYSIS
          ================================================ */}

          {!analysis && (

            <div className="empty-analysis">

              <p>
                Select a personnel member and
                click "Analyze Personnel".
              </p>

            </div>

          )}


          {/* ===============================================
              AFTER ANALYSIS
          ================================================ */}

          {analysis && (

            <div>

              {/* =========================================
                  RISK + FACTORS + RECOMMENDATIONS
              ========================================== */}

              <div className="analysis-grid">


                {/* RISK */}

                <div className="analysis-card">

                  <h3>
                    Welfare Risk
                  </h3>

                  <div
                    className={`risk-large ${analysis.risk_level.toLowerCase()}`}
                  >
                    {analysis.risk_level}
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
                      (factor, index) => (

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
                            {factor.direction}
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


              {/* =========================================
                  WELLNESS CHECK-IN FORM
              ========================================== */}

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
                      placeholder="e.g. 7.0"
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
                      placeholder="e.g. 5"
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
                      placeholder="e.g. 7"
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
                      placeholder="e.g. 75"
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


              {/* =========================================
                  LATEST WELLNESS
              ========================================== */}

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
                        {latestWellness.sleep_hours}
                        {" "}hrs
                      </strong>

                    </div>


                    <div>

                      <span>
                        Stress
                      </span>

                      <strong>
                        {latestWellness.stress_level}/10
                      </strong>

                    </div>


                    <div>

                      <span>
                        Energy
                      </span>

                      <strong>
                        {latestWellness.energy_level}/10
                      </strong>

                    </div>


                    <div>

                      <span>
                        Wellness
                      </span>

                      <strong>
                        {latestWellness.wellness_score}/100
                      </strong>

                    </div>


                    <div>

                      <span>
                        Workload
                      </span>

                      <strong>
                        {latestWellness.workload_level}
                      </strong>

                    </div>

                  </div>

                </div>

              )}


              {/* =========================================
                  WELLNESS TREND
              ========================================== */}

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
                        {trend.average_wellness_score}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Average Stress
                      </span>

                      <strong>
                        {trend.average_stress_level}/10
                      </strong>

                    </div>


                    <div>

                      <span>
                        Average Sleep
                      </span>

                      <strong>
                        {trend.average_sleep_hours}
                        {" "}hrs
                      </strong>

                    </div>

                  </div>


                  <div className="chart-container">

                    <ResponsiveContainer
                      width="100%"
                      height={320}
                    >

                      <LineChart
                        data={trend.history}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 0,
                          bottom: 20
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="checkin_id"
                        />

                        <YAxis
                          domain={[0, 100]}
                        />

                        <Tooltip />

                        <Line
                          type="monotone"
                          dataKey="wellness_score"
                          name="Wellness Score"
                          strokeWidth={3}
                          dot={{ r: 5 }}
                        />

                      </LineChart>

                    </ResponsiveContainer>

                  </div>


                  <div className="trend-status">

                    <span>
                      Wellness:{" "}
                      <strong>
                        {trend.wellness_trend}
                      </strong>
                    </span>


                    <span>
                      Stress:{" "}
                      <strong>
                        {trend.stress_trend}
                      </strong>
                    </span>


                    <span>
                      Sleep:{" "}
                      <strong>
                        {trend.sleep_trend}
                      </strong>
                    </span>

                  </div>

                </div>

              )}

            </div>

          )}

        </section>


        {/* =================================================
            DISCLAIMER
        ================================================= */}

        {analysis && (

          <div className="disclaimer">

            <strong>
              Important:
            </strong>

            {" "}

            This output is a welfare risk indicator,
            not a clinical diagnosis.

            <br />

            Human review is required before
            intervention.

          </div>

        )}

      </main>

    </div>
  );
}


export default App;