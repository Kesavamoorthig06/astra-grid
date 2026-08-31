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
            self.bundle = None
            self.is_loaded = False
            self.cost_model = None
            self.delay_model = None
            self.scaler_cost = None
            self.scaler_delay = None
            self.feature_names_cost = []
            self.feature_names_delay = []
            self.cost_metrics = {}
            self.delay_metrics = {}
            self._load_error = None
            self._load_models()
            self._initialized = True

    def load_models(self, force=False):
        """Load the model bundle on demand."""
        if self.is_loaded and not force:
            return True

        self._load_models()
        return self.is_loaded
    
    def _load_models(self):
        """Load ML model bundle from disk"""
        try:
            self._load_error = None
            # Construct path to models
            model_path = Path(__file__).parent.parent.parent / 'ml_models_powergrid' / 'models' / 'powergrid_simulation_bundle.joblib'
            
            logger.info(f"Attempting to load models from: {model_path}")
            logger.info(f"Model file exists: {model_path.exists()}")
            
            if not model_path.exists():
                logger.warning(f"Model bundle not found at {model_path}")
                self._load_error = f"Model bundle not found at {model_path}"
                self.bundle = None
                self.is_loaded = False
                self.cost_model = None
                self.delay_model = None
                self.feature_names_cost = []
                self.feature_names_delay = []
                return
            
            self.bundle = joblib.load(str(model_path))
            logger.info(f"✓ Bundle loaded, contents: {list(self.bundle.keys())}")
            
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
                logger.info(f"  - Features (cost): {len(self.feature_names_cost)} - {self.feature_names_cost[:3]}...")
                logger.info(f"  - Features (delay): {len(self.feature_names_delay)} - {self.feature_names_delay[:3]}...")
            else:
                logger.warning(f"Models loaded but not fully initialized. Cost: {self.cost_model}, Delay: {self.delay_model}")
                self.is_loaded = False
        
        except Exception as e:
            logger.error(f"✗ Failed to load ML models: {e}", exc_info=True)
            self._load_error = str(e)
            self.is_loaded = False
            self.bundle = None
            self.cost_model = None
            self.delay_model = None
            self.feature_names_cost = []
            self.feature_names_delay = []
    
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
