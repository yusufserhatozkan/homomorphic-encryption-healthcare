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
    encrypt: (avg('encryptA') + avg('encryptB'))/2, 
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

  const runExperiment = async (scheme) => {
    const results = [];

    for (const [a, b] of testValues) {
      const expected = a + b;

      const encA = await axios.post(`${MINI_BACKEND_URL}/encrypt`, { value: a, scheme });
      const encryptTimeA = encA.data.execution_us / 1000;

      const encB = await axios.post(`${MINI_BACKEND_URL}/encrypt`, { value: b, scheme });
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

      results.push({
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
      });
    }

    return results;
  };

  const handleRun = async () => {
    setLoading(true);
    const bfv = await runExperiment('bfv');
    const ckks = await runExperiment('ckks');
    setBfvResults(bfv);
    setCkksResults(ckks);
    setLoading(false);
  };

  const makeChartData = (label, dataKey, tension = 0.4) => ({
    labels: bfvResults.map((r) => r.input),
    datasets: [
      {
        label: 'BFV',
        data: bfvResults.map((r) => r[dataKey]),
        borderColor: 'blue',
        tension,
        fill: false,
      },
      {
        label: 'CKKS',
        data: ckksResults.map((r) => r[dataKey]),
        borderColor: 'orange',
        tension,
        fill: false,
      },
    ],
  });

  const bfvAverages = useMemo(() => computeAverages(bfvResults), [bfvResults]);
  const ckksAverages = useMemo(() => computeAverages(ckksResults), [ckksResults]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Experiment: Encrypted Addition Performance</h2>
      <button onClick={handleRun} disabled={loading}>
        {loading ? 'Running experiment...' : 'Run BFV and CKKS tests'}
      </button>

      {bfvResults.length > 0 && (
        <>
          <h3>Absolute Error vs. Expected Sum</h3>
          <Line data={makeChartData('Error', 'error', 0)} />

          <h3>Total Execution Time (ms) vs. Expected Sum</h3>
          <Line data={makeChartData('Total Time', 'total')} />

          <h3>Encryption Time (ms)</h3>
          <Line
            data={{
              labels: bfvResults.map((r) => r.input),
              datasets: [
                {
                  label: 'BFV - Encrypt A',
                  data: bfvResults.map((r) => r.encryptA),
                  borderColor: 'blue',
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: 'CKKS - Encrypt A',
                  data: ckksResults.map((r) => r.encryptA),
                  borderColor: 'orange',
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
          />

          <h3>Addition Time (ms)</h3>
          <Line
            data={{
              labels: bfvResults.map((r) => r.input),
              datasets: [
                {
                  label: 'BFV - Add',
                  data: bfvResults.map((r) => r.add),
                  borderColor: 'purple',
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: 'CKKS - Add',
                  data: ckksResults.map((r) => r.add),
                  borderColor: 'red',
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
          />

          <h3>Decryption Time (ms)</h3>
          <Line
            data={{
              labels: bfvResults.map((r) => r.input),
              datasets: [
                {
                  label: 'BFV - Decrypt',
                  data: bfvResults.map((r) => r.decrypt),
                  borderColor: 'green',
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: 'CKKS - Decrypt',
                  data: ckksResults.map((r) => r.decrypt),
                  borderColor: 'darkorange',
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
          />

          <h3>RAM Usage - Encryption (KB)</h3>
          <Line
            data={{
              labels: bfvResults.map((r) => r.input),
              datasets: [
                {
                  label: 'BFV - Encrypt (A + B)',
                  data: bfvResults.map((r) => r.ramA + r.ramB),
                  borderColor: 'blue',
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: 'CKKS - Encrypt (A + B)',
                  data: ckksResults.map((r) => r.ramA + r.ramB),
                  borderColor: 'orange',
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
          />

          <h3>RAM Usage - Addition (KB)</h3>
          <Line
            data={{
              labels: bfvResults.map((r) => r.input),
              datasets: [
                {
                  label: 'BFV - Add',
                  data: bfvResults.map((r) => r.ramAdd),
                  borderColor: 'purple',
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: 'CKKS - Add',
                  data: ckksResults.map((r) => r.ramAdd),
                  borderColor: 'red',
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
          />

          <h3>RAM Usage - Decryption (KB)</h3>
          <Line
            data={{
              labels: bfvResults.map((r) => r.input),
              datasets: [
                {
                  label: 'BFV - Decrypt',
                  data: bfvResults.map((r) => r.ramDecrypt),
                  borderColor: 'green',
                  tension: 0.4,
                  fill: false,
                },
                {
                  label: 'CKKS - Decrypt',
                  data: ckksResults.map((r) => r.ramDecrypt),
                  borderColor: 'darkorange',
                  tension: 0.4,
                  fill: false,
                },
              ],
            }}
          />

          <h3>Average Metrics</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
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
          </div>
        </>
      )}
    </div>
  );
}

export default Experiment;
