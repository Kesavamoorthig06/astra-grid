"""Training pipeline for cost/timeline overrun simulation models.

This script reproduces the Colab workflow locally with a cleaner structure so the
resulting artefacts can be exported as a single Joblib bundle. It covers:
- feature engineering
- data preparation with scaling & one-hot encoding
- XGBoost regression for cost and timeline overruns
- risk scoring helper for downstream simulation dashboards
- hotspot identification (top feature importances)

Run from the project root, e.g.:

    python backend/train_simulation_models.py \
        --dataset data/Final_dataset.csv \
        --output backend/model_artifacts/powergrid_simulation_bundle.joblib \
        --report-dir backend/model_artifacts

The dataset column names must match those used during the original Colab training
session. See README or notebook for details.
"""
from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor


RANDOM_STATE = 42
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)



def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path}")
    df = pd.read_csv(path)
    logger.info("Loaded dataset with %d rows and %d columns", df.shape[0], df.shape[1])
    return df


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['Regulatory_Hotspot_Region'] = df['Regulatory_Hotspot_Region'].replace({
        '0rthern Region': 'Northern Region',
        '0rth Eastern Region': 'North Eastern Region',
    })
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['Cost_Ratio_Material_to_Labour'] = df['Material_Cost_Estimate_INR'] / (
        df['Labour_Cost_Estimate_INR'] + 1e-6
    )
    df['Permit_Efficiency'] = df['Average_Permit_Lag_Days'] / (
        df['Num_Required_Permits'] + 1e-6
    )
    df['Vendor_Risk_Score'] = df['Num_Vendor_Change_Events'] * (
        10 - df['Vendor_Performance_Rating']
    )
    return df


def prepare_data(
    df: pd.DataFrame,
    target_column: str,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, List[str], StandardScaler, List[str]]:
    leakage_columns = {
        'Project_ID',
        'Project_Start_Date',
        'Project_End_Date_Planned',
        'Project_End_Date_Actual',
        'Target_Duration_Days',
        'Actual_Duration_Days',
        'Timeline_Overrun_Days',
        'Target_Cost_INR',
        'Actual_Cost_INR',
        'Cost_Overrun_Percent',
        'Risk_Flag',
    }

    if target_column in leakage_columns:
        leakage_columns.remove(target_column)

    X = df.drop(columns=list(leakage_columns), errors='ignore')
    y = X.pop(target_column)

    numeric_columns = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_columns = X.select_dtypes(include=['object', 'category']).columns.tolist()

    X_encoded = pd.get_dummies(X, columns=categorical_columns, drop_first=True)
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=RANDOM_STATE
    )

    scaler = StandardScaler()
    if numeric_columns:
        scaler.fit(X_train[numeric_columns])
        X_train.loc[:, numeric_columns] = scaler.transform(X_train[numeric_columns])
        X_test.loc[:, numeric_columns] = scaler.transform(X_test[numeric_columns])

    return (
        X_train,
        X_test,
        y_train,
        y_test,
        X_encoded.columns.tolist(),
        scaler,
        numeric_columns,
    )


def train_xgb(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_valid: pd.DataFrame,
    y_valid: pd.Series,
    *,
    learning_rate: float,
    max_depth: int,
    subsample: float,
    colsample_bytree: float,
) -> XGBRegressor:
    model = XGBRegressor(
        objective='reg:squarederror',
        n_estimators=1000,
        learning_rate=learning_rate,
        max_depth=max_depth,
        subsample=subsample,
        colsample_bytree=colsample_bytree,
        early_stopping_rounds=50,
        eval_metric='mae',
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )

    model.fit(X_train, y_train, eval_set=[(X_valid, y_valid)], verbose=False)
    return model


