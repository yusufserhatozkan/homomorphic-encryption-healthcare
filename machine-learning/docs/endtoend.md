# TenSEAL FHE Logistic Regression

## Overview
This implementation demonstrates **Fully Homomorphic Encryption (FHE)** using TenSEAL library for logistic regression. Unlike Concrete ML implementations, this performs actual homomorphic operations during training, enabling fully encrypted machine learning workflows.

## Key Components

### 1. Encryption Scheme
- **Library**: TenSEAL (Microsoft SEAL wrapper)
- **Scheme**: CKKS (for arithmetic on encrypted real numbers)
- **Polynomial degree**: 32,768
- **Coefficient moduli**: [60, 40, 40, 40, 40, 40, 40, 60] bits
- **Scale**: 2^40 for precision

### 2. Architecture
```
Encrypted Input → Encrypted Weights → Encrypted Operations → Encrypted Output
                                           ↓
                                    Sigmoid Approximation
```

### 3. Core Classes

#### HEVector
- Wraps TenSEAL ciphertext with metadata
- Tracks: size, noise level, scale
- Manages bootstrapping requirements

#### HEOperations
- Implements homomorphic arithmetic
- Tracks operation counts
- Manages noise growth and bootstrapping
- Operations: add, multiply, dot product, power

#### HomomorphicLogisticRegression
- Full encrypted training pipeline
- Gradient descent on encrypted data
- Sigmoid approximation: `0.5 + 0.1973x - 0.0048x³`

### 4. Resource Monitoring
```python
ResourceMonitor tracks:
- Memory usage (current/peak/delta)
- CPU utilization
- Execution time per phase
- Operation counts
```

## Workflow

### 1. Encryption Phase
- Encrypt training features (sample by sample)
- Encrypt labels
- Initialize encrypted weights
- Monitor: ~100 samples/checkpoint

### 2. Training Phase (Fully Encrypted)
- Forward pass: `sigmoid(Wx + b)` on encrypted data
- Gradient computation on encrypted values
- Weight updates using encrypted gradients
- Batch processing for efficiency

### 3. Inference Phase
- Encrypted predictions on test data
- No decryption until final step
- Maintains privacy throughout

### 4. Decryption Phase
- Decrypt only final predictions
- Apply threshold for classification
- Original data remains encrypted

## Key Features

### Privacy Guarantees
- **Full encryption**: Data never decrypted during training
- **Secure computation**: All operations on ciphertexts
- **Final-only decryption**: Only predictions revealed

### Noise Management
- Automatic bootstrapping when noise exceeds threshold
- Level tracking (max depth: 6)
- Scale management for CKKS operations

### Performance Optimization
- Batch processing (32 samples/batch)
- Simplified sigmoid approximation
- Strategic operation ordering

## Performance Metrics

### Operation Counts
- Homomorphic additions
- Homomorphic multiplications
- Bootstrap operations

### Model Evaluation
- Accuracy, Precision, Recall, F1-Score
- ROC AUC
- Confusion matrix visualization

## Advantages
1. **True FHE**: Actual homomorphic operations (vs. simulated)
2. **Privacy-preserving**: Complete data confidentiality
3. **Flexible**: Customizable encryption parameters
4. **Monitoring**: Detailed resource tracking

## Limitations
1. **Performance**: 100-1000× slower than plaintext
2. **Memory**: High RAM requirements (scales with data size)
3. **Complexity**: Requires careful noise management
4. **Approximations**: Sigmoid function approximated

## Requirements
- Python 3.8+
- TenSEAL library
- numpy, pandas, scikit-learn
- psutil, matplotlib
- ~16GB RAM for moderate datasets

## Key Differences from Concrete ML
| Aspect | TenSEAL | Concrete ML |
|--------|---------|-------------|
| Training | Encrypted | Plaintext |
| Operations | True FHE | Simulated → Compiled |
| Flexibility | High | Limited |
| Performance | Slower | Faster |
| Setup | Complex | Simple |

## Usage Example
```python
model = HomomorphicLogisticRegression(
    n_iter=30,
    learning_rate=0.1,
    poly_modulus_degree=32768
)
model.create_context()
enc_X, enc_y = model.encrypt_data(X_train, y_train)
model.fit(enc_X, enc_y, n_features)
predictions = model.predict(enc_X_test)
```

## Output Files
- `confusion_matrix_homomorphic.png` - Performance visualization
- Console logs with detailed operation tracking