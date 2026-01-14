import { useEffect, useState } from 'react';

function Leaderboard() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchRecords = () => {
      fetch('/api/records')
        .then(res => res.json())
        .then(data => setRecords(Array.isArray(data) ? data : []))
        .catch(() => setRecords([]));
    };

    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="leaderboard-wrapper">
      <h2>Hall of Fame</h2>
      <table className="leaderboard-table">
        <tbody>
          {[1, 2, 3].map(stage => {
            const r = records.find(x => Number(x.stage) === stage);
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
