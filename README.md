# Homomorphic Encryption Project - Applied Cryptography Group 08

Welcome to the **Applied Cryptography - Group 08** project repository. This project demonstrates the implementation of homomorphic encryption for secure healthcare analytics, allowing computations to be performed on encrypted data without decrypting it.

This repository contains **three different implementations** of homomorphic encryption systems for healthcare analytics, each using different technology stacks and approaches:

## Project Versions

### 1. Microsoft SEAL Version (`microsoft-seal/`)

- **Backend**: C++ with Microsoft SEAL library and Crow framework
- **Frontend**: React with Vite
- **Focus**: High-performance native implementation with Microsoft's SEAL library
- **Use Case**: Real-time encrypted data processing and basic homomorphic operations

### 2. Node-SEAL Version (`node-seal/`)

- **Backend**: Node.js with node-seal library and Express
- **Frontend**: Next.js with TypeScript and modern UI components
- **Focus**: JavaScript ecosystem implementation with comprehensive UI
- **Use Case**: Rapid development and modern web-based homomorphic encryption

### 3. Machine Learning Version (`machine-learning/`)

- **Backend**: Python with Concrete ML and TenSEAL libraries
- **Models**: Logistic Regression and Neural Networks
- **Focus**: Privacy-preserving machine learning for healthcare predictions
- **Use Case**: Encrypted diabetes prediction and fully homomorphic ML training

## Documentation

Each version has its own detailed documentation:

- **[Microsoft SEAL Version Documentation](./microsoft-seal/README.md)** - C++ implementation setup and usage
- **[Node-SEAL Version Documentation](./node-seal/README.md)** - Node.js implementation setup and usage
- **[Machine Learning Version Documentation](./machine-learning/README.md)** - Python ML implementation with FHE

## Project Overview

This project is part of the larger initiative _"Encrypted Intelligence: Leveraging Homomorphic Encryption for Secure Healthcare Analytics"_. It demonstrates how to securely process healthcare data in various environments using different homomorphic encryption approaches—enabling computations on encrypted data without exposing sensitive information.

## Technology Comparison

| Feature                | Microsoft SEAL          | Node-SEAL               | Machine Learning      |
| ---------------------- | ----------------------- | ----------------------- | --------------------- |
| **Language**           | C++                     | Node.js/JavaScript      | Python                |
| **Frontend**           | React + Vite            | Next.js + TypeScript    | CLI/Jupyter           |
| **Encryption Library** | Microsoft SEAL (native) | node-seal (JS bindings) | Concrete ML + TenSEAL |
| **Performance**        | Highest (native C++)    | Good (JavaScript)       | Optimized for ML      |
| **Use Case**           | Real-time operations    | Web applications        | ML predictions        |

## Quick Start

Choose your preferred implementation based on your requirements:

1. **For high-performance real-time operations**: Use the [Microsoft SEAL version](./microsoft-seal/README.md)

   - Native C++ performance
   - Direct SEAL library integration
   - Ideal for production deployments

2. **For modern web development**: Use the [Node-SEAL version](./node-seal/README.md)

   - Full JavaScript/TypeScript stack
   - Modern UI with Next.js
   - Rapid prototyping and development

3. **For privacy-preserving machine learning**: Use the [Machine Learning version](./machine-learning/README.md)
   - Python-based ML implementations
   - Diabetes prediction models
   - Fully encrypted training and inference

All implementations provide core homomorphic encryption functionality for secure healthcare analytics, with each optimized for different use cases and deployment scenarios.

## Contributors

The following individuals contributed to the development of this project:

- **Andrei Visoiu**
- **Kamil Lipiński**
- **Luca Nichifor**
- **Yusuf Özkan**
- **Calin Suconicov**
- **Jakub Mazur**
- **Tomasz Mizera**

## License

This project is licensed under the [MIT License](LICENSE).

