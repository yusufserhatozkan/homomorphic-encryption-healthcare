import { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [backendData, setBackendData] = useState(null);
    const [inputText, setInputText] = useState('');
    const [encryptedData, setEncryptedData] = useState(null);
    const [decryptedData, setDecryptedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Base URL constant
    const API_BASE_URL = 'http://localhost:18080';

    // Fetch data from backend on component mount
    useEffect(() => {
        fetchBackendData();
    }, []);

    // Function to fetch data from /json endpoint of your backend
    const fetchBackendData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/json`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Include credentials if needed
                // credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Backend data:", data);
            setBackendData(data);
        } catch (error) {
            console.error('Error fetching backend data:', error);
            setError('Failed to connect to the server');
        }
    };

    // Function to send data to the /encrypt endpoint of your backend
    const encryptData = async () => {
        if (!inputText.trim()) {
            setError('Please enter text to encrypt');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            console.log("Sending for encryption:", inputText);
            const response = await fetch(`${API_BASE_URL}/encrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: inputText }),
            });

            console.log("Encryption response status:", response.status);
            
            if (response.ok) {
                const encrypted = await response.text();
                console.log("Encrypted:", encrypted);
                setEncryptedData(encrypted);
            } else {
                console.error("Error encrypting data:", response.statusText);
                setError('Encryption failed: ' + response.statusText);
            }
        } catch (error) {
            console.error('Error encrypting data:', error);
            setError('Failed to connect to encryption service');
        } finally {
            setLoading(false);
        }
    };

    // Function to send data to the /decrypt endpoint of your backend
    const decryptData = async () => {
        if (!encryptedData) {
            setError('No encrypted data to decrypt');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            console.log("Sending for decryption:", encryptedData);
            const response = await fetch(`${API_BASE_URL}/decrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: encryptedData }),
            });
            
            console.log("Decryption response status:", response.status);
            
            if (response.ok) {
                const decrypted = await response.text();
                console.log("Decrypted:", decrypted);
                setDecryptedData(decrypted);
            } else {
                setError('Decryption failed: ' + response.statusText);
            }
        } catch (error) {
            console.error('Error decrypting data:', error);
            setError('Failed to connect to decryption service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1>Homomorphic Encryption</h1>
                <p className="subtitle">Secure data processing while encrypted</p>
            </header>

            <main>
                <section className="encryption-panel">
                    <h2>Encryption</h2>
                    <div className="input-group">
                        <label htmlFor="plaintext">Enter text to encrypt:</label>
                        <textarea 
                            id="plaintext"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type your plaintext here..."
                            rows={4}
                        />
                    </div>
                    
                    <button 
                        onClick={encryptData} 
                        disabled={loading || !inputText.trim()}
                        className="action-button"
                    >
                        {loading ? 'Encrypting...' : 'Encrypt Data'}
                    </button>
                    
                    {encryptedData && (
                        <div className="result-box">
                            <h3>Encrypted Data:</h3>
                            <pre>{encryptedData}</pre>
                        </div>
                    )}
                </section>

                <section className="decryption-panel">
                    <h2>Decryption</h2>
                    <button 
                        onClick={decryptData} 
                        disabled={loading || !encryptedData}
                        className="action-button"
                    >
                        {loading ? 'Decrypting...' : 'Decrypt Data'}
                    </button>
                    
                    {decryptedData && (
                        <div className="result-box">
                            <h3>Decrypted Result:</h3>
                            <pre>{decryptedData}</pre>
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