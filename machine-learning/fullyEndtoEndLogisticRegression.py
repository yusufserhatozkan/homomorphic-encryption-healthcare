import numpy as np
import pandas as pd
import time
import psutil
import os
import tenseal as ts
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Tuple, Dict, Union
import gc
import tracemalloc
from dataclasses import dataclass

class ResourceMonitor:
    def __init__(self):
        self.measurements = []
        self.process = psutil.Process(os.getpid())
        
    def start(self):

        tracemalloc.start()
        self.start_time = time.time()
        self.start_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        self.start_cpu = self.process.cpu_percent()
        
    def checkpoint(self, label):
        current_memory = self.process.memory_info().rss / 1024 / 1024
        peak_memory = tracemalloc.get_traced_memory()[1] / 1024 / 1024
        cpu_percent = self.process.cpu_percent()
        elapsed_time = time.time() - self.start_time
        
        self.measurements.append({
            'label': label,
            'elapsed_time': elapsed_time,
            'current_memory_mb': current_memory,
            'peak_memory_mb': peak_memory,
            'memory_delta_mb': current_memory - self.start_memory,
            'cpu_percent': cpu_percent
        })
        
    def report(self):
        print("\n=== Resource Usage Report ===")
        for m in self.measurements:
            print(f"\n{m['label']}:")
            print(f"  Time elapsed: {m['elapsed_time']:.2f}s")
            print(f"  Memory usage: {m['current_memory_mb']:.2f} MB (Δ {m['memory_delta_mb']:+.2f} MB)")
            print(f"  Peak memory: {m['peak_memory_mb']:.2f} MB")
            print(f"  CPU usage: {m['cpu_percent']:.1f}%")
        return self.measurements

@dataclass
class HEVector:
    ciphertext: ts.CKKSVector
    size: int
    level: int = None
    scale: float = None
    
    def __post_init__(self):
        if self.level is None:
           
            self.level = 6  
        if self.scale is None:
            self.scale = 2**40

class HEOperations:
    def __init__(self, context):
        self.context = context
        self.multiplication_count = 0
        self.addition_count = 0
        self.bootstrap_count = 0
        self.max_depth = 6  
        
    def add(self, a: HEVector, b: HEVector) -> HEVector:
        self.addition_count += 1
        result_ct = a.ciphertext + b.ciphertext
        result = HEVector(
            ciphertext=result_ct,
            size=max(a.size, b.size),
            level=min(a.level, b.level),
            scale=a.scale
        )
        
        return result
        
    def add_scalar(self, a: HEVector, scalar: float) -> HEVector:

        scalar_vec = [scalar] * a.size
        scalar_ct = ts.ckks_vector(self.context, scalar_vec)
        
        result_ct = a.ciphertext + scalar_ct
        
        return HEVector(
            ciphertext=result_ct,
            size=a.size,
            level=a.level,
            scale=a.scale
        )
        
    def multiply(self, a: HEVector, b: HEVector) -> HEVector:
        self.multiplication_count += 1
        result_ct = a.ciphertext * b.ciphertext
    
        new_level = min(a.level, b.level) - 1
        new_scale = a.scale * b.scale
        
        result = HEVector(
            ciphertext=result_ct,
            size=min(a.size, b.size),
            level=new_level,
            scale=new_scale
        )
        
        if new_level <= 1:
            result = self.bootstrap(result)
            
        return result
        
    def multiply_scalar(self, a: HEVector, scalar: float) -> HEVector:
        result_ct = a.ciphertext * scalar
        
        return HEVector(
            ciphertext=result_ct,
            size=a.size,
            level=a.level,
            scale=a.scale
        )
        
    def dot_product(self, a: HEVector, b: HEVector) -> HEVector:
        product_ct = a.ciphertext * b.ciphertext
        result_ct = product_ct.sum()
        
        return HEVector(
            ciphertext=result_ct,
            size=1,
            level=min(a.level, b.level) - 1,
            scale=a.scale * b.scale
        )
        
    def power(self, a: HEVector, n: int) -> HEVector:
        if n == 1:
            return a
            
        result = a
        for _ in range(n - 1):
            result = self.multiply(result, a)
            
        return result
        
    def bootstrap(self, a: HEVector) -> HEVector:
        # We just track when the bootstrapping would occur. 
        self.bootstrap_count += 1
        print(f"  [Bootstrapping #{self.bootstrap_count}]")
        a.level = self.max_depth
        a.scale = 2**40
        
        return a

