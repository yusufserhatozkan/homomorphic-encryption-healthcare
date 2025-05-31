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

    const [csvFile, setCsvFile] = useState("");
    const [columnIndex, setColumnIndex] = useState(0);
    const [useEncryption, setUseEncryption] = useState(false);
    const [csvResult, setCsvResult] = useState(null);
    
    const [numberScheme, setNumberScheme] = useState('bfv');
    const [csvScheme, setCsvScheme] = useState('bfv');

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

    const processCSV = async (operation) => {
        setLoading(true);
        setError(null);
        
        try {
            if (useEncryption) {
                // 1. read csv by mini-backend
                const readResponse = await axios.post(`${MINI_BACKEND_URL}/csv/read`, {
                    file_path: csvFile,
                    column_index: parseInt(columnIndex)
                });
                
                const values = readResponse.data.values;
                const count = values.length;
                
                // 2. Encrypt values form csv using mini-backend
                const encryptedValues = [];
                for (const value of values) {
                    const encryptResponse = await axios.post(`${MINI_BACKEND_URL}/encrypt`, {
                        value: value,
                        scheme: csvScheme
                    });
                    encryptedValues.push(encryptResponse.data.ciphertext);
                }
                
                // 3. Send encrypted values to main backend
                const processResponse = await axios.post(`${MAIN_BACKEND_URL}/csv/${operation}`, {
                    encrypted_values: encryptedValues,
                    scheme: csvScheme,
                    count: count
                });
                
                const encryptedResult = processResponse.data.encrypted_result;
                
                // 4. Decrypt the result by mini-backend
                const decryptResponse = await axios.post(`${MINI_BACKEND_URL}/decrypt`, {
                    ciphertext: encryptedResult,
                    scheme: csvScheme
                });
                
                let resultValue = decryptResponse.data.value;
                
                if (operation === 'average' && count != 0) {
                    resultValue = resultValue / count;
                }
                
                setCsvResult({
                    operation,
                    result: resultValue,
                    values_processed: count,
                    encrypted: true
                });
            } else {
                // Without encryption mini-backend does everything
                const response = await axios.post(`${MINI_BACKEND_URL}/csv/${operation}`, {
                    file_path: csvFile,
                    column_index: parseInt(columnIndex)
                });
                
                setCsvResult({
                    operation,
                    result: response.data.result,
                    values_processed: response.data.values_processed,
                    encrypted: false
                });
            }
        } catch (err) {
            console.error('CSV operation error:', err);
            setError(`CSV operation failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchCSVSum = () => processCSV('sum');
    const fetchCSVAverage = () => processCSV('average');

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

                <section className="csv-panel">
                    <h2>CSV Data Operations</h2>
                    
                    <div className="input-group">
                        <label>CSV File Path:</label>
                        <input 
                            type="text" 
                            value={csvFile} 
                            onChange={(e) => setCsvFile(e.target.value)} 
                            placeholder="Absolute path to CSV file"
                        />

                        <label>Column Index:</label>
                        <input 
                            type="number" 
                            value={columnIndex} 
                            onChange={(e) => setColumnIndex(e.target.value)} 
                            min="0" 
                        />

                        <div className="encryption-toggle">
                            <input 
                                type="checkbox" 
                                id="use-encryption" 
                                checked={useEncryption}
                                onChange={(e) => setUseEncryption(e.target.checked)} 
                            />
                            <label htmlFor="use-encryption">Use Homomorphic Encryption</label>
                        </div>
                        
                        {useEncryption && renderSchemeSelector(csvScheme, setCsvScheme)}
                    </div>

                    <div className="button-group">
                        <button onClick={fetchCSVSum} disabled={loading} className="action-button">
                            {loading ? 'Processing...' : 'Calculate Sum'}
                        </button>
                        <button onClick={fetchCSVAverage} disabled={loading} className="action-button">
                            {loading ? 'Processing...' : 'Calculate Average'}
                        </button>
                    </div>

                    {csvResult && (
                        <div className="result-box">
                            <h3>CSV Operation Result:</h3>
                            <p><strong>Operation:</strong> {csvResult.operation}</p>
                            <p><strong>Result:</strong> {csvResult.result}</p>
                            <p><strong>Values processed:</strong> {csvResult.values_processed}</p>
                            <p><strong>Encrypted:</strong> {csvResult.encrypted ? 'Yes' : 'No'}</p>
                        </div>
                    )}
                </section>

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