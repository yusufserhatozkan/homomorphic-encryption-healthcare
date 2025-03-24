import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
    const [count, setCount] = useState(0);
    const [backendData, setBackendData] = useState(null);
    const [encryptedData, setEncryptedData] = useState(null);
    const [decryptedData, setDecryptedData] = useState(null);

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
        }
    };

    // Function to send data to the /encrypt endpoint of your backend
    const encryptData = async () => {
        const response = await fetch('http://localhost:18080/encrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: "Hello World" }), // Example plaintext
        });

        if (response.ok) {
            const encrypted = await response.text();
            console.log("Encrypted:", encrypted);
        } else {
            console.error("Error encrypting data:", response.statusText);
        }
    };


    // Function to send data to the /decrypt endpoint of your backend
    const decryptData = async (data) => {
        try {
            const response = await fetch('http://localhost:18080/decrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: data }),
            });
            const decrypted = await response.text();
            setDecryptedData(decrypted);
        } catch (error) {
            console.error('Error decrypting data:', error);
        }
    };

    return (
        <>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>

            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>

            {/* Display backend data */}
            <div>
                {backendData ? (
                    <div>
                        <h2>Backend Data:</h2>
                        <pre>{JSON.stringify(backendData, null, 2)}</pre>
                    </div>
                ) : (
                    <p>Loading data from backend...</p>
                )}
            </div>

            {/* Encrypt and Decrypt Data */}
            <div>
                <button onClick={() => encryptData('Hello World!')}>Encrypt "Hello World!"</button>
                {encryptedData && (
                    <div>
                        <h3>Encrypted Data:</h3>
                        <p>{encryptedData}</p>
                    </div>
                )}
            </div>

            <div>
                {encryptedData && (
                    <div>
                        <button onClick={() => decryptData(encryptedData)}>Decrypt Data</button>
                        {decryptedData && (
                            <div>
                                <h3>Decrypted Data:</h3>
                                <p>{decryptedData}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    );
}

export default App;