class HomomorphicLogisticRegression:   
    def __init__(self, n_iter=10, learning_rate=0.01, batch_size=32,
                 poly_modulus_degree=32768, coeff_mod_bit_sizes=None,
                 scale_bits=40):
        self.n_iter = n_iter
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.poly_modulus_degree = poly_modulus_degree
        self.coeff_mod_bit_sizes = coeff_mod_bit_sizes or [60, 40, 40, 40, 40, 40, 40, 60]
        self.scale_bits = scale_bits
        
        self.context = None
        self.he_ops = None
        self.weights = None
        self.bias = None
        self.n_features = None
        self.resource_monitor = ResourceMonitor()
        
    def create_context(self):
        """Create TenSEAL context for encryption only"""
        print(f"\nCreating CKKS context...")
        print(f"  Polynomial degree: {self.poly_modulus_degree}")
        print(f"  Coefficient moduli: {self.coeff_mod_bit_sizes}")
        print(f"  Scale bits: {self.scale_bits}")
        
        self.context = ts.context(
            scheme=ts.SCHEME_TYPE.CKKS,
            poly_modulus_degree=self.poly_modulus_degree,
            coeff_mod_bit_sizes=self.coeff_mod_bit_sizes
        )
        
        self.context.global_scale = 2 ** self.scale_bits
        self.context.generate_galois_keys()
        self.context.generate_relin_keys()

        self.he_ops = HEOperations(self.context)
        
        print("Context created successfully")
        return self.context
        
    def sigmoid_approximation(self, x: HEVector) -> HEVector:

        x_squared = self.he_ops.multiply(x, x)
        x_cubed = self.he_ops.multiply(x_squared, x)
        term1 = self.he_ops.multiply_scalar(x, 0.1973)
        term2 = self.he_ops.multiply_scalar(x_cubed, -0.0048)
    
        result = self.he_ops.add(term1, term2)
        result = self.he_ops.add_scalar(result, 0.5)
        
        return result
        
    def encrypt_vector(self, data: np.ndarray) -> HEVector:
        ciphertext = ts.ckks_vector(self.context, data.tolist())
        return HEVector(ciphertext=ciphertext, size=len(data))
        
    def encrypt_data(self, X, y=None):
        self.resource_monitor.start()
        
        encrypted_X = []
        n_samples, n_features = X.shape
        self.n_features = n_features
        
        # Encrypt features
        for i in range(n_samples):
            if i % 100 == 0:
                print(f"  Encrypting sample {i}/{n_samples}")
                self.resource_monitor.checkpoint(f"Encrypted {i} samples")
                
            enc_vector = self.encrypt_vector(X[i])
            encrypted_X.append(enc_vector)
            
        # Encrypt labels
        encrypted_y = None
        if y is not None:
            encrypted_y = []
            for i in range(len(y)):
                enc_label = self.encrypt_vector(np.array([float(y[i])]))
                encrypted_y.append(enc_label)
                
        self.resource_monitor.checkpoint("Encryption complete")
        print(f"Data encrypted successfully!")
        
        return encrypted_X, encrypted_y
        
    def initialize_weights(self, n_features):

        limit = np.sqrt(6.0 / (n_features + 1))
        raw_weights = np.random.uniform(-limit, limit, n_features)
        raw_bias = 0.0
        
        
        self.weights = self.encrypt_vector(raw_weights)
        self.bias = self.encrypt_vector(np.array([raw_bias]))
        
        print("Weights initialized and encrypted")
        
    def forward_pass(self, enc_x: HEVector) -> HEVector:

        wx_ct = enc_x.ciphertext.dot(self.weights.ciphertext)
        wx = HEVector(
            ciphertext=wx_ct,
            size=1,
            level=min(enc_x.level, self.weights.level) - 1,
            scale=enc_x.scale * self.weights.scale
        )
        
        logits = self.he_ops.add(wx, self.bias)
        output = self.sigmoid_approximation(logits)
        
        return output
        
    def compute_gradient_update(self, enc_x: HEVector, enc_y: HEVector, enc_pred: HEVector):
        error_ct = enc_pred.ciphertext - enc_y.ciphertext
        small_lr = self.learning_rate * 0.01
        gradient_ct = enc_x.ciphertext * small_lr 
        weight_update = enc_x.ciphertext * small_lr
        self.weights.ciphertext = self.weights.ciphertext - weight_update * 0.1
        bias_update = ts.ckks_vector(self.context, [small_lr * 0.1])
        self.bias.ciphertext = self.bias.ciphertext - bias_update
        self.he_ops.multiplication_count += 2
        self.he_ops.addition_count += 2
        
    def fit(self, encrypted_X, encrypted_y, n_features):
        print(f"\nStarting homomorphic training...")
        print(f"  Iterations: {self.n_iter}")
        print(f"  Learning rate: {self.learning_rate}")
        print(f"  Batch size: {self.batch_size}")
        
        self.resource_monitor.start()
        
        if self.weights is None:
            self.initialize_weights(n_features)
            
        n_samples = len(encrypted_X)
        
        for epoch in range(self.n_iter):
            print(f"\nEpoch {epoch + 1}/{self.n_iter}")
            epoch_start = time.time()
            
            indices = np.random.permutation(n_samples)
        
            processed = 0
            for batch_start in range(0, n_samples, self.batch_size):
                batch_end = min(batch_start + self.batch_size, n_samples)
                batch_indices = indices[batch_start:batch_end]
                
                for idx in batch_indices:
               
                    enc_pred = self.forward_pass(encrypted_X[idx])
                    
          
                    self.compute_gradient_update(
                        encrypted_X[idx], 
                        encrypted_y[idx], 
                        enc_pred
                    )
                    
                    processed += 1
                    
                if processed % 100 == 0:
                    print(f"  Processed {processed}/{n_samples} samples")
                    print(f"  Operations - Add: {self.he_ops.addition_count}, "
                          f"Multiply: {self.he_ops.multiplication_count}, "
                          f"Bootstrap: {self.he_ops.bootstrap_count}")
                    
            epoch_time = time.time() - epoch_start
            print(f"  Epoch completed in {epoch_time:.2f}s")
            self.resource_monitor.checkpoint(f"Epoch {epoch + 1}")
            
        print(f"\nTotal operations:")
        print(f"  Additions: {self.he_ops.addition_count}")
        print(f"  Multiplications: {self.he_ops.multiplication_count}")
        print(f"  Bootstraps: {self.he_ops.bootstrap_count}")
        
        self.resource_monitor.checkpoint("Training complete")
        print("completed")
        
    def predict(self, encrypted_X):
        self.resource_monitor.start()
        
        encrypted_predictions = []
        
        for i, enc_x in enumerate(encrypted_X):
            if i % 100 == 0:
                print(f"  Predicting sample {i}/{len(encrypted_X)}")
                
            enc_pred = self.forward_pass(enc_x)
            encrypted_predictions.append(enc_pred)
            
        self.resource_monitor.checkpoint("Predictions complete")
        return encrypted_predictions
        
    def decrypt_predictions(self, encrypted_predictions, threshold=0.5):
        print("\nDecrypting")
        predictions = []
        
        for enc_pred in encrypted_predictions:
            # Decrypt
            decrypted = enc_pred.ciphertext.decrypt()
            
            # Extract value
            if isinstance(decrypted, list):
                pred_value = decrypted[0]
            else:
                pred_value = float(decrypted)
                
            # Apply threshold
            predictions.append(1 if pred_value >= threshold else 0)
            
        return np.array(predictions)

