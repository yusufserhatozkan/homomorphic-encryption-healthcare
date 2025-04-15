import { useState, useEffect } from 'react';
import './App.css';

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

const API_BASE_URL = 'http://localhost:18080';

function App() {
    const [backendData, setBackendData] = useState(null);
    const [numberA, setNumberA] = useState('');
    const [numberB, setNumberB] = useState('');
    const [homEncryptedResult, setHomEncryptedResult] = useState(null);
    const [homDecryptedResult, setHomDecryptedResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBackendData();
    }, []);

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

        const encryptedA = encryptNumber(a);
        const encryptedB = encryptNumber(b);

        try {
            const response = await fetch(`${API_BASE_URL}/add_encrypted`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ a: encryptedA, b: encryptedB }),
            });

            if (response.ok) {
                const result = await response.json();
                const encryptedSum = result.result;
                setHomEncryptedResult(encryptedSum);
                setHomDecryptedResult(decryptNumber(encryptedSum));
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