def evaluate_model(model: XGBRegressor, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
    predictions = model.predict(X)
    return {
        'r2': float(r2_score(y, predictions)),
        'mae': float(mean_absolute_error(y, predictions)),
    }


def rank_hotspots(model: XGBRegressor, feature_names: Iterable[str], top_k: int = 10) -> List[Tuple[str, float]]:
    importance = model.feature_importances_
    pairs = sorted(zip(feature_names, importance), key=lambda item: item[1], reverse=True)
    return pairs[:top_k]


def classify_risk(cost_overrun_pct: float, delay_days: float) -> str:
    if cost_overrun_pct < 10 and delay_days < 30:
        return 'LOW'
    if cost_overrun_pct < 25 and delay_days < 90:
        return 'MEDIUM'
    if cost_overrun_pct < 50 and delay_days < 180:
        return 'HIGH'
    return 'CRITICAL'


def persist_bundle(output_path: Path, artifacts: Dict[str, object]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifacts, output_path)
    logger.info("Saved Joblib bundle to %s", output_path)


def persist_report(report_dir: Path, artifacts: Dict[str, object]) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    
    def convert_to_serializable(obj):
        """Convert numpy types to native Python types for JSON serialization."""
        if isinstance(obj, (np.integer, np.floating)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, list):
            return [convert_to_serializable(item) for item in obj]
        if isinstance(obj, tuple):
            return tuple(convert_to_serializable(item) for item in obj)
        if isinstance(obj, dict):
            return {k: convert_to_serializable(v) for k, v in obj.items()}
        return obj
    
    summary = {
        'cost_metrics': convert_to_serializable(artifacts['cost_metrics']),
        'delay_metrics': convert_to_serializable(artifacts['delay_metrics']),
        'risk_thresholds_cost': artifacts['risk_thresholds_cost'],
        'risk_thresholds_delay': artifacts['risk_thresholds_delay'],
        'hotspot_cost': convert_to_serializable(artifacts['hotspot_cost']),
        'hotspot_delay': convert_to_serializable(artifacts['hotspot_delay']),
    }
    report_path = report_dir / 'simulation_model_report.json'
    report_path.write_text(json.dumps(summary, indent=2))
    logger.info("Wrote report to %s", report_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train PowerGrid simulation models")
    parser.add_argument('--dataset', type=Path, required=True, help='Path to Final_dataset.csv')
    parser.add_argument('--output', type=Path, required=True, help='Joblib bundle output path')
    parser.add_argument('--report-dir', type=Path, default=None, help='Directory for JSON summaries')
    args = parser.parse_args()

    df = engineer_features(clean_dataset(load_dataset(args.dataset)))

    (
        X_train_cost,
        X_test_cost,
        y_train_cost,
        y_test_cost,
        feature_names_cost,
        scaler_cost,
        scaler_cols_cost,
    ) = prepare_data(df, 'Cost_Overrun_Percent')

    (
        X_train_delay,
        X_test_delay,
        y_train_delay,
        y_test_delay,
        feature_names_delay,
        scaler_delay,
        scaler_cols_delay,
    ) = prepare_data(df, 'Timeline_Overrun_Days')

    logger.info("Training cost overrun model")
    xgb_cost = train_xgb(
        X_train_cost,
        y_train_cost,
        X_test_cost,
        y_test_cost,
        learning_rate=0.05,
        max_depth=7,
        subsample=0.8,
        colsample_bytree=0.8,
    )

    logger.info("Training timeline overrun model")
    xgb_delay = train_xgb(
        X_train_delay,
        y_train_delay,
        X_test_delay,
        y_test_delay,
        learning_rate=0.04,
        max_depth=6,
        subsample=0.7,
        colsample_bytree=0.7,
    )

    cost_metrics = evaluate_model(xgb_cost, X_test_cost, y_test_cost)
    delay_metrics = evaluate_model(xgb_delay, X_test_delay, y_test_delay)

    hotspot_cost = rank_hotspots(xgb_cost, feature_names_cost)
    hotspot_delay = rank_hotspots(xgb_delay, feature_names_delay)

    artifacts = {
        'xgb_cost': xgb_cost,
        'xgb_delay': xgb_delay,
        'scaler_cost': scaler_cost,
        'scaler_delay': scaler_delay,
        'feature_names_cost': feature_names_cost,
        'feature_names_delay': feature_names_delay,
        'scaler_cols_cost': scaler_cols_cost,
        'scaler_cols_delay': scaler_cols_delay,
        'cost_metrics': cost_metrics,
        'delay_metrics': delay_metrics,
        'risk_thresholds_cost': {'low': 10.0, 'medium': 25.0, 'high': 50.0},
        'risk_thresholds_delay': {'low': 30.0, 'medium': 90.0, 'high': 180.0},
        'hotspot_cost': hotspot_cost,
        'hotspot_delay': hotspot_delay,
    }

    persist_bundle(args.output, artifacts)

    if args.report_dir:
        persist_report(args.report_dir, artifacts)

    logger.info(
        "Training finished. Cost R^2=%.3f | Delay R^2=%.3f",
        cost_metrics['r2'],
        delay_metrics['r2'],
    )


if __name__ == '__main__':
    main()
