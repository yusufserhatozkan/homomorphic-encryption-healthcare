# Homomorphic Encryption Project in Cloud Environment

Welcome to the **Applied Cryptography - Group 08** Cloud Processing Module. This project demonstrates the implementation of homomorphic encryption, allowing computations to be performed on encrypted data without decrypting it. The project is divided into two main components:

1. **Frontend**: A web-based interface built with Vite + React in Node.js.
2. **Backend**: A C++ application (`src/main.cpp`) that handles the core homomorphic encryption operations.

This component is part of the larger project *Encrypted Intelligence: Leveraging Homomorphic Encryption for Secure Healthcare Analytics*. It demonstrates how to securely process healthcare data in a cloud environment using homomorphic encryption—enabling computations on encrypted data without exposing sensitive information.

To view the machine learning part of the project go to this repository : [Repository Containing the Machine learning Part](https://gitlab.maastrichtuniversity.nl/I6365974/machine-learning)   

## Table of Contents
1. [Project Overview](#overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation and Setup](#installation-and-setup)
5. [Running and Building the Backend](#running-and-building-the-backend)
6. [Running the Frontend](#running-the-frontend)
7. [Notes](#notes)
8. [Contributors](#contributors)
9. [License](#license)

## Overview

This module simulates secure cloud processing by performing operations such as data aggregation and computations directly on encrypted inputs. The goal is to enable privacy-preserving data processing in sensitive environments like healthcare, where confidentiality is paramount.

The module consists of:
- **Frontend Application**: Built with React and Vite, providing an intuitive interface for data entry and result visualization.
- **Backend Service**: Developed in C++ using the Crow framework, handling the encryption, secure processing, and decryption operations.

## Features

- **Frontend**: Provides a user-friendly interface for interacting with the encryption system.
- **Backend**: Implements homomorphic encryption algorithms and performs computations on encrypted data.

This is still a prototype, so functionality is limited to encryption and decryption of data using homomorphic encryption. It also includes an easy-to-use interface.

## Prerequisites

### Frontend
- Node.js (v16 or higher)
- npm

### Backend
- C++ compiler (version C++ 17 or higher)
- CMake (version 3.15 or higher)
- Crow library (this library is already included)

## Installation and Setup

### 1. Clone the Repo
```bash
git clone https://gitlab.maastrichtuniversity.nl/I6360608/applied-cryptography-group08.git
```

## Running and Building the Backend

**Note:**  
You need to rebuild the backend every time you pull new changes or modify the C++ code. The build process creates a `build` folder inside `backend/`, which is ignored by git and can be safely deleted and recreated at any time.

### Build and Run on macOS/Linux

From the project root, run:
```sh
./backend/scripts/build.sh
```
This will:
- Create or update the `backend/build/` directory
- Configure the project with CMake
- Build the backend application

To run the backend after building:
```sh
./backend/build/backend
```

### Build and Run on Windows

From the project root, run:
```bat
backend\scripts\build.bat
```
This will:
- Create or update the `backend\build\` directory
- Configure the project with CMake
- Build the backend application

To run the backend after building (from the project root):
```bat
backend\build\Debug\backend.exe
```
If you built in Release mode, use `backend\build\Release\backend.exe` instead.

**Tip:**  
If you ever need a clean build, simply delete the `backend/build/` directory and run the script again.

## Running the Frontend

```bash
cd applied-cryptography-group08/frontend/
npm install
npm run dev
```

After running the frontend, open your browser and navigate to the URL provided in the terminal (typically [http://localhost:5173/](http://localhost:5173/)).

## Notes

- The frontend communicates with the backend via HTTP or WebSocket (depending on your implementation). Ensure the backend is accessible to the frontend.
- The backend must be running before interacting with the frontend.

## Contributors

The following individuals contributed to the development of this project:

- **Luca**
- **Kamil**
- **Andrei**
- **Tomasz**
- **Jakub**
- **Yusuf**
- **Calin**

## License

This project is licensed under the [MIT License](LICENSE).
