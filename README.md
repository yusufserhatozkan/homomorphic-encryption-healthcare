# Homomorphic Encryption Project - Applied Cryptography Group 08

Welcome to the **Applied Cryptography - Group 08** project repository. This project demonstrates the implementation of homomorphic encryption for secure healthcare analytics, allowing computations to be performed on encrypted data without decrypting it.

This repository contains **two different implementations** of the same homomorphic encryption system, each using different technology stacks:

## Project Versions

### 1. Microsoft SEAL Version (`microsoft-seal/`)
- **Backend**: C++ with Microsoft SEAL library and Crow framework
- **Frontend**: React with Vite
- **Focus**: High-performance native implementation with Microsoft's SEAL library

### 2. Node-SEAL Version (`node-seal/`)
- **Backend**: Node.js with node-seal library and Express
- **Frontend**: Next.js with TypeScript and modern UI components
- **Focus**: JavaScript ecosystem implementation with comprehensive UI

## Documentation

Each version has its own detailed documentation:

- **[Microsoft SEAL Version Documentation](./microsoft-seal/README.md)** - C++ implementation setup and usage
- **[Node-SEAL Version Documentation](./node-seal/README.md)** - Node.js implementation setup and usage

## Project Overview

This project is part of the larger initiative *"Encrypted Intelligence: Leveraging Homomorphic Encryption for Secure Healthcare Analytics"*. It demonstrates how to securely process healthcare data in a cloud environment using homomorphic encryption—enabling computations on encrypted data without exposing sensitive information.

**Related Repository**: [Machine Learning Component](https://gitlab.maastrichtuniversity.nl/I6365974/machine-learning)

## Technology Comparison

| Feature | Microsoft SEAL Version | Node-SEAL Version |
|---------|----------------------|-------------------|
| **Backend Language** | C++ | Node.js/JavaScript |
| **Frontend Framework** | React + Vite | Next.js + TypeScript |
| **Encryption Library** | Microsoft SEAL (native) | node-seal (JavaScript bindings) |
| **Performance** | Higher (native C++) | Good (JavaScript) |
| **Development Speed** | Moderate | Faster |
| **UI Complexity** | Simple | Advanced with modern components |

## Quick Start

Choose your preferred implementation and follow the respective documentation:

1. **For C++ developers or high-performance requirements**: Use the [Microsoft SEAL version](./microsoft-seal/README.md)
2. **For JavaScript developers or rapid prototyping**: Use the [Node-SEAL version](./node-seal/README.md)

Both implementations provide the same core functionality for homomorphic encryption operations on healthcare data.

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