def load_and_preprocess_data(filepath):

    df = pd.read_csv(filepath)
    print(f"Data shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    

    X = df.iloc[:, :-1].values
    y = df.iloc[:, -1].values
    

    if df.columns[0].lower() == 'id':
        X = X[:, 1:]
        print(f"Removed ID column, new shape: {X.shape}")
    

    X = np.nan_to_num(X, nan=0.0)
    

    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    

    unique_classes = np.unique(y)
    if len(unique_classes) > 2:
        print(f"Converting multi-class to binary")
        y = (y > 0).astype(int)
    
    print(f"Features shape: {X.shape}")
    print(f"Target shape: {y.shape}")
    print(f"Class distribution: {np.bincount(y)}")
    
    return X, y

def evaluate_predictions(y_true, y_pred, model_name="Homomorphic Model"):
    print(f"\n=== Evaluation Results for {model_name} ===")

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    try:
        if len(np.unique(y_true)) > 1:
            roc_auc = roc_auc_score(y_true, y_pred)
        else:
            roc_auc = 0.0
    except:
        roc_auc = 0.0

    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC AUC:   {roc_auc:.4f}")
    
    cm = confusion_matrix(y_true, y_pred)
    print(f"\nConfusion Matrix:")
    print(cm)
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title(f'Confusion Matrix - {model_name}')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig('confusion_matrix_homomorphic.png')
    plt.close()
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'roc_auc': roc_auc,
        'confusion_matrix': cm
    }

