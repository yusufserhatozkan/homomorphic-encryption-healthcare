import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
/*
// === Encryption logic split into smaller parts ===
const SECRET_KEY = 1337;

const multiplyWithKey = (num) => {
    return num * SECRET_KEY;
};

const divideByKey = (num) => {
    return num / SECRET_KEY;
};

const encryptNumber = (num) => {
    return multiplyWithKey(num);
};

const decryptNumber = (encrypted) => {
    return divideByKey(encrypted);
};
*/

const API_BASE_URL = 'http://localhost:18080';

function App() {
    const [backendData, setBackendData] = useState(null);
    const [numberA, setNumberA] = useState('');
    const [numberB, setNumberB] = useState('');
    const [homEncryptedResult, setHomEncryptedResult] = useState(null);
    const [homDecryptedResult, setHomDecryptedResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [csvFile, setCsvFile] = useState('/Users/georg/Desktop/Project 2-2/applied-cryptography-group08/backend/src/data/sample.csv');
    const [columnIndex, setColumnIndex] = useState(0);
    const [useEncryption, setUseEncryption] = useState(false);
    const [csvResult, setCsvResult] = useState(null);


    useEffect(() => {
        fetchBackendData();
    }, []);

    const fetchCSVSum = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/csv/sum`, {
                file: csvFile,
                column: parseInt(columnIndex),
                encrypted: useEncryption
            });

            setCsvResult(response.data);
        } catch (err) {
            setError(`CSV operation failed: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCSVAverage = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/csv/average`, {
                file: csvFile,
                column: parseInt(columnIndex)
            });

            setCsvResult(response.data);
        } catch (err) {
            setError(`CSV operation failed: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBackendData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/json`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            setBackendData(data);
        } catch (error) {
            setError('Failed to connect to the server');
        }
    };

    const sendEncryptedSum = async () => {
        const a = parseInt(numberA);
        const b = parseInt(numberB);
    
        if (isNaN(a) || isNaN(b)) {
            setError('Please enter valid numbers');
            return;
        }
    
        setLoading(true);
        setError(null);
    
        try {
            const response = await fetch(`${API_BASE_URL}/add_encrypted`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ a, b }),
            });
    
            if (response.ok) {
                const result = await response.json();
                const encryptedSum = result.result;
                setHomEncryptedResult(encryptedSum);
                setHomDecryptedResult(encryptedSum); 
            } else {
                setError('Homomorphic addition failed');
            }
        } catch (err) {
            setError('Failed to connect to homomorphic addition service');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="app-container">
            <header>
                <h1>Homomorphic Encryption</h1>
                <p className="subtitle">Secure number processing with encryption</p>
            </header>

            <main>
                <div className="homomorphic-layout">
                    <section className="homomorphic-panel">
                        <h2>Homomorphic Addition (Numbers)</h2>
                        <div className="input-group">
                            <label>Enter Number A:</label>
                            <input type="number" value={numberA} onChange={(e) => setNumberA(e.target.value)} />
                            <label>Enter Number B:</label>
                            <input type="number" value={numberB} onChange={(e) => setNumberB(e.target.value)} />
                        </div>
                        <button onClick={sendEncryptedSum} disabled={loading} className="action-button">
                            {loading ? 'Processing...' : 'Add Encrypted Numbers'}
                        </button>
                    </section>
                    <div className="results-panel">
                        <div className="result-box">
                            <h3>Encrypted Sum:</h3>
                            <pre>{homEncryptedResult !== null ? homEncryptedResult : '-'}</pre>
                        </div>
                        <div className="result-box">
                            <h3>Decrypted Sum:</h3>
                            <pre>{homDecryptedResult !== null ? homDecryptedResult : '-'}</pre>
                        </div>
                    </div>
                </div>

                <section className="csv-panel">
                    <h2>CSV Data Operations</h2>
                    <div className="input-group">
                        <label>CSV File Path:</label>
                        <input
                            type="text"
                            value={csvFile}
                            onChange={(e) => setCsvFile(e.target.value)}
                            placeholder="Path to CSV file"
                        />

                        <label>Column Index:</label>
                        <input
                            type="number"
                            value={columnIndex}
                            onChange={(e) => setColumnIndex(e.target.value)}
                            min="0"
                        />

                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="use-encryption"
                                checked={useEncryption}
                                onChange={(e) => setUseEncryption(e.target.checked)}
                            />
                            <label htmlFor="use-encryption">Use Encryption</label>
                        </div>
                    </div>

                    <div className="button-group">
                        <button onClick={fetchCSVSum} disabled={loading} className="action-button">
                            Calculate Sum
                        </button>
                        <button onClick={fetchCSVAverage} disabled={loading} className="action-button">
                            Calculate Average
                        </button>
                    </div>

                    {csvResult && (
                        <div className="result-box">
                            <h3>CSV Operation Result:</h3>
                            <pre>{JSON.stringify(csvResult, null, 2)}</pre>
                            {useEncryption && csvResult.encrypted_sum && (
                                <div>
                                    <h4>Decrypted Value:</h4>
                                    <pre>{csvResult.encrypted_sum / SECRET_KEY}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                    </div>
                )}

                {backendData && (
                    <section className="server-status">
                        <h3>Server Connection:</h3>
                        <p>Connected successfully</p>
                        <pre>{JSON.stringify(backendData, null, 2)}</pre>
                    </section>
                )}
            </main>

            <footer>
                <p>Information Security - Homomorphic Encryption</p>
            </footer>
        </div>
    );
}

export default App;