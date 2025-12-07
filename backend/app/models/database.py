"""
ASTRA GRID - Database Connection Module
Handles MongoDB connection and collection management
"""
from pymongo import MongoClient
from app.config.settings import current_config
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages MongoDB connections and collections"""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._connect()
    
    def _connect(self):
        """Establish MongoDB connection"""
        try:
            self._client = MongoClient(current_config.MONGODB_URI)
            # Test connection
            self._client.admin.command('ping')
            self._db = self._client[current_config.MONGODB_DB_NAME]
            logger.info(f"✓ Connected to MongoDB: {current_config.MONGODB_DB_NAME}")
        except Exception as e:
            logger.error(f"✗ Failed to connect to MongoDB: {e}")
            raise
    
    @property
    def db(self):
        """Get database instance"""
        return self._db
    
    @property
    def users_collection(self):
        """Get users collection"""
        return self._db[current_config.USERS_COLLECTION]
    
    @property
    def predictions_collection(self):
        """Get predictions collection"""
        return self._db[current_config.PREDICTIONS_COLLECTION]
    
    @property
    def verification_collection(self):
        """Get verification codes collection"""
        return self._db[current_config.VERIFICATION_COLLECTION]
    
    def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            logger.info("Database connection closed")
    
    def health_check(self):
        """Check database connectivity"""
        try:
            self._client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False


# Singleton instance
db_manager = DatabaseManager()
