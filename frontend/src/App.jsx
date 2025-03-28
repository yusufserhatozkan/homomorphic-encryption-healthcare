import { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [count, setCount] = useState(0);
    const [backendData, setBackendData] = useState(null);
    const [inputText, setInputText] = useState('');
    const [encryptedData, setEncryptedData] = useState(null);
    const [decryptedData, setDecryptedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch data from backend on component mount
    useEffect(() => {
        fetchBackendData();
    }, []);

    // Function to fetch data from /json endpoint of your backend
    const fetchBackendData = async () => {
        try {
            const response = await fetch('http://localhost:18080/json');
            const data = await response.json();
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
            const response = await fetch('http://localhost:18080/encrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: inputText }),
            });

            if (response.ok) {
                const encrypted = await response.text();
                setEncryptedData(encrypted);
                console.log("Encrypted:", encrypted);
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
            const response = await fetch('http://localhost:18080/decrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: encryptedData }),
            });
            
            if (response.ok) {
                const decrypted = await response.text();
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