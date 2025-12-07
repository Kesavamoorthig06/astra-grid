"""
ASTRA GRID - ML Models Manager
Loads and manages XGBoost prediction models
"""
import joblib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MLModelsManager:
    """Manages ML model loading and predictions"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLModelsManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._load_models()
            self._initialized = True
    
    def _load_models(self):
        """Load ML model bundle from disk"""
        try:
            # Construct path to models
            model_path = Path(__file__).parent.parent.parent / 'ml_model_extracted' / 'models' / 'powergrid_simulation_bundle.joblib'
            
            if not model_path.exists():
                logger.warning(f"Model bundle not found at {model_path}")
                self.bundle = None
                self.is_loaded = False
                return
            
            self.bundle = joblib.load(str(model_path))
            
            # Extract components
            self.cost_model = self.bundle.get('xgb_cost')
            self.delay_model = self.bundle.get('xgb_delay')
            self.scaler_cost = self.bundle.get('scaler_cost')
            self.scaler_delay = self.bundle.get('scaler_delay')
            self.feature_names_cost = self.bundle.get('feature_names_cost', [])
            self.feature_names_delay = self.bundle.get('feature_names_delay', [])
            self.cost_metrics = self.bundle.get('cost_metrics', {})
            self.delay_metrics = self.bundle.get('delay_metrics', {})
            
            self.is_loaded = (self.cost_model is not None and self.delay_model is not None)
            
            if self.is_loaded:
                logger.info(f"✓ Loaded ML models from {model_path}")
                logger.info(f"  - Cost model: {type(self.cost_model).__name__}")
                logger.info(f"  - Delay model: {type(self.delay_model).__name__}")
                logger.info(f"  - Features: {len(self.feature_names_cost)} cost, {len(self.feature_names_delay)} delay")
            else:
                logger.warning("Models loaded but could not be initialized")
        
        except Exception as e:
            logger.error(f"✗ Failed to load ML models: {e}")
            self.is_loaded = False
            self.bundle = None
    
    def predict_cost_overrun(self, features_df):
        """Predict cost overrun percentage"""
        if not self.is_loaded or self.cost_model is None:
            raise ValueError("Cost model not loaded")
        return self.cost_model.predict(features_df)
    
    def predict_timeline_delay(self, features_df):
        """Predict timeline delay in days"""
        if not self.is_loaded or self.delay_model is None:
            raise ValueError("Delay model not loaded")
        return self.delay_model.predict(features_df)
    
    def predict_risk_score(self, features_df):
        """Predict risk score (0-10 scale)"""
        if not self.is_loaded or self.cost_model is None:
            raise ValueError("Risk model not loaded")
        # Use cost model as proxy for risk
        return self.cost_model.predict(features_df)


# Singleton instance
ml_models = MLModelsManager()
