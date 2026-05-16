from pymongo import MongoClient, ASCENDING
from backend.config import Config
from flask_pymongo import PyMongo

# Connect to MongoDB using the URI from Config
client = MongoClient(Config.MONGO_URI)



# Select the database
db = client["zk_project"]  # Database name


# Collections
users = db["users"]         # ✅ user collection
vaults = db["vaults"]       # ✅ vault collection


# Collections
users_collection = db["users"]
vaults = db["vault"]  # consistent with vault service

# Create Indexes
users_collection.create_index([("email", ASCENDING)], unique=True)
vaults.create_index([("user_id", ASCENDING)], unique=True)

print("✅ Connected to Local MongoDB")
