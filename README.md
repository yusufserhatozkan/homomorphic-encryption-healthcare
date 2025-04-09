# Homomorphic Encryption Project

This project demonstrates the implementation of homomorphic encryption, allowing computations to be performed on encrypted data without decrypting it. The project is divided into two main components:

1. **Frontend**: A web-based interface built with Vite + React in Node.js.
2. **Backend**: A C++ application (`src/main.cpp`) that handles the core homomorphic encryption operations.

## Features

- **Frontend**: Provides a user-friendly interface for interacting with the encryption system.
- **Backend**: Implements homomorphic encryption algorithms and performs computations on encrypted data.

## Prerequisites

### Frontend
- Node.js (v16 or higher)
- npm

### Backend
- C++ compiler (e.g., GCC or Clang)
- CMake (optional, for build automation)

## Installation and Setup

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL provided by Vite

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Compile the C++ code:
   ```bash
   g++ -o homomorphic_encryption src/main.cpp
   ```

3. Run the compiled program:
   ```bash
   ./homomorphic_encryption
   ```

## Notes

- The frontend communicates with the backend via HTTP or WebSocket (depending on your implementation). Ensure the backend is accessible to the frontend.
- The backend must be running before interacting with the frontend.


## License

This project is licensed under the [MIT License](LICENSE).
