import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from 'chart.js';

Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

const MINI_BACKEND_URL = 'http://localhost:18081';
const MAIN_BACKEND_URL = 'http://localhost:18080';

const generateTestValues = () => {
  const result = [];
  const max = 500000;
  const step = 1000;
  for (let i = 0; i <= max; i += step) {
    const a = i;
    const b = i * 1.5;
    result.push([a, b]);
  }
  return result;
};

const computeAverages = (results) => {
  const avg = (key) =>
    results.reduce((sum, r) => sum + r[key], 0) / results.length;
  return {
    encrypt: (avg('encryptA') + avg('encryptB')) / 2,
    add: avg('add'),
    decrypt: avg('decrypt'),
    total: avg('total'),
    error: avg('error'),
    ramEncrypt: avg('ramA') + avg('ramB'),
    ramAdd: avg('ramAdd'),
    ramDecrypt: avg('ramDecrypt'),
  };
};

const testValues = generateTestValues();

function Experiment() {
  const [bfvResults, setBfvResults] = useState([]);
  const [ckksResults, setCkksResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const totalRuns = 30;

  const averageResultArrays = (runs) => {
    const averaged = runs[0].map((_, i) => {
      const allRunsAtIndex = runs.map((run) => run[i]);
      const averagedEntry = {};
      Object.keys(runs[0][i]).forEach((key) => {
        if (typeof runs[0][i][key] === 'number') {
          averagedEntry[key] =
            allRunsAtIndex.reduce((sum, r) => sum + r[key], 0) / runs.length;
        } else {
          averagedEntry[key] = runs[0][i][key];
        }
      });
      return averagedEntry;
    });
    return averaged;
  };

  const runMultipleExperiments = async (scheme) => {
    const allRuns = [];

    for (let runIndex = 0; runIndex < totalRuns; runIndex++) {
      const offsetTestValues = testValues.map(([a, b]) => [a + runIndex, b + runIndex]);

      const results = await Promise.all(
        offsetTestValues.map(async ([a, b]) => {
          const expected = a + b;

          const [encA, encB] = await Promise.all([
            axios.post(`${MINI_BACKEND_URL}/encrypt`, { value: a, scheme }),
            axios.post(`${MINI_BACKEND_URL}/encrypt`, { value: b, scheme }),
          ]);
          const encryptTimeA = encA.data.execution_us / 1000;
          const encryptTimeB = encB.data.execution_us / 1000;

          const addRes = await axios.post(`${MAIN_BACKEND_URL}/add_encrypted`, {
            a: encA.data.ciphertext,
            b: encB.data.ciphertext,
            scheme,
          });
          const addTime = addRes.data.execution_us / 1000;

          const decRes = await axios.post(`${MINI_BACKEND_URL}/decrypt`, {
            ciphertext: addRes.data.ciphertext,
            scheme,
          });
          const decryptTime = decRes.data.execution_us / 1000;

          const output = decRes.data.value;
          const error = Math.abs(expected - output);
          const totalTime = encryptTimeA + encryptTimeB + addTime + decryptTime;

          return {
            input: expected,
            output,
            error,
            encryptA: encryptTimeA,
            encryptB: encryptTimeB,
            add: addTime,
            decrypt: decryptTime,
            total: totalTime,
            ramA: encA.data.ram_kb,
            ramB: encB.data.ram_kb,
            ramAdd: addRes.data.ram_kb,
            ramDecrypt: decRes.data.ram_kb,
          };
        })
      );

      allRuns.push(results);
      setProgressPercent((prev) => Math.round(prev + (1 / (totalRuns * 2)) * 100));
    }

    return averageResultArrays(allRuns);
  };

  const handleRun = async () => {
    setLoading(true);
    setProgressPercent(0);
    const bfv = await runMultipleExperiments('bfv');
    const ckks = await runMultipleExperiments('ckks');
    setBfvResults(bfv);
    setCkksResults(ckks);
    setLoading(false);
    setProgressPercent(100);
  };

  const filteredBfvResults = bfvResults.filter((r) =>
    r.input.toString().includes(searchTerm)
  );
  const filteredCkksResults = ckksResults.filter((r) =>
    r.input.toString().includes(searchTerm)
  );

  const makeChartData = (label, dataKey, tension = 0.4) => ({
    labels: filteredBfvResults.map((r) => r.input),
    datasets: [
      {
        label: 'BFV',
        data: filteredBfvResults.map((r) => r[dataKey]),
        borderColor: 'blue',
        tension,
        fill: false,
      },
      {
        label: 'CKKS',
        data: filteredCkksResults.map((r) => r[dataKey]),
        borderColor: 'orange',
        tension,
        fill: false,
      },
    ],
  });

  const bfvAverages = useMemo(() => computeAverages(filteredBfvResults), [filteredBfvResults]);
  const ckksAverages = useMemo(() => computeAverages(filteredCkksResults), [filteredCkksResults]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Experiment: Encrypted Addition Performance</h2>
      <button onClick={handleRun} disabled={loading}>
        {loading ? 'Running experiment...' : 'Run BFV and CKKS tests'}
      </button>

      {loading && (
        <div style={{ marginTop: '1rem', width: '100%' }}>
          <div style={{ background: '#ddd', height: '20px', borderRadius: '5px' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: '#4caf50',
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            Progress: {progressPercent}%
          </div>
        </div>
      )}

      {bfvResults.length > 0 && (
        <>
          <div style={{ margin: '1rem 0' }}>
            <input
              type="text"
              placeholder="Filter by expected sum"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px', width: '300px' }}
            />
          </div>

          <h3>Absolute Error vs. Expected Sum</h3>
          <Line data={makeChartData('Error', 'error')} />

          <h3>Total Execution Time (ms) vs. Expected Sum</h3>
          <Line data={makeChartData('Total Time', 'total')} />

          <h3>Encryption Time (ms)</h3>
          <Line
            data={{
              labels: filteredBfvResults.map((r) => r.input),
              datasets: [
                {
                  label: 'BFV - Encrypt A',
                  data: filteredBfvResults.map((r) => r.encryptA),
                  borderColor: 'blue',
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: 'CKKS - Encrypt A',
                  data: filteredCkksResults.map((r) => r.encryptA),
                  borderColor: 'orange',
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
          />

          <h3>Addition Time (ms)</h3>
          <Line data={makeChartData('Addition Time', 'add')} />

          <h3>Decryption Time (ms)</h3>
          <Line data={makeChartData('Decryption Time', 'decrypt')} />

          <h3>Average Metrics</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Metric</th>
                <th>BFV</th>
                <th>CKKS</th>
              </tr>
            </thead>
            <tbody>
              {[ 
                ['Encryption Time Per Number (ms)', bfvAverages.encrypt, ckksAverages.encrypt],
                ['Addition Time (ms)', bfvAverages.add, ckksAverages.add],
                ['Decryption Time (ms)', bfvAverages.decrypt, ckksAverages.decrypt],
                ['Total Time (ms)', bfvAverages.total, ckksAverages.total],
                ['Absolute Error', bfvAverages.error, ckksAverages.error],
                ['RAM - Encryption (KB)', bfvAverages.ramEncrypt, ckksAverages.ramEncrypt],
                ['RAM - Addition (KB)', bfvAverages.ramAdd, ckksAverages.ramAdd],
                ['RAM - Decryption (KB)', bfvAverages.ramDecrypt, ckksAverages.ramDecrypt],
              ].map(([label, bfvVal, ckksVal]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{bfvVal.toFixed(3)}</td>
                  <td>{ckksVal.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default Experiment;
