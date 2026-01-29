import { useEffect, useState, useCallback } from "react";
import { buildApiUrl } from "./api";

function Leaderboard() {
  const [records, setRecords] = useState([]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(buildApiUrl("/api/records") + "?t=" + Date.now());
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 1500);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  return (
    <div className="leaderboard-wrapper">
      <h2>Best Records</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>Name</th>
            <th>Best Time</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((stage) => {
            const r = records.find((x) => Number(x.stage) === stage);
            return (
              <tr key={stage}>
                <td style={{ fontWeight: "bold" }}>{stage}</td>
                <td>{r?.name || "---"}</td>
                <td style={{ color: "#084320ff", fontWeight: "bold", textAlign: "right" }}>
                  {r?.time !== undefined ? `${Number(r.time).toFixed(2)}s` : "---"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
