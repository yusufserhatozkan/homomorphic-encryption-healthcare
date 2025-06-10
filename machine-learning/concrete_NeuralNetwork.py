import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    auc,
    log_loss,
    brier_score_loss,
    matthews_corrcoef,
    cohen_kappa_score,
    balanced_accuracy_score,
    fbeta_score,
    roc_curve
)
import time
import gc
import os
import torch
import torch.nn as nn

# Resource monitoring imports
import psutil
import threading
from collections import defaultdict
import matplotlib.pyplot as plt
from datetime import datetime

from concrete.ml.sklearn import NeuralNetClassifier
from concrete.ml.common.utils import FheMode

# Resource monitoring class
class ResourceMonitor:
    def __init__(self, name=""):
        self.name = name
        self.monitoring = False
        self.monitor_thread = None
        self.data = defaultdict(list)
        self.timestamps = []
        self.start_time = None
        
    def start_monitoring(self, interval=0.1):
        """Start monitoring system resources"""
        self.monitoring = True
        self.start_time = time.time()
        self.data = defaultdict(list)
        self.timestamps = []
        
        def monitor():
            while self.monitoring:
                current_time = time.time() - self.start_time
                
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=None)
                
                # Memory usage
                memory = psutil.virtual_memory()
                memory_percent = memory.percent
                memory_used_gb = memory.used / (1024**3)
                memory_available_gb = memory.available / (1024**3)
                
                # Process-specific usage
                process = psutil.Process()
                process_memory_mb = process.memory_info().rss / (1024**2)
                process_cpu_percent = process.cpu_percent()
                
                # Store data
                self.timestamps.append(current_time)
                self.data['cpu_percent'].append(cpu_percent)
                self.data['memory_percent'].append(memory_percent)
                self.data['memory_used_gb'].append(memory_used_gb)
                self.data['memory_available_gb'].append(memory_available_gb)
                self.data['process_memory_mb'].append(process_memory_mb)
                self.data['process_cpu_percent'].append(process_cpu_percent)
                
                time.sleep(interval)
        
        self.monitor_thread = threading.Thread(target=monitor, daemon=True)
        self.monitor_thread.start()
        
    def stop_monitoring(self):
        """Stop monitoring system resources"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=1.0)
            
    def get_summary(self):
        """Get summary statistics of resource usage"""
        if not self.data['cpu_percent']:
            return "No monitoring data available"
            
        summary = {
            'duration_seconds': self.timestamps[-1] if self.timestamps else 0,
            'cpu_percent': {
                'mean': np.mean(self.data['cpu_percent']),
                'max': np.max(self.data['cpu_percent']),
                'min': np.min(self.data['cpu_percent'])
            },
            'memory_percent': {
                'mean': np.mean(self.data['memory_percent']),
                'max': np.max(self.data['memory_percent']),
                'min': np.min(self.data['memory_percent'])
            },
            'process_memory_mb': {
                'mean': np.mean(self.data['process_memory_mb']),
                'max': np.max(self.data['process_memory_mb']),
                'min': np.min(self.data['process_memory_mb'])
            },
            'process_cpu_percent': {
                'mean': np.mean(self.data['process_cpu_percent']),
                'max': np.max(self.data['process_cpu_percent']),
                'min': np.min(self.data['process_cpu_percent'])
            }
        }
        return summary
        
    def save_data(self, filename=None):
        """Save monitoring data to CSV"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"resource_monitoring_{self.name}_{timestamp}.csv"
            
        df = pd.DataFrame({
            'timestamp': self.timestamps,
            'cpu_percent': self.data['cpu_percent'],
            'memory_percent': self.data['memory_percent'],
            'memory_used_gb': self.data['memory_used_gb'],
            'memory_available_gb': self.data['memory_available_gb'],
            'process_memory_mb': self.data['process_memory_mb'],
            'process_cpu_percent': self.data['process_cpu_percent']
        })
        
        df.to_csv(filename, index=False)
        print(f"Resource monitoring data saved to: {filename}")
        return filename

