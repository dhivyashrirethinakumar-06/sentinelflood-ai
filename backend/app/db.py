import os
import json
import uuid
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.config import settings

class JSONFallbackDB:
    """
    Highly robust file-based database fallback.
    Implements standard CRUD operations similar to PyMongo collections
    using simple, serialized JSON files. Auto-creates files if missing.
    """
    def __init__(self, data_dir=None):
        if data_dir is None:
            # Resolve data directory relative to this file to prevent directory resolution mismatches
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.data_dir = os.path.abspath(os.path.join(current_dir, "..", "data"))
        else:
            self.data_dir = os.path.abspath(data_dir)
        os.makedirs(self.data_dir, exist_ok=True)
        print(f"[FallbackDB] Active. Storing database files in: {self.data_dir}")
        
        # Initialize empty files if not present
        for col in ["users", "alerts", "weather_logs", "predictions", "shelters"]:
            file_path = self._get_path(col)
            if not os.path.exists(file_path):
                with open(file_path, "w") as f:
                    # Shelters can be pre-populated with realistic locations
                    if col == "shelters":
                        json.dump(self._get_default_shelters(), f, indent=4)
                    elif col == "users":
                        json.dump([
                            {
                                "_id": "default-admin-uid-2026",
                                "name": "Command Officer",
                                "email": "admin@sentinel.com",
                                "password": "$2b$12$AWhGBXHRrSoLlyCwVaQBeOtpCNZpt6yzoPS7SqwyNFEMcNwqRUhri",
                                "phone": "+919876543210",
                                "latitude": 13.0827,
                                "longitude": 80.2707,
                                "address": "Chennai Command Center",
                                "is_admin": True,
                                "created_at": "2026-05-29T12:00:00.000Z"
                            }
                        ], f, indent=4)
                    else:
                        json.dump([], f, indent=4)

    def _get_path(self, collection_name: str) -> str:
        return os.path.join(self.data_dir, f"{collection_name}.json")

    def _get_default_shelters(self):
        # Default mock shelters in Chennai/Tamil Nadu region (highly realistic)
        return [
            {
                "id": "s1",
                "name": "Community Relief Center A",
                "latitude": 13.0418,
                "longitude": 80.2341,
                "address": "12, Gandhi Mandapam Rd, Kotturpuram, Chennai",
                "capacity": 350,
                "occupied": 120,
                "amenities": ["Medical Aid", "Purified Water", "Hot Food", "Tamil + English Translators"]
            },
            {
                "id": "s2",
                "name": "Velachery Emergency Shelter Hub",
                "latitude": 12.9815,
                "longitude": 80.2185,
                "address": "45, Velachery Bypass Rd, Chennai",
                "capacity": 500,
                "occupied": 420,
                "amenities": ["Heavy Flooding Boats", "Emergency Medical ICU", "Food Packages", "Backup Generators"]
            },
            {
                "id": "s3",
                "name": "Saidapet Secondary Relief Camp",
                "latitude": 13.0201,
                "longitude": 80.2223,
                "address": "7, Anna Salai, Saidapet, Chennai",
                "capacity": 250,
                "occupied": 85,
                "amenities": ["First Aid", "Sleeping Mats", "Infant Milk Powder"]
            }
        ]

    def _read_file(self, collection_name: str) -> list:
        file_path = self._get_path(collection_name)
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_file(self, collection_name: str, data: list):
        file_path = self._get_path(collection_name)
        with open(file_path, "w") as f:
            json.dump(data, f, indent=4)

    # Collection CRUD operations
    def find_one(self, collection_name: str, query: dict) -> dict:
        records = self._read_file(collection_name)
        for r in records:
            match = True
            for k, v in query.items():
                if r.get(k) != v:
                    match = False
                    break
            if match:
                return r
        return None

    def find(self, collection_name: str, query: dict = None) -> list:
        records = self._read_file(collection_name)
        if not query:
            return records
        results = []
        for r in records:
            match = True
            for k, v in query.items():
                if r.get(k) != v:
                    match = False
                    break
            if match:
                results.append(r)
        return results

    def insert_one(self, collection_name: str, document: dict) -> dict:
        records = self._read_file(collection_name)
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        records.append(doc_copy)
        self._write_file(collection_name, records)
        return doc_copy

    def update_one(self, collection_name: str, query: dict, update_data: dict) -> bool:
        records = self._read_file(collection_name)
        for r in records:
            match = True
            for k, v in query.items():
                if r.get(k) != v:
                    match = False
                    break
            if match:
                # Update document with new fields (supports basic dict overlay)
                if "$set" in update_data:
                    for uk, uv in update_data["$set"].items():
                        r[uk] = uv
                else:
                    for uk, uv in update_data.items():
                        r[uk] = uv
                self._write_file(collection_name, records)
                return True
        return False

    def delete_one(self, collection_name: str, query: dict) -> bool:
        records = self._read_file(collection_name)
        for idx, r in enumerate(records):
            match = True
            for k, v in query.items():
                if r.get(k) != v:
                    match = False
                    break
            if match:
                records.pop(idx)
                self._write_file(collection_name, records)
                return True
        return False


# Database Connection Manager
class DatabaseManager:
    def __init__(self):
        self.use_fallback = False
        self.client = None
        self.db = None
        
        try:
            print(f"Connecting to MongoDB at: {settings.MONGO_URI}...")
            # Set short timeout (3 seconds) to fail-fast if MongoDB isn't running locally
            self.client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=3000)
            # Trigger server connection check
            self.client.server_info()
            self.db = self.client[settings.DB_NAME]
            print(f"MongoDB connection established successfully. Database: '{settings.DB_NAME}'")
        except (ConnectionFailure, Exception) as e:
            print(f"[WARNING] MongoDB connection failed: {e}")
            self.use_fallback = True
            self.fallback_db = JSONFallbackDB()

    def get_collection(self, name: str):
        """
        Exposes PyMongo database collection, or returns a custom proxy object
        routing database calls to JSONFallbackDB.
        """
        if self.use_fallback:
            class CollectionProxy:
                def __init__(self, fallback_instance, col_name):
                    self.fb = fallback_instance
                    self.name = col_name

                def find_one(self, query):
                    return self.fb.find_one(self.name, query)

                def find(self, query=None):
                    # In PyMongo find() returns a cursor, we mimic basic list iteration
                    return self.fb.find(self.name, query)

                def insert_one(self, document):
                    return self.fb.insert_one(self.name, document)

                def update_one(self, query, update_data, upsert=False):
                    return self.fb.update_one(self.name, query, update_data)

                def delete_one(self, query):
                    return self.fb.delete_one(self.name, query)
                
            return CollectionProxy(self.fallback_db, name)
        else:
            return self.db[name]

# Instantiate global database adapter
db_manager = DatabaseManager()
