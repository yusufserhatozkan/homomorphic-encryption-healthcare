# Microsoft SEAL Implementation

This is the **C++ implementation** of the homomorphic encryption project using Microsoft's SEAL library. This version provides high-performance native encryption operations with a React-based web interface.

## Architecture

- **Backend**: C++ with Microsoft SEAL library and Crow HTTP framework
- **Frontend**: React with Vite for fast development and modern UI
- **Communication**: RESTful API between frontend and backend

## Prerequisites

### Backend Requirements

- **C++ Compiler**: C++17 or higher (GCC, Clang, or MSVC)
- **CMake**: Version 3.15 or higher
- **Microsoft SEAL**: Included in the project dependencies
- **Crow Framework**: Included as a library

### Frontend Requirements

- **Node.js**: Version 16 or higher
- **npm**: For package management

## Installation and Setup

### 1. Navigate to Microsoft-Seal Directory

```bash
cd applied-cryptography-group08/microsoft-seal
```

### 2. Backend Setup

#### macOS/Linux

```bash
# From the microsoft-seal directory
chmod +x backend/scripts/build.sh
./backend/scripts/build.sh
```

#### Windows

```bat
# From the microsoft-seal directory
backend\scripts\build.bat
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Starting the Backend

#### macOS/Linux

```bash
# From the microsoft-seal directory
./backend/build/backend
```

#### Windows

```bat
# From the microsoft-seal directory
backend\build\Debug\backend.exe
```

The backend will start on `http://localhost:8080`

### Starting the Frontend

```bash
# From the microsoft-seal/frontend directory
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development

### Backend Development

The backend source code is located in `backend/src/`:

- `main-backend.cpp`: Main application entry point
- `HomomorphicEncryption.cpp/h`: Core encryption logic
- `CORSMiddleware.h`: CORS handling for web requests

#### Rebuilding After Changes

```bash
# Clean build (if needed)
rm -rf backend/build

# Rebuild
./backend/scripts/build.sh  # macOS/Linux
# OR
backend\scripts\build.bat   # Windows
```

### Frontend Development

The frontend is built with React and Vite:

- Fast hot-reload development
- Modern ES6+ JavaScript
- Component-based architecture

Key files:

- `src/App.jsx`: Main application component
- `src/Experiment.jsx`: Encryption experiment interface

## Features

- **Homomorphic Encryption**: Perform computations on encrypted data
- **Healthcare Data Processing**: Secure analytics on medical datasets
- **Real-time Interface**: Interactive web-based user interface
- **High Performance**: Native C++ implementation for optimal speed
- **Cross-Platform**: Supports Windows, macOS, and Linux

## Additional Documentation

- [Microsoft SEAL Documentation](https://github.com/microsoft/SEAL)

## Switching to Node-SEAL Version

If you prefer the Node.js implementation, check out the [Node-SEAL version](../node-seal/README.md) which offers:

- Full JavaScript/TypeScript stack
- Faster development iteration
- Modern Next.js frontend with advanced UI components

