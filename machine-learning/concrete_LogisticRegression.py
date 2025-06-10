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
from concrete.ml.sklearn import LogisticRegression as FHELogisticRegression
from concrete.ml.common.utils import FheMode


def print_header(title, char='='):
    print(f"\n{char * 80}")
    print(f"{title}")
    print(f"{char * 80}")

def print_comparison(metric_name, plain_value, fhe_value, format_str=".4f"):
    print(f"{metric_name:<20} │ PLAINTEXT: {plain_value:{format_str}} │ FHE: {fhe_value:{format_str}} │ Diff: {abs(plain_value-fhe_value):{format_str}}")


data_path = 'diabetes.csv'
df = pd.read_csv(data_path)

print("\nColumns:")
print(df.columns.tolist())

if 'Outcome' in df.columns:
    X = df.drop(['Outcome', 'Id'], axis=1, errors='ignore').values
    y = df['Outcome'].values.astype(int)
else:
    print("'Outcome' column not found, trying the last column")
    X = df.iloc[:, 1:-1].values
    y = df.iloc[:, -1].values.astype(int)

print(f"Loaded dataset with {X.shape[0]} entries and {X.shape[1]} features")

print(f"\nDataset summary:")
print(f"- Shape: {X.shape}")
print(f"- Features: {X.shape[1]}")
print(f"- Class distribution: {np.bincount(y)}")

print_header("Feature Selection", '-')
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


print_header(" Feature Normalization", '-')
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_selected)

print_header("Train/Test Split", '-')
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y)
print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")

print_header("Logistic Regression Training (PLAINTEXT)", '-')
print("\nTraining FHE Logistic Regression...")
fhe_lr = FHELogisticRegression(n_bits=6, fit_intercept=True)

batch_size = 500
n_batches = (len(X_train) + batch_size - 1) // batch_size
lr_start = time.time()

print(f"Processing training data in {n_batches} batches of {batch_size} samples each")
for batch in range(n_batches):
    start_idx = batch * batch_size
    end_idx = min((batch + 1) * batch_size, len(X_train))
    print(f"Training on batch {batch+1}/{n_batches} (samples {start_idx}-{end_idx})")
    
    X_batch = X_train[start_idx:end_idx]
    y_batch = y_train[start_idx:end_idx]
    
    if batch == 0:
        fhe_lr.fit(X_batch, y_batch)
    else:
        try:
            fhe_lr.partial_fit(X_batch, y_batch, classes=np.unique(y_train))
        except:
            print("Warning: partial_fit not available, using first batch only for training")
            break
    
    gc.collect()

lr_training_time = time.time() - lr_start
print(f"Logistic Regression training time: {lr_training_time:.2f} seconds")

print_header("PLAINTEXT Model Evaluation", '-')

print("Evaluating on test set (PLAINTEXT MODE)...")
y_pred_plain = fhe_lr.predict(X_test, fhe=FheMode.DISABLE)
y_prob_plain = fhe_lr.predict_proba(X_test, fhe=FheMode.DISABLE)[:, 1]
lr_plain_accuracy = np.mean(y_pred_plain == y_test)
print(f"PLAINTEXT Logistic Regression accuracy: {lr_plain_accuracy:.4f}")

ll_plain_test = log_loss(y_test, y_prob_plain)
brier_plain_test = brier_score_loss(y_test, y_prob_plain)
print(f"PLAINTEXT Test Log-loss: {ll_plain_test:.4f}")
print(f"PLAINTEXT Test Brier score: {brier_plain_test:.4f}")

best_model = fhe_lr
best_name = "Logistic Regression"
best_acc = lr_plain_accuracy
print(f"\nSelected {best_name} for FHE compilation (accuracy: {best_acc:.4f})")


print_header("FHE Compilation", '-')
compile_start = time.time()
print("Creating representative subset for compilation...")
sss = StratifiedShuffleSplit(
    n_splits=1,
    test_size=min(100, len(X_train)//10),
    random_state=42
)
for _, calib_idx in sss.split(X_train, y_train):
    X_calib = X_train[calib_idx]

print(f"Compiling with {len(X_calib)} calibration samples...")
circuit_info = best_model.compile(X_calib, verbose=True)
compile_time = time.time() - compile_start
print(f"FHE compilation completed in {compile_time:.2f} seconds")


try:
    print(f"Circuit complexity:       {circuit_info.complexity}")
    print(f"p_error:                  {circuit_info.p_error:.2e}")
    print(f"global_p_error:           {circuit_info.global_p_error:.2e}")
except:
    print("Could not extract detailed circuit information")

print_header("FHE Prediction", '-')
pred_batch_size = 50
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

fhe_predictions = np.array(all_fhe_preds)
fhe_accuracy = np.mean(fhe_predictions == y_test)

print(f"Total FHE prediction time: {total_pred_time:.2f} seconds")
print(f"Average time per sample: {total_pred_time/len(X_test):.4f} seconds")


print_header("PLAINTEXT vs FHE Performance Comparison", '=')



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
    print("\nProbability scores not available for FHE, skipping loss and curve metrics")

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
    print("\n not available")

t0 = time.time()
_ = best_model.predict(X_test, fhe=FheMode.DISABLE)
plain_time = time.time() - t0

print("\nPerformance Timing")
print(f"Plaintext predict time:         {plain_time:.2f} seconds")
print(f"FHE predict time:               {total_pred_time:.2f} seconds")
print(f"Inference time ratio FHE/plain: {total_pred_time/plain_time:.1f}×")


print_header("Logistic Regression Model", '-')

print("Logistic Regression Model Structure:")
print("- Input dimension: {0}".format(X_selected.shape[1]))
print("- Output dimension: 2 (binary classification)")
print("- Quantization bits: 6")


print_header("Done", '=')