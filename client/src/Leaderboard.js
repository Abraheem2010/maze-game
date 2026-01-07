import { useEffect, useState } from 'react';

function Leaderboard() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    // פונקציה לרענון הנתונים
    const fetchRecords = () => {
      fetch('http://127.0.0.1:3000/api/records')
        .then(res => res.json())
        .then(data => setRecords(Array.isArray(data) ? data : []))
        .catch(() => setRecords([]));
    };

    fetchRecords();
    // אופציונלי: רענון כל 5 שניות כדי לראות שיאים חדשים בזמן אמת
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="leaderboard-wrapper">
      <h2>Hall of Fame</h2>
      <table className="leaderboard-table">
        <tbody>
          {[1, 2, 3].map(stage => {
            const r = records.find(x => x.stage === stage);
            return (
              <tr key={stage}>
                <td style={{ fontWeight: 'bold' }}>Level {stage}</td>
                <td>{r?.name || '---'}</td>
                <td style={{ color: '#084320ff', fontWeight: 'bold' }}>
                  {r?.time !== undefined ? `${parseFloat(r.time).toFixed(2)}s` : '---'}
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