def plot_resource_usage(monitors, save_plots=True):
    """Create plots for resource usage comparison"""
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('Resource Usage During FHE Neural Network Operations', fontsize=16)
    
    # CPU Usage
    ax1 = axes[0, 0]
    for name, monitor in monitors.items():
        if monitor.timestamps:
            ax1.plot(monitor.timestamps, monitor.data['cpu_percent'], 
                    label=f'{name}', linewidth=2)
    ax1.set_xlabel('Time (seconds)')
    ax1.set_ylabel('CPU Usage (%)')
    ax1.set_title('System CPU Usage')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Memory Usage
    ax2 = axes[0, 1]
    for name, monitor in monitors.items():
        if monitor.timestamps:
            ax2.plot(monitor.timestamps, monitor.data['memory_percent'], 
                    label=f'{name}', linewidth=2)
    ax2.set_xlabel('Time (seconds)')
    ax2.set_ylabel('Memory Usage (%)')
    ax2.set_title('System Memory Usage')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    # Process Memory Usage
    ax3 = axes[1, 0]
    for name, monitor in monitors.items():
        if monitor.timestamps:
            ax3.plot(monitor.timestamps, monitor.data['process_memory_mb'], 
                    label=f'{name}', linewidth=2)
    ax3.set_xlabel('Time (seconds)')
    ax3.set_ylabel('Process Memory (MB)')
    ax3.set_title('Process Memory Usage')
    ax3.legend()
    ax3.grid(True, alpha=0.3)
    
    # Process CPU Usage
    ax4 = axes[1, 1]
    for name, monitor in monitors.items():
        if monitor.timestamps:
            ax4.plot(monitor.timestamps, monitor.data['process_cpu_percent'], 
                    label=f'{name}', linewidth=2)
    ax4.set_xlabel('Time (seconds)')
    ax4.set_ylabel('Process CPU Usage (%)')
    ax4.set_title('Process CPU Usage')
    ax4.legend()
    ax4.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_plots:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        plot_filename = f"resource_usage_plots_{timestamp}.png"
        plt.savefig(plot_filename, dpi=300, bbox_inches='tight')
        print(f"Resource usage plots saved to: {plot_filename}")
    
    plt.show()
    return fig

def print_resource_summary(monitor, phase_name):
    """Print summary of resource usage for a phase"""
    summary = monitor.get_summary()
    if isinstance(summary, str):
        print(summary)
        return
        
    print(f"\n{phase_name} Resource Usage Summary")
    print(f"Duration: {summary['duration_seconds']:.2f} seconds")
    print(f"CPU Usage - Mean: {summary['cpu_percent']['mean']:.1f}%, Max: {summary['cpu_percent']['max']:.1f}%, Min: {summary['cpu_percent']['min']:.1f}%")
    print(f"Memory Usage - Mean: {summary['memory_percent']['mean']:.1f}%, Max: {summary['memory_percent']['max']:.1f}%, Min: {summary['memory_percent']['min']:.1f}%")
    print(f"Process Memory - Mean: {summary['process_memory_mb']['mean']:.1f}MB, Max: {summary['process_memory_mb']['max']:.1f}MB, Min: {summary['process_memory_mb']['min']:.1f}MB")
    print(f"Process CPU - Mean: {summary['process_cpu_percent']['mean']:.1f}%, Max: {summary['process_cpu_percent']['max']:.1f}%, Min: {summary['process_cpu_percent']['min']:.1f}%")

def print_header(title, char='='):
    print(f"\n{char * 80}")
    print(f"{title}")
    print(f"{char * 80}")

def print_comparison(metric_name, plain_value, fhe_value, format_str=".4f"):
    print(f"{metric_name:<20} │ PLAINTEXT: {plain_value:{format_str}} │ FHE: {fhe_value:{format_str}} │ Diff: {abs(plain_value-fhe_value):{format_str}}")

monitors = {}



data_path = 'diabetes.csv'
df = pd.read_csv(data_path)

print(df.columns.tolist())

if 'Outcome' in df.columns:
    X = df.drop(['Outcome', 'Id'], axis=1, errors='ignore').values
    y = df['Outcome'].values.astype(int)
else:
    print("'Outcome' column not found, trying the last column")
    X = df.iloc[:, 1:-1].values
    y = df.iloc[:, -1].values.astype(int)

