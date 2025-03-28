# Frontend Documentation

This is still a prototype of a user friendly front end implementation.

---

## **Features**
1. **Encryption**: Allows users to input plaintext and encrypt it using the backend service.
2. **Decryption**: Decrypts previously encrypted data using the backend service.
3. **Backend Connection**: Fetches data from the backend to verify connectivity.
4. **Error Handling**: Displays error messages for failed operations.
5. **Loading States**: Shows loading indicators during encryption and decryption processes.

---


# Function Documentation

This section provides detailed documentation for the key functions implemented in the frontend application.

---

## **1. `fetchBackendData`**
- **Description**: Fetches data from the `/json` endpoint of the backend to verify connectivity.
- **Parameters**: None.
- **Returns**: Updates the `backendData` state with the fetched data or sets an error message if the request fails.
- **Endpoint Accessed**: `GET /json`
- **Code Example**:
    ```javascript
    const fetchBackendData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/json`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setBackendData(data);
        } catch (error) {
            setError('Failed to connect to the server');
        }
    };
    ```

---

## **2. `encryptData`**
- **Description**: Sends plaintext input to the `/encrypt` endpoint of the backend for encryption.
- **Parameters**: None (uses `inputText` state for input).
- **Returns**: Updates the `encryptedData` state with the encrypted result or sets an error message if the request fails.
- **Endpoint Accessed**: `POST /encrypt`
- **Request Body**:
    ```json
    {
        "data": "string"
    }
    ```
- **Code Example**:
    ```javascript
    const encryptData = async () => {
        if (!inputText.trim()) {
            setError('Please enter text to encrypt');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/encrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: inputText }),
            });
            if (response.ok) {
                const encrypted = await response.text();
                setEncryptedData(encrypted);
            } else {
                setError('Encryption failed: ' + response.statusText);
            }
        } catch (error) {
            setError('Failed to connect to encryption service');
        } finally {
            setLoading(false);
        }
    };
    ```

---

## **3. `decryptData`**
- **Description**: Sends encrypted data to the `/decrypt` endpoint of the backend for decryption.
- **Parameters**: None (uses `encryptedData` state for input).
- **Returns**: Updates the `decryptedData` state with the decrypted result or sets an error message if the request fails.
- **Endpoint Accessed**: `POST /decrypt`
- **Request Body**:
    ```json
    {
        "data": "string"
    }
    ```
- **Code Example**:
    ```javascript
    const decryptData = async () => {
        if (!encryptedData) {
            setError('No encrypted data to decrypt');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/decrypt`, {
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
            setError('Failed to connect to decryption service');
        } finally {
            setLoading(false);
        }
    };
    ```

---

## Endpoints Accessed

GET /json: Verifies backend connectivity.
POST /encrypt: Encrypts plaintext data.
POST /decrypt: Decrypts encrypted data.


---