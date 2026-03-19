import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database() # Uses the DB name from the connection string (CropWise)

async def search_schemes(query: str):
    """Search the PMScheme collection for relevant government schemes."""
    collection = db.get_collection("pmschemes")
    # Simple regex search for now. In a full app, use atlas search or vector search.
    cursor = collection.find({"$or": [
        {"schemeName": {"$regex": query, "$options": "i"}},
        {"description": {"$regex": query, "$options": "i"}}
    ]}).limit(3)
    
    schemes = await cursor.to_list(length=3)
    return schemes

async def get_user_profile(aadhaar: str):
    """Fetch farmer profile to check for missing documents."""
    collection = db.get_collection("users")
    user = await collection.find_one({"aadhaarCard": aadhaar})
    if user:
        # Convert ObjectId to string for JSON serialization
        user["_id"] = str(user["_id"])
        if "sixDigitPin" in user:
            del user["sixDigitPin"] # Security: Never send the PIN
    return user