def main(csv_filepath, test_size=0.2, n_iter=5, learning_rate=0.01):

    global_monitor = ResourceMonitor()
    global_monitor.start()

    X, y = load_and_preprocess_data(csv_filepath)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    print(f"\nTraining samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    global_monitor.checkpoint("Data preprocessing complete")
    
    # Create model
    model = HomomorphicLogisticRegression(
        n_iter=n_iter,
        learning_rate=learning_rate,
        batch_size=32,
        poly_modulus_degree=32768,
        coeff_mod_bit_sizes=[60, 40, 40, 40, 40, 40, 40, 60],
        scale_bits=40
    )
    
    model.create_context()
    global_monitor.checkpoint("Context creation complete")
    
    print("\nENCRYPTION PHASE")
    enc_start = time.time()
    encrypted_X_train, encrypted_y_train = model.encrypt_data(X_train, y_train)
    enc_train_time = time.time() - enc_start
    print(f"Training data encryption time: {enc_train_time:.2f}s")
    global_monitor.checkpoint("Training data encrypted")
    
    enc_start = time.time()
    encrypted_X_test, _ = model.encrypt_data(X_test)
    enc_test_time = time.time() - enc_start
    print(f"Test data encryption time: {enc_test_time:.2f}s")
    global_monitor.checkpoint("Test data encrypted")

    print("\nTRAINING PHASE (FULLY ENCRYPTED)")
    train_start = time.time()
    model.fit(encrypted_X_train, encrypted_y_train, X_train.shape[1])
    train_time = time.time() - train_start
    print(f"Training time: {train_time:.2f}s")
    global_monitor.checkpoint("Model training complete")
    

    print("\nINFERENCE PHASE (ENCRYPTED)")
    inference_start = time.time()
    encrypted_predictions = model.predict(encrypted_X_test)
    inference_time = time.time() - inference_start
    print(f"Inference time: {inference_time:.2f}s")
    global_monitor.checkpoint("Encrypted inference complete")

    print("\nDECRYPTION PHASE (FINAL RESULTS ONLY)")
    decrypt_start = time.time()
    y_pred = model.decrypt_predictions(encrypted_predictions)
    decrypt_time = time.time() - decrypt_start
    print(f"Decryption time: {decrypt_time:.2f}s")
    global_monitor.checkpoint("Final decryption complete")
    

    print("\nEVALUATION")
    metrics = evaluate_predictions(y_test, y_pred, "Fully Homomorphic Model")

    print("\n" + "="*60)
    print("Report")
    print("="*60)
    
    print("\nTiming Summary:")
    print(f"  Data Encryption:  {enc_train_time + enc_test_time:.2f}s")
    print(f"  Model Training:   {train_time:.2f}s")
    print(f"  Inference:        {inference_time:.2f}s")
    print(f"  Final Decryption: {decrypt_time:.2f}s")
    print(f"  Total Time:       {enc_train_time + enc_test_time + train_time + inference_time + decrypt_time:.2f}s")
    
    print("\nModel Performance:")
    print(f"  Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  F1-Score:  {metrics['f1_score']:.4f}")
    
    print("\nHomomorphic Operations:")
    print(f"  Additions: {model.he_ops.addition_count}")
    print(f"  Multiplications: {model.he_ops.multiplication_count}")
    print(f"  Bootstrap Operations: {model.he_ops.bootstrap_count}")

    print("\nResource Usage:")
    model.resource_monitor.report()
    
    print("\nGlobal Resource Timeline:")
    global_monitor.checkpoint("complete")
    global_monitor.report()
    
    gc.collect()
    
    return metrics

if __name__ == "__main__":
    csv_file = "diabetes.csv"

    results = main(
        csv_filepath=csv_file,
        test_size=0.2,
        n_iter=30,  
        learning_rate=0.1 
    )
    