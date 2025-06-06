import React, { useState } from 'react';
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
  for (let i = 0; i <= 500000; i += 1000) {
    const rounded = Math.round(i);
    result.push([rounded, rounded * 2]);
  }
  return result;
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

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Experiment: Encrypted Number Addition (backend timings)</h2>
      <button onClick={handleRun} disabled={loading}>
        {loading ? 'Running experiment...' : 'Run BFV and CKKS tests'}
      </button>

      {bfvResults.length > 0 && (
        <>
          <h3>Absolute Error vs. Expected Sum</h3>
          <Line data={makeChartData('Error', 'error', 0)} />

          <h3>Total Time (ms) vs. Expected Sum</h3>
          <Line data={makeChartData('Total Time', 'total')} />

          <h3>Operation Time Breakdown (ms)</h3>
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
        </>
      )}
    </div>
  );
}

export default Experiment;
