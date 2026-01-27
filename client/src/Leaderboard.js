import { useEffect, useState, useCallback, Fragment } from "react";
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
    const interval = setInterval(fetchRecords, 300);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  return (
    <div className="leaderboard-wrapper">
      <h2>Hall of Fame</h2>
      <table className="leaderboard-table">
        <tbody>
          {[1, 2, 3].map((stage) => {
            const stageRecords = records
              .filter((x) => Number(x.stage) === stage)
              .sort((a, b) => Number(a.time) - Number(b.time))
              .slice(0, 3);

            return (
              <Fragment key={stage}>
                {[0, 1, 2].map((index) => {
                  const r = stageRecords[index];
                  return (
                    <tr key={`${stage}-${index}`}>
                      <td style={{ fontWeight: "bold" }}>
                        Level {stage} #{index + 1}
                      </td>
                      <td>{r?.name || "---"}</td>
                      <td style={{ color: "#084320ff", fontWeight: "bold" }}>
                        {r?.time !== undefined ? `${Number(r.time).toFixed(2)}s` : "---"}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