print(f"Loaded dataset with {X.shape[0]} entries and {X.shape[1]} features")
if X.shape[0] != 2768:
    print(f"warning less entries loaded")

print(f"\nDataset summary:")
print(f"- Shape: {X.shape}")
print(f"- Features: {X.shape[1]}")
print(f"- Class distribution: {np.bincount(y)}")

print_header(" Feature Selection", '-')
selector = SelectKBest(f_classif, k=6)
selector.fit(X, y)

selected_indices = selector.get_support(indices=True)
feature_names = ['Pregnancies','Glucose','BloodPressure','SkinThickness',
                 'Insulin','BMI','DiabetesPedigreeFunction','Age']
if len(feature_names) == X.shape[1]:
    selected_features = [feature_names[i] for i in selected_indices]
    print(f"Selected features: {selected_features}")
else:
    print(f"Selected feature indices: {selected_indices}")

X_selected = selector.transform(X)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_selected)
print_header("STEP 4: Train/Test Split", '-')
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y)
print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")

n_features = X_train.shape[1]
n_hidden1 = 12
n_hidden2 = 8
n_classes = 2

fhe_nn = NeuralNetClassifier(
    module__n_layers=3, 
    max_epochs=100,
    lr=0.01,
    batch_size=32,
    device="cpu",
    verbose=True
)

print(f"Neural Network Architecture:")
print(f"- Input Features: {n_features}")
print(f"- Hidden Layer 1: {n_hidden1} neurons")
print(f"- Hidden Layer 2: {n_hidden2} neurons")
print(f"- Output Classes: {n_classes}")
print(f"- Weight Quantization: 6 bits")
print(f"- Activation Quantization: 6 bits")
print(f"- Accumulator Size: 16 bits")

batch_size = 500
n_batches = (len(X_train) + batch_size - 1) // batch_size
nn_start = time.time()

print(f"Processing training data in {n_batches} batches of {batch_size} samples each")

training_monitor = ResourceMonitor("training")
monitors["Training"] = training_monitor
training_monitor.start_monitoring(interval=0.1)

try:
    fhe_nn.fit(X_train, y_train)
    print("Neural network training completed successfully")
except Exception as e:
    print(f"Error during training: {e}")
    print("Trying with smaller network and batch size...")
    fhe_nn = NeuralNetClassifier(
       module__n_layers=3,
        max_epochs=50,
        lr=0.01,
        batch_size=16,
        device="cpu",
        verbose=True
    )
    fhe_nn.fit(X_train, y_train)
    print("Smaller neural network training completed successfully")

training_monitor.stop_monitoring()
nn_training_time = time.time() - nn_start
print(f"Neural Network training time: {nn_training_time:.2f} seconds")


print_resource_summary(training_monitor, "Training")

print_header("PLAINTEXT Model Evaluation", '-')
print("Evaluating on test set (PLAINTEXT MODE)...")
y_pred_plain = fhe_nn.predict(X_test, fhe=FheMode.DISABLE)
y_prob_plain = fhe_nn.predict_proba(X_test, fhe=FheMode.DISABLE)[:, 1]
nn_plain_accuracy = np.mean(y_pred_plain == y_test)
print(f"PLAINTEXT Neural Network accuracy: {nn_plain_accuracy:.4f}")

ll_plain_test = log_loss(y_test, y_prob_plain)
brier_plain_test = brier_score_loss(y_test, y_prob_plain)
print(f"PLAINTEXT Test Log-loss: {ll_plain_test:.4f}")
print(f"PLAINTEXT Test Brier score: {brier_plain_test:.4f}")

best_model = fhe_nn
best_name = "Neural Network"
best_acc = nn_plain_accuracy
print(f"\nSelected {best_name} for FHE compilation (accuracy: {best_acc:.4f})")

print_header(" FHE Compilation", '-')
compile_start = time.time()

print("Starting resource monitoring for compilation phase...")
compilation_monitor = ResourceMonitor("compilation")
monitors["Compilation"] = compilation_monitor
compilation_monitor.start_monitoring(interval=0.1)

