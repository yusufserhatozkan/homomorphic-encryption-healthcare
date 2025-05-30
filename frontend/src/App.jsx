import { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const MINI_BACKEND_URL = 'http://localhost:18081'; // mini-backend
const MAIN_BACKEND_URL = 'http://localhost:18080'; // main-backend

function App() {
    const [backendData, setBackendData] = useState(null);
    const [numberA, setNumberA] = useState('');
    const [numberB, setNumberB] = useState('');
    const [homDecryptedResult, setHomDecryptedResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [numberScheme, setNumberScheme] = useState('bfv');

    useEffect(() => {
        fetchBackendData();
    }, []);

    const fetchBackendData = async () => {
        try {
            const response = await fetch(`${MAIN_BACKEND_URL}/json`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            setBackendData(data);
        } catch (error) {
            setError('Failed to connect to the server');
        }
    };

    const sendEncryptedSum = async () => {
        const a = numberScheme === 'ckks' ? parseFloat(numberA) : parseInt(numberA);
        const b = numberScheme === 'ckks' ? parseFloat(numberB) : parseInt(numberB);
    
        if (isNaN(a) || isNaN(b)) {
            setError('Please enter valid numbers');
            return;
        }
    
        setLoading(true);
        setError(null);

        try {
            // 1. Encrypting by mini-backend
            const encryptResponseA = await axios.post(`${MINI_BACKEND_URL}/encrypt`, {
                value: a,
                scheme: numberScheme
            });

            const encryptResponseB = await axios.post(`${MINI_BACKEND_URL}/encrypt`, {
                value: b,
                scheme: numberScheme
            });

            const encryptedA = encryptResponseA.data.ciphertext;
            const encryptedB = encryptResponseB.data.ciphertext;

            // 2. Sending encrypted data to main-backend
            const addResponse = await axios.post(`${MAIN_BACKEND_URL}/add_encrypted`, {
                a: encryptedA,
                b: encryptedB,
                scheme: numberScheme
            });

            const encryptedResult = addResponse.data.ciphertext;

            // 3. Decrypting the result by mini-backend
            const decryptResponse = await axios.post(`${MINI_BACKEND_URL}/decrypt`, {
                ciphertext: encryptedResult,
                scheme: numberScheme
            });

            setHomDecryptedResult(decryptResponse.data.value);
        } catch (err) {
            console.error('Homomorphic operation error:', err);
            setError(`Homomorphic operation failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderSchemeSelector = (currentScheme, setScheme) => (
        <div className="scheme-selector">
            <label>Encryption Scheme:</label>
            <div className="scheme-options">
                <button 
                    className={`scheme-btn ${currentScheme === 'bfv' ? 'active' : ''}`}
                    onClick={() => setScheme('bfv')}
                >
                    BFV
                </button>
                <button 
                    className={`scheme-btn ${currentScheme === 'ckks' ? 'active' : ''}`}
                    onClick={() => setScheme('ckks')}
                >
                    CKKS
                </button>
            </div>
        </div>
    );

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
                        
                        {renderSchemeSelector(numberScheme, setNumberScheme)}
                        
                        <div className="input-group">
                            <label>Enter Number A:</label>
                            <input 
                                type="number" 
                                value={numberA} 
                                onChange={(e) => setNumberA(e.target.value)} 
                                placeholder={numberScheme === 'ckks' ? "e.g. 3.14" : "e.g. 123"}
                                step={numberScheme === 'ckks' ? "0.01" : "1"}
                            />
                            
                            <label>Enter Number B:</label>
                            <input 
                                type="number" 
                                value={numberB} 
                                onChange={(e) => setNumberB(e.target.value)} 
                                placeholder={numberScheme === 'ckks' ? "e.g. 2.71" : "e.g. 456"}
                                step={numberScheme === 'ckks' ? "0.01" : "1"}
                            />
                        </div>
                        
                        <button onClick={sendEncryptedSum} disabled={loading} className="action-button">
                            {loading ? 'Processing...' : 'Add Encrypted Numbers'}
                        </button>
                    </section>
                    
                    <div className="results-panel">
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