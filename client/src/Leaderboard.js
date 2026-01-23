import { useEffect, useState, useCallback } from "react";
import { buildApiUrl } from "./api";

function Leaderboard() {
  const [records, setRecords] = useState([]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(buildApiUrl("/api/records"));
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  return (
    <div className="leaderboard-wrapper">
      <h2>Hall of Fame</h2>
      <table className="leaderboard-table">
        <tbody>
          {[1, 2, 3].map((stage) => {
            const r = records.find((x) => Number(x.stage) === stage);
            return (
              <tr key={stage}>
                <td style={{ fontWeight: "bold" }}>Level {stage}</td>
                <td>{r?.name || "---"}</td>
                <td style={{ color: "#084320ff", fontWeight: "bold" }}>
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
