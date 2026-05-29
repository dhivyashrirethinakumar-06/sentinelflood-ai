import os
from dotenv import load_dotenv

# Load environment variables from a .env file if it exists
load_dotenv()

class Config:
    PROJECT_NAME = "Real-Time Flood Risk Prediction and Emergency Alert System"
    API_V1_STR = "/api/v1"
    
    # MongoDB Config
    # If standard connection fails or is default, db.py will activate the local JSON DB fallback automatically.
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "flood_alert_system")
    
    # JWT Auth Config
    JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_jwt_key_change_me_in_production_123456!")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days
    
    # External APIs
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
    
    # Twilio API Config
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Admin Secret Key (for making an account admin)
    ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "admin_super_secret_token_2026")

settings = Config()
