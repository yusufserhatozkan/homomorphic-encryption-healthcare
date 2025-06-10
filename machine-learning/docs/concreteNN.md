# Concrete ML Neural Network Implementation

## Overview
This implementation demonstrates a **Fully Homomorphic Encryption (FHE)** neural network classifier using Concrete ML, applied to a diabetes prediction dataset. The system enables encrypted inference while monitoring resource usage throughout different phases.

## Key Components

### 1. Dataset Processing
- **Dataset**: Diabetes prediction (2,768 entries, 8 features)
- **Feature Selection**: SelectKBest reduces to 6 most relevant features
- **Preprocessing**: StandardScaler normalization
- **Split**: 80/20 train/test with stratification

### 2. Neural Network Architecture
```
Input (6 features) → Hidden Layer 1 (12 neurons) → Hidden Layer 2 (8 neurons) → Output (2 classes)
```
- **Quantization**: 6-bit weights and activations
- **Accumulator**: 16-bit
- **Training**: 100 epochs, learning rate 0.01, batch size 32

### 3. FHE Workflow

#### Training Phase (Plaintext)
- Standard neural network training on unencrypted data
- Resource monitoring tracks CPU and memory usage

#### Compilation Phase
- Converts trained model to FHE-compatible circuit
- Uses calibration subset (100 samples) for quantization
- Generates encrypted computation circuit

#### Inference Phase
- **Plaintext Mode**: Fast, unencrypted predictions for baseline
- **FHE Mode**: Encrypted predictions in batches of 20 samples

### 4. Resource Monitoring
The `ResourceMonitor` class tracks:
- System CPU/Memory usage
- Process-specific CPU/Memory consumption
- Real-time monitoring with 0.1s intervals
- Generates CSV files and visualization plots

### 5. Performance Metrics

#### Classification Metrics
- Accuracy, Sensitivity, Specificity
- Precision (PPV), Negative Predictive Value (NPV)
- ROC AUC, PR AUC

#### Loss Metrics
- Log-loss
- Brier score


## Important Notes

1. **Batch Processing**: FHE predictions are processed in small batches (20 samples) to manage memory
2. **Fallback Mode**: If FHE execution fails, system falls back to simulation mode
3. **Resource Intensive**: FHE operations require significant CPU and memory
4. **Accuracy Preservation**: FHE typically maintains accuracy within 0.1-1% of plaintext

## Usage Requirements
- Python 3.8+
- Concrete ML library
- PyTorch, scikit-learn, numpy, pandas
- psutil for resource monitoring
- ~8GB RAM recommended for FHE operations

## Output Files
- `resource_monitoring_[phase]_[timestamp].csv` - Resource usage data
- `resource_usage_plots_[timestamp].png` - Visualization of resource consumption

## Error Handling
- Automatic batch size reduction if memory issues occur
- Fallback to smaller network architecture if training fails
- Simulation mode available if FHE execution fails