sss = StratifiedShuffleSplit(
    n_splits=1,
    test_size=min(100, len(X_train)//10),
    random_state=42
)
for _, calib_idx in sss.split(X_train, y_train):
    X_calib = X_train[calib_idx]

print(f"Compiling with {len(X_calib)} calibration samples...")
circuit_info = best_model.compile(X_calib, verbose=True)
compilation_monitor.stop_monitoring()
compile_time = time.time() - compile_start
print(f"FHE compilation completed in {compile_time:.2f} seconds")

print_resource_summary(compilation_monitor, "Compilation")


try:
    print(f"Circuit complexity:       {circuit_info.complexity}")
    print(f"p_error:                  {circuit_info.p_error:.2e}")
    print(f"global_p_error:           {circuit_info.global_p_error:.2e}")
except:
    print("Could not extract detailed circuit information")

print_header("FHE Prediction", '-')

fhe_inference_monitor = ResourceMonitor("fhe_inference")
monitors["FHE_Inference"] = fhe_inference_monitor
fhe_inference_monitor.start_monitoring(interval=0.1)

pred_batch_size = 20  
n_pred_batches = (len(X_test) + pred_batch_size - 1) // pred_batch_size
all_fhe_preds = []
all_fhe_probs = []
total_pred_time = 0.0

print(f"Processing predictions in {n_pred_batches} batches of {pred_batch_size} samples each")
for batch in range(n_pred_batches):
    start_idx = batch * pred_batch_size
    end_idx = min((batch + 1) * pred_batch_size, len(X_test))
    print(f"Predicting batch {batch+1}/{n_pred_batches} (samples {start_idx}-{end_idx})")
    
    Xb = X_test[start_idx:end_idx]
    batch_start = time.time()
    try:
        preds = best_model.predict(Xb, fhe=FheMode.EXECUTE)
        batch_time = time.time() - batch_start
        total_pred_time += batch_time
        
        all_fhe_preds.extend(preds)
        if hasattr(best_model, "predict_proba"):
            all_fhe_probs.extend(best_model.predict_proba(Xb, fhe=FheMode.EXECUTE)[:, 1])
            
        print(f"  Batch predicted in {batch_time:.2f} seconds")
    except Exception as e:
        print(f"Error during FHE prediction of batch {batch+1}: {e}")
        print("Falling back to simulation mode")
        preds = best_model.predict(Xb, fhe=FheMode.SIMULATE)
        all_fhe_preds.extend(preds)
        if hasattr(best_model, "predict_proba"):
            all_fhe_probs.extend(best_model.predict_proba(Xb, fhe=FheMode.SIMULATE)[:, 1])
    
    gc.collect()


fhe_inference_monitor.stop_monitoring()

fhe_predictions = np.array(all_fhe_preds)
fhe_accuracy = np.mean(fhe_predictions == y_test)

print(f"Total FHE prediction time: {total_pred_time:.2f} seconds")
print(f"Average time per sample: {total_pred_time/len(X_test):.4f} seconds")


print_resource_summary(fhe_inference_monitor, "FHE Inference")
print_comparison("Accuracy", best_acc, fhe_accuracy)

if len(all_fhe_probs) > 0:
    y_prob_fhe = np.array(all_fhe_probs)
    
    ll_fhe = log_loss(y_test, y_prob_fhe)
    brier_fhe = brier_score_loss(y_test, y_prob_fhe)
    
    print("\nLoss Metrics")
    print_comparison("Log-loss", ll_plain_test, ll_fhe)
    print_comparison("Brier score", brier_plain_test, brier_fhe)
    
    roc_auc_plain = roc_auc_score(y_test, y_prob_plain)
    roc_auc_fhe = roc_auc_score(y_test, y_prob_fhe)
    print("\nROC Metrics")
    print_comparison("ROC AUC", roc_auc_plain, roc_auc_fhe)
    
    precision_plain, recall_plain, _ = precision_recall_curve(y_test, y_prob_plain)
    pr_auc_plain = auc(recall_plain, precision_plain)
    
    precision_fhe, recall_fhe, _ = precision_recall_curve(y_test, y_prob_fhe)
    pr_auc_fhe = auc(recall_fhe, precision_fhe)
    
    print_comparison("PR AUC", pr_auc_plain, pr_auc_fhe)
else:
    print("\nProbability scores not available")

cm_plain = confusion_matrix(y_test, y_pred_plain)
tn_plain, fp_plain, fn_plain, tp_plain = cm_plain.ravel()
sensitivity_plain = tp_plain / (tp_plain + fn_plain)
specificity_plain = tn_plain / (tn_plain + fp_plain)
ppv_plain = tp_plain / (tp_plain + fp_plain)
npv_plain = tn_plain / (tn_plain + fn_plain)

cm_fhe = confusion_matrix(y_test, fhe_predictions)
tn_fhe, fp_fhe, fn_fhe, tp_fhe = cm_fhe.ravel()
sensitivity_fhe = tp_fhe / (tp_fhe + fn_fhe)
specificity_fhe = tn_fhe / (tn_fhe + fp_fhe)
ppv_fhe = tp_fhe / (tp_fhe + fp_fhe)
npv_fhe = tn_fhe / (tn_fhe + fn_fhe)

print("\nClassification Metrics")
print_comparison("Sensitivity", sensitivity_plain, sensitivity_fhe)
print_comparison("Specificity", specificity_plain, specificity_fhe)
print_comparison("PPV (Precision)", ppv_plain, ppv_fhe)
print_comparison("NPV", npv_plain, npv_fhe)

mcc_plain = matthews_corrcoef(y_test, y_pred_plain)
mcc_fhe = matthews_corrcoef(y_test, fhe_predictions)
kappa_plain = cohen_kappa_score(y_test, y_pred_plain)
kappa_fhe = cohen_kappa_score(y_test, fhe_predictions)
bacc_plain = balanced_accuracy_score(y_test, y_pred_plain)
bacc_fhe = balanced_accuracy_score(y_test, fhe_predictions)
f2_plain = fbeta_score(y_test, y_pred_plain, beta=2)
f2_fhe = fbeta_score(y_test, fhe_predictions, beta=2)

if len(all_fhe_probs) > 0:
    fpr_plain, tpr_plain, thresholds_plain = roc_curve(y_test, y_prob_plain)
    j_scores_plain = tpr_plain - fpr_plain
    opt_idx_plain = np.argmax(j_scores_plain)
    opt_threshold_plain = thresholds_plain[opt_idx_plain]
    
    fpr_fhe, tpr_fhe, thresholds_fhe = roc_curve(y_test, y_prob_fhe)
    j_scores_fhe = tpr_fhe - fpr_fhe
    opt_idx_fhe = np.argmax(j_scores_fhe)
    opt_threshold_fhe = thresholds_fhe[opt_idx_fhe]
    
    print("\nThreshold Analysis")
    print_comparison("Optimal threshold", opt_threshold_plain, opt_threshold_fhe, ".3f")
else:
    print("\nProbability scores not available, skipping optimal threshold calculation")

t0 = time.time()
_ = best_model.predict(X_test, fhe=FheMode.DISABLE)
plain_time = time.time() - t0

print("\nPerformance Timing")
print(f"Plaintext predict time:         {plain_time:.2f} seconds")
print(f"FHE predict time:               {total_pred_time:.2f} seconds")
print(f"Inference time ratio FHE/plain: {total_pred_time/plain_time:.1f}×")

print_header("Neural Network Architecture Analysis", '-')
print(f"Network Structure:")
print(f"- Input dimension: {n_features}")

if hasattr(fhe_nn, 'module__n_hidden_neurons'):
    if isinstance(fhe_nn.module__n_hidden_neurons, list):
        for i, layer_size in enumerate(fhe_nn.module__n_hidden_neurons):
            print(f"- Hidden layer {i+1}: {layer_size} neurons")
    else:
        print(f"- Hidden layer: {fhe_nn.module__n_hidden_neurons} neurons")
        
print(f"- Output dimension: {n_classes}")

print_header("Resource Monitoring Results", '=')
print("Saving resource monitoring data")
for name, monitor in monitors.items():
    filename = monitor.save_data()
    print(f"✓ {name} data saved")


print("\nGenerating resource usage plots")
try:
    plot_resource_usage(monitors, save_plots=True)
    print("✓ Resource usage plots generated and saved")
except Exception as e:
    print(f"Error generating plots: {e}")

print_header("Completed", '=')