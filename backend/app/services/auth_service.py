"""
ASTRA GRID - Authentication Service
User login, signup, and token management
"""
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.database import db_manager
from app.middleware.auth import generate_token
import datetime
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Handles user authentication"""
    
    @staticmethod
    def login(email, password):
        """Authenticate user with email and password"""
        try:
            email = email.strip().lower()
            
            # Find user
            user = db_manager.users_collection.find_one({'email': email})
            if not user:
                logger.warning(f"Login attempt with non-existent email: {email}")
                return None, "Invalid email or password"
            
            # Verify password
            if not check_password_hash(user['password'], password):
                logger.warning(f"Failed login attempt for: {email}")
                return None, "Invalid email or password"
            
            # Generate token
            token = generate_token(email)
            if not token:
                return None, "Token generation failed"
            
            logger.info(f"✓ User logged in: {email}")
            return {
                'token': token,
                'user': {
                    'email': user['email'],
                    'name': user.get('name', 'User')
                }
            }, None
        
        except Exception as e:
            logger.error(f"Login error: {e}")
            return None, str(e)
    
    @staticmethod
    def signup(name, email, password):
        """Register new user"""
        try:
            email = email.strip().lower()
            name = name.strip()
            
            # Validate inputs
            if not name or not email or not password:
                return None, "All fields required"
            
            # Check if user exists
            if db_manager.users_collection.find_one({'email': email}):
                logger.warning(f"Signup attempt with existing email: {email}")
                return None, "Email already registered"
            
            # Create new user
            new_user = {
                'name': name,
                'email': email,
                'password': generate_password_hash(password),
                'created_at': datetime.datetime.utcnow(),
                'updated_at': datetime.datetime.utcnow()
            }
            
            result = db_manager.users_collection.insert_one(new_user)
            
            # Generate token
            token = generate_token(email)
            if not token:
                return None, "Token generation failed"
            
            logger.info(f"✓ New user registered: {email}")
            return {
                'token': token,
                'user': {
                    'email': email,
                    'name': name
                }
            }, None
        
        except Exception as e:
            logger.error(f"Signup error: {e}")
            return None, str(e)
    
    @staticmethod
    def verify_token(token):
        """Verify JWT token validity"""
        try:
            from app.config.settings import current_config
            import jwt
            
            data = jwt.decode(
                token,
                current_config.JWT_SECRET_KEY,
                algorithms=[current_config.JWT_ALGORITHM]
            )
            
            user = db_manager.users_collection.find_one({'email': data['email']})
            if not user:
                return None, "User not found"
            
            return {
                'user': {
                    'email': user['email'],
                    'name': user.get('name', 'User')
                }
            }, None
        
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None, str(e)
    
    @staticmethod
    def seed_admin_users():
        """Seed default admin users if database is empty"""
        try:
            if db_manager.users_collection.count_documents({}) > 0:
                return True
            
            admin_users = [
                {
                    'name': 'Admin User',
                    'email': 'admin@powergrid.com',
                    'password': generate_password_hash('admin123'),
                    'role': 'admin',
                    'created_at': datetime.datetime.utcnow(),
                    'updated_at': datetime.datetime.utcnow()
                },
                {
                    'name': 'Test User',
                    'email': 'test@powergrid.com',
                    'password': generate_password_hash('test123'),
                    'role': 'user',
                    'created_at': datetime.datetime.utcnow(),
                    'updated_at': datetime.datetime.utcnow()
                }
            ]
            
            db_manager.users_collection.insert_many(admin_users)
            logger.info("✓ Seeded default admin users")
            return True
        
        except Exception as e:
            logger.error(f"Failed to seed users: {e}")
            return False
