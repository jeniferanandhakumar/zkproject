from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_pymongo import PyMongo
from backend.routes.auth_routes import auth_bp
from backend.routes.vault_routes import vault_bp
from backend.config import Config
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["MONGO_URI"] = "mongodb://localhost:27017/vaultDB"

    # Enable CORS only for /api/*
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Mongo
    mongo = PyMongo(app)  # assign to variable

    # Health check
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(vault_bp, url_prefix="/api/vault")

    # Root route
    @app.route("/")
    def home():
        return "Flask server is running!"

    # Favicon
    @app.route("/favicon.ico")
    def favicon():
        return send_from_directory(
            os.path.join(app.root_path, "static"),
            "favicon.ico",
            mimetype="image/vnd.microsoft.icon"
        )

    # ---------------- Vault endpoint ---------------- #
    vault_store = {
        "test@example.com": [
            {"site": "Gmail", "user": "user1", "raw_password": "123456", "password": "ENCRYPTED1"},
            {"site": "Facebook", "user": "user2", "raw_password": "abcdef", "password": "ENCRYPTED2"}
        ]
    }

    # GET vault entries
    @app.route("/api/vault/<email>", methods=["GET"])
    def get_vault(email):
        # Try MongoDB first
        user_vault = list(mongo.db.vaults.find({"email": email}, {"_id": 0}))
        if user_vault:
            return jsonify({"entries": user_vault})

        # Fallback to in-memory store
        entries = vault_store.get(email, [])
        return jsonify({"entries": entries})

    # POST add new entry
    @app.route("/api/vault/<email>", methods=["POST"])
    def add_vault_entry(email):
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Ensure email field matches URL
        data["email"] = email

        # Insert into MongoDB
        mongo.db.vaults.insert_one(data)

        # Return updated vault
        user_vault = list(mongo.db.vaults.find({"email": email}, {"_id": 0}))
        return jsonify({"entries": user_vault}), 201

    # DELETE entry by site
    @app.route("/api/vault/<email>/<site>", methods=["DELETE"])
    def delete_vault_entry(email, site):
        result = mongo.db.vaults.delete_one({"email": email, "site": site})
        if result.deleted_count == 0:
            return jsonify({"error": "Entry not found"}), 404

        # Return updated vault
        user_vault = list(mongo.db.vaults.find({"email": email}, {"_id": 0}))
        return jsonify({"entries": user_vault}), 200
    # ------------------------------------------------- #

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG, use_reloader=False)
