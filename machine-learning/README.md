# Diabetes Prediction with Fully Homomorphic Encryption

This project implements privacy-preserving machine learning for diabetes prediction using Fully Homomorphic Encryption (FHE). We provide three different implementations showcasing various approaches to encrypted machine learning, from practical compiled models to fully encrypted end-to-end training.

## Privacy-Preserving Machine Learning

Unlike traditional ML approaches, this project enables healthcare predictions without exposing sensitive patient data:

- **Complete Privacy**: Patient data remains encrypted throughout the entire ML pipeline
- **Secure Computation**: FHE enables computations directly on encrypted data

## Project Structure

```
machine-learning/
├── docs/
│   ├── concreteLR.md         # Concrete ML Logistic Regression documentation
│   ├── concreteNN.md         # Concrete ML Neural Network documentation
│   └── endtoend.md           # End-to-end encrypted training documentation
├── concrete_LogisticRegression.py    # Concrete ML LR implementation
├── concrete_NeuralNetwork.py         # Concrete ML NN with resource monitoring
├── fullyEndtoEndLogisticRegression.py # TenSEAL-based fully encrypted training
├── diabetes.csv                      # Dataset
├── requirements.txt                  # Dependencies
└── README.md                        # This file
```

## Implementations

### 1. Concrete ML Logistic Regression
- **File**: `concrete_LogisticRegression.py`
- **Approach**: Compiled FHE model for efficient encrypted inference
- **Training**: Plaintext (for efficiency)
- **Inference**: Fully encrypted
- **Best for**: Production deployments requiring fast encrypted predictions

### 2. Concrete ML Neural Network
- **File**: `concrete_NeuralNetwork.py`
- **Architecture**: 3-layer network (12→8→2 neurons)
- **Features**: Resource monitoring, performance tracking
- **Training**: Plaintext
- **Inference**: Fully encrypted with batch processing
- **Best for**: Complex patterns requiring non-linear decision boundaries

### 3. TenSEAL End-to-End Encrypted Training
- **File**: `fullyEndtoEndLogisticRegression.py`
- **Approach**: Fully homomorphic training and inference
- **Encryption**: CKKS scheme for real number operations
- **Training**: Completely encrypted gradient descent
- **Best for**: Maximum privacy requirements, research applications

## Installation

1. **Clone the repository**:
```bash
git clone https://gitlab.maastrichtuniversity.nl/I6365974/machine-learning.git
cd machine-learning
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

## Usage

### Running Concrete ML Logistic Regression
```bash
python concrete_LogisticRegression.py
```

### Running Concrete ML Neural Network
```bash
python concrete_NeuralNetwork.py
```

### Running TenSEAL End-to-End Encrypted Model
```bash
python fullyEndtoEndLogisticRegression.py
```

## Key Features

### Resource Monitoring (Neural Network)
- Real-time CPU and memory tracking
- Process-specific resource usage
- Visualization of resource consumption
- Performance benchmarking

### Comprehensive Metrics
- Classification: Accuracy, Precision, Recall, F1-Score
- Probabilistic: ROC AUC, PR AUC, Log-loss, Brier score
- Clinical: Sensitivity, Specificity, PPV, NPV

### Batch Processing
- Efficient memory management
- Configurable batch sizes
- Progress tracking
- Automatic fallback mechanisms

## Requirements

- Python 3.8-3.10
- 8GB RAM (minimum)
- 16GB RAM (recommended for TenSEAL)

Key dependencies:
- `concrete-ml`: For compiled FHE models
- `tenseal`: For CKKS-based FHE operations
- `torch`: Neural network support
- `scikit-learn`: ML utilities
- `psutil`: Resource monitoring

## Documentation

Detailed documentation for each implementation:

- [Concrete ML Logistic Regression](docs/concreteLR.md) - Simple, efficient FHE inference
- [Concrete ML Neural Network](docs/concreteNN.md) - Complex patterns with resource tracking
- [End-to-End Encrypted Training](docs/endtoend.md) - Full privacy with TenSEAL

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
