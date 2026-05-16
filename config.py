import os

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"
    PORT = int(os.getenv("PORT", 5001))
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/zkpm")
    JWT_SECRET = os.getenv("JWT_SECRET", "replace_me_with_32+_random_chars")
    JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", "30"))
    REFRESH_EXPIRES_DAYS = int(os.getenv("REFRESH_EXPIRES_DAYS", "7"))
    # Optional server-side AES key (hex). Leave empty if not used.
    SERVER_AES_KEY_HEX = os.getenv("SERVER_AES_KEY_HEX", "")
    DEBUG = True
    PORT = 5000
    MONGO_URI = "mongodb://localhost:27017/zk_project"
    SECRET_KEY = "your-secret-key"