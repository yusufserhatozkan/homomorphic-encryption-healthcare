# Project Homomorphic Encryption in Cloud Environment

Welcome to the **Applied Cryptography - Group 08** Cloud Processing Module. This component is part of the larger project *Encrypted Intelligence: Leveraging Homomorphic Encryption for Secure Healthcare Analytics*. It demonstrates how to securely process healthcare data in a cloud environment using homomorphic encryption—enabling computations on encrypted data without exposing sensitive information.

---

## **Table of Contents**
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
   - [Frontend Documentation](frontend.md)
    - [Backend Documentation](backend.md)
4. [Installation](#installation)
5. [Running the Project](#running-the-project)
6. [Usage](#usage)
7. [Project Structure](#project-structure)
8. [Contributing](#contributing)
9. [License](#license)

---
## **Overview**

This module simulates secure cloud processing by performing operations such as data aggregation and computations directly on encrypted inputs. The goal is to enable privacy-preserving data processing in sensitive environments like healthcare, where confidentiality is paramount.

The module consists of:
- **Frontend Application**: Built with React and Vite, providing an intuitive interface for data entry and result visualization.
- **Backend Service**: Developed in C++ using the Crow framework, handling the encryption, secure processing, and decryption operations.


---

## **Features**

This is still a prototype so functionality is limited to encryption and decryption of data using homomorphic encryption. It also includes an easy to use interface. 

---

## **Prerequisites**
- C++ compiler (version C++ 17)
- CMake (version 3.10 or higher)
- Crow library (this library is already included)

- Node.js ( version 16 or higher)
- npm 


---

## **Installation**

### **1. Clone the Repo**
```bash
git clone https://gitlab.maastrichtuniversity.nl/I6360608/applied-cryptography-group08.git

```

### **2. Run the backend**
```bash
cd applied-cryptography-group08/backend
cd build
./backend
```

### **3. Run the Frontend**
```bash
cd applied-cryptography-group08/frontend/
npm install
npm run dev
```

After running the frontend, open your browser and navigate to the URL provided in the terminal (typically [http://localhost:5173/](http://localhost:5173/)).


## **Contributors**

The following individuals contributed to the development of this project:

- **Luca**

- **Kamil**
- **Andrei**
- **Tomasz**
- **Jakub**
- **Yusuf**
- **Calin**


## **License**
Licensed under the MIT License.