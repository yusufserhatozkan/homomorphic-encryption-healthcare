# Homomorphic Encryption Project in Cloud Environment

Welcome to the **Applied Cryptography - Group 08** Cloud Processing Module. This project demonstrates the implementation of homomorphic encryption, allowing computations to be performed on encrypted data without decrypting it. The project is divided into two main components:

1. **Frontend**: A web-based interface built with Vite + React in Node.js.
2. **Backend**: A C++ application (`src/main.cpp`) that handles the core homomorphic encryption operations.

This component is part of the larger project *Encrypted Intelligence: Leveraging Homomorphic Encryption for Secure Healthcare Analytics*. It demonstrates how to securely process healthcare data in a cloud environment using homomorphic encryption—enabling computations on encrypted data without exposing sensitive information.

---

## **Table of Contents**
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Running the Project](#running-the-project)
6. [Usage](#usage)
7. [Project Structure](#project-structure)
8. [Contributors](#contributors)
9. [License](#license)

---

## **Overview**

This module simulates secure cloud processing by performing operations such as data aggregation and computations directly on encrypted inputs. The goal is to enable privacy-preserving data processing in sensitive environments like healthcare, where confidentiality is paramount.

The module consists of:
- **Frontend Application**: Built with React and Vite, providing an intuitive interface for data entry and result visualization.
- **Backend Service**: Developed in C++ using the Crow framework, handling the encryption, secure processing, and decryption operations.

---

## **Features**

- **Frontend**: Provides a user-friendly interface for interacting with the encryption system.
- **Backend**: Implements homomorphic encryption algorithms and performs computations on encrypted data.

This is still a prototype, so functionality is limited to encryption and decryption of data using homomorphic encryption. It also includes an easy-to-use interface.

---

## **Prerequisites**

### Frontend
- Node.js (v16 or higher)
- npm

### Backend
- C++ compiler (version C++ 17 or higher)
- CMake (version 3.10 or higher)
- Crow library (this library is already included)

---

## **Installation and Setup**

### **1. Clone the Repo**
```bash
git clone https://gitlab.maastrichtuniversity.nl/I6360608/applied-cryptography-group08.git
```

---

### **2. Run the Backend**

#### **2.1 Run the backend (Linux/MacOS)**
```bash
cd applied-cryptography-group08/backend
cd build
./backend
```

If running does not work, you would need to recompile.

#### **2.2 Compile the backend on Windows**
```bash
cd applied-cryptography-group08\backend\build
Remove-Item -Recurse -Force .\*
cd ..
cd ..
cmake -B backend/build -S 
cmake --build backend/build
cd backend\build
.\backend.exe
```

This will compile and execute the backend executable.

---

### **3. Run the Frontend**
```bash
cd applied-cryptography-group08/frontend/
npm install
npm run dev
```

After running the frontend, open your browser and navigate to the URL provided in the terminal (typically [http://localhost:5173/](http://localhost:5173/)).

---

## **Notes**

- The frontend communicates with the backend via HTTP or WebSocket (depending on your implementation). Ensure the backend is accessible to the frontend.
- The backend must be running before interacting with the frontend.

---

## **Contributors**

The following individuals contributed to the development of this project:

- **Luca**
- **Kamil**
- **Andrei**
- **Tomasz**
- **Jakub**
- **Yusuf**
- **Calin**

---

## **License**

This project is licensed under the [MIT License](LICENSE).
