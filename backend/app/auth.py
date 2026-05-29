import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import bcrypt
from pydantic import BaseModel, EmailStr
from app.config import settings
from app.db import db_manager

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Pydantic Schemas
class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str = ""
    latitude: float = 13.0827  # Default Chennai coordinates
    longitude: float = 80.2707
    admin_secret: str = ""

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class LocationUpdateSchema(BaseModel):
    latitude: float
    longitude: float
    address: str = ""
    phone: str = ""

# Helper security functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing subject")
        
        users_col = db_manager.get_collection("users")
        user = users_col.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        # Strip password out before returning
        user_copy = dict(user)
        if "password" in user_copy:
            del user_copy["password"]
        return user_copy
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")

# Authentication Endpoints
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegisterSchema):
    users_col = db_manager.get_collection("users")
    
    # Check if email exists
    existing = users_col.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
    # Check for admin status
    is_admin = False
    if user_data.admin_secret and user_data.admin_secret == settings.ADMIN_SECRET_KEY:
        is_admin = True
        
    hashed_pwd = hash_password(user_data.password)
    
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_pwd,
        "phone": user_data.phone,
        "latitude": user_data.latitude,
        "longitude": user_data.longitude,
        "address": "Chennai, Tamil Nadu" if not user_data.phone else "Custom Set Coordinates",
        "is_admin": is_admin,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    saved_user = users_col.insert_one(user_doc)
    
    # Sign JWT
    token_payload = {
        "user_id": saved_user["_id"],
        "email": saved_user["email"],
        "is_admin": saved_user["is_admin"]
    }
    
    token = create_access_token(token_payload)
    return {
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": saved_user["_id"],
            "name": saved_user["name"],
            "email": saved_user["email"],
            "phone": saved_user["phone"],
            "is_admin": saved_user["is_admin"],
            "latitude": saved_user["latitude"],
            "longitude": saved_user["longitude"]
        }
    }

@router.post("/login")
def login(login_data: UserLoginSchema):
    users_col = db_manager.get_collection("users")
    user = users_col.find_one({"email": login_data.email})
    
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    # Sign JWT
    token_payload = {
        "user_id": user["_id"],
        "email": user["email"],
        "is_admin": user.get("is_admin", False)
    }
    
    token = create_access_token(token_payload)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone", ""),
            "is_admin": user.get("is_admin", False),
            "latitude": user.get("latitude", 13.0827),
            "longitude": user.get("longitude", 80.2707)
        }
    }

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/profile/location")
def update_profile_location(loc_data: LocationUpdateSchema, current_user: dict = Depends(get_current_user)):
    users_col = db_manager.get_collection("users")
    
    update_fields = {
        "latitude": loc_data.latitude,
        "longitude": loc_data.longitude
    }
    
    if loc_data.address:
        update_fields["address"] = loc_data.address
    if loc_data.phone:
        update_fields["phone"] = loc_data.phone
        
    success = users_col.update_one({"_id": current_user["_id"]}, {"$set": update_fields})
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile coordinates")
        
    return {"message": "Location metrics successfully synchronized", "updated_fields": update_fields}
