# Backend Documentation
The main file serves as the entry point for the backend service of the **Homomorphic Encryption in Cloud Environment** project. It initializes the backend server, sets up the necessary routes, and starts the service to handle incoming requests.

## Dependencies

**Crow Framework**: Used for HTTP server functionality and CORS handling.

## Code Structure

### **Includes**
The file includes necessary headers for server setup, route handling, and cryptographic operations. Key libraries include:
- Crow framework for HTTP server functionality.
- Custom headers for encryption and decryption logic.


## API Endpoints

### `/encrypt`
- **Method**: `POST`
- **Description**: Accepts plaintext data and returns the encrypted result.
- **Request Body**: JSON object containing the plaintext.
- **Response**: JSON object containing the ciphertext.

### `/decrypt`
- **Method**: `POST`
- **Description**: Accepts ciphertext data and returns the decrypted result.
- **Request Body**: JSON object containing the ciphertext.
- **Response**: JSON object containing the plaintext.

### `/json`
- **Method**: `GET`
- **Description**: Returns the status of the backend service.
- **Response**: JSON object with a status message.

### `/`
- **Method**: `GET`
- **Description**: Returns a welcome message.
- **Response**: Plain text message.
---

## Sending a Request

This can be done through our frontend or through the following curl command : 

```bash
curl -X POST http://localhost:8080/encrypt -H "Content-Type: application/json" -d '{"data": "Hello, World!"}'
```
 
The response will be the encrypted data. 
