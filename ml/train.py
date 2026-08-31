import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, brier_score_loss, accuracy_score
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "landslide_training_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

print("Loading training dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Dataset shape: {df.shape}")

# Feature columns
FEATURES = [
    'elevation', 'slope', 'aspect',
    'clay', 'sand', 'silt', 'bulk_density', 'organic_carbon', 'ph_h2o', 'nitrogen',
    'rainfall_1_day', 'rainfall_3_day', 'rainfall_7_day', 'rainfall_30_day'
]
TARGET = 'landslide'

X = df[FEATURES].values
y = df[TARGET].values
spatial_folds = df['spatial_fold'].values

print(f"Features ({len(FEATURES)}): {FEATURES}")

# Model Candidates
models_to_evaluate = {
    "Logistic Regression": Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(C=1.0, max_iter=1000, random_state=42))
    ]),
    "Random Forest": RandomForestClassifier(
        n_estimators=100, max_depth=6, min_samples_split=4, random_state=42
    ),
    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42
    )
}

unique_folds = np.unique(spatial_folds)
n_folds = len(unique_folds)
print(f"\nEvaluating with {n_folds}-Fold Spatial Cross-Validation (Spatial Blocking)...")

results = {}

for name, model in models_to_evaluate.items():
    print(f"\n--- Training & Evaluating: {name} ---")
    y_true_all = []
    y_pred_all = []
    y_prob_all = []
    
    for fold in unique_folds:
        train_mask = (spatial_folds != fold)
        test_mask = (spatial_folds == fold)
        
        X_train, y_train = X[train_mask], y[train_mask]
        X_test, y_test = X[test_mask], y[test_mask]
        
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)[:, 1]
        
        y_true_all.extend(y_test)
        y_pred_all.extend(preds)
        y_prob_all.extend(probs)
        
    y_true_all = np.array(y_true_all)
    y_pred_all = np.array(y_pred_all)
    y_prob_all = np.array(y_prob_all)
    
    acc = accuracy_score(y_true_all, y_pred_all)
    prec = precision_score(y_true_all, y_pred_all, zero_division=0)
    rec = recall_score(y_true_all, y_pred_all, zero_division=0)
    f1 = f1_score(y_true_all, y_pred_all, zero_division=0)
    roc_auc = roc_auc_score(y_true_all, y_prob_all)
    brier = brier_score_loss(y_true_all, y_prob_all)
    cm = confusion_matrix(y_true_all, y_pred_all).tolist()
    
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    print(f"  ROC-AUC:   {roc_auc:.4f}")
    print(f"  Brier:     {brier:.4f}")
    print(f"  Confusion Matrix: {cm}")
    
    results[name] = {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": cm
    }

# Pick Best Model (Random Forest / Gradient Boosting)
best_model_name = "Gradient Boosting" if results["Gradient Boosting"]["f1_score"] >= results["Random Forest"]["f1_score"] else "Random Forest"
print(f"\nBest Model by Spatial Cross-Validation: {best_model_name}")

# Train final production model on full dataset
final_model = models_to_evaluate[best_model_name]
final_model.fit(X, y)

# Extract Feature Importances
if hasattr(final_model, 'feature_importances_'):
    importances = final_model.feature_importances_
elif hasattr(final_model.named_steps['clf'], 'coef_'):
    importances = np.abs(final_model.named_steps['clf'].coef_[0])
else:
    importances = np.ones(len(FEATURES)) / len(FEATURES)

feat_imp = [
    {"feature": f, "importance": round(float(imp), 4)}
    for f, imp in sorted(zip(FEATURES, importances), key=lambda x: x[1], reverse=True)
]
print("\nTop 7 Feature Importances:")
for fi in feat_imp[:7]:
    print(f"  {fi['feature']}: {fi['importance']}")

# Save Model and Metadata
model_save_path = os.path.join(MODELS_DIR, "landsafe_risk_model.joblib")
joblib.dump({
    'model': final_model,
    'model_name': best_model_name,
    'features': FEATURES,
    'feature_importances': feat_imp
}, model_save_path)
print(f"\nSaved production model to {model_save_path}")

metrics_save_path = os.path.join(MODELS_DIR, "model_metrics.json")
with open(metrics_save_path, "w") as f:
    json.dump({
        "validation_strategy": "5-Fold Spatial Cross-Validation (Spatial Blocking)",
        "models": results,
        "selected_model": best_model_name,
        "feature_importances": feat_imp,
        "features": FEATURES,
        "dataset_summary": {
            "total_samples": len(df),
            "positives": int((df['landslide']==1).sum()),
            "negatives": int((df['landslide']==0).sum())
        }
    }, f, indent=2)
print(f"Saved benchmark metrics to {metrics_save_path}")
