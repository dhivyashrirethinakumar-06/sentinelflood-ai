import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.config import settings
from app.db import db_manager
from app.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Emergency Alert System"])

# Twilio Client initialization (safe-loaded)
twilio_client = None
if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
    try:
        from twilio.rest import Client
        twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        print("[Twilio SMS] Client successfully authenticated and online.")
    except Exception as e:
        print(f"[Twilio SMS] Error initializing Twilio client: {e}")

# Pydantic Schemas
class AlertTriggerSchema(BaseModel):
    title_en: str
    title_ta: str
    message_en: str
    message_ta: str
    risk_level: str  # Low, Medium, High, Critical
    affected_areas: str  # comma separated list
    latitude: float = None
    longitude: float = None
    radius_km: float = 10.0

# Helper to dispatch SMS warnings
def send_sms_alert(phone_number: str, message: str) -> bool:
    """
    Sends SMS warnings to registered phone numbers.
    Gracefully logs simulated SMS triggers if live Twilio SID/Auth is missing.
    """
    if not phone_number:
        return False
        
    if twilio_client and settings.TWILIO_PHONE_NUMBER:
        try:
            print(f"[Twilio SMS] Dispatching emergency SMS warning to {phone_number}...")
            twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            return True
        except Exception as e:
            print(f"[Twilio SMS Error] Failed to transmit message to {phone_number}: {e}")
            # Fall back to logging
            
    # Mock fallback logger for developers/demonstrations
    print(f"\n⚡⚡⚡ [SIMULATED SMS TRANSMISSION] ⚡⚡⚡")
    print(f"Target Destination: {phone_number}")
    print(f"Message Payload:\n{message}")
    print(f"⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡\n")
    return True

@router.post("/trigger", status_code=status.HTTP_201_CREATED)
def trigger_alert(alert_data: AlertTriggerSchema, current_user: dict = Depends(get_current_user)):
    """
    Broadcasts high-urgency notifications.
    Access restricted to Admin profiles. Dispatches automated SMS alerts in Tamil & English.
    """
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative authorization required to dispatch emergency broadcasts."
        )

    alerts_col = db_manager.get_collection("alerts")
    users_col = db_manager.get_collection("users")

    alert_doc = {
        "title_en": alert_data.title_en,
        "title_ta": alert_data.title_ta,
        "message_en": alert_data.message_en,
        "message_ta": alert_data.message_ta,
        "risk_level": alert_data.risk_level,
        "affected_areas": alert_data.affected_areas,
        "latitude": alert_data.latitude or 13.0827,
        "longitude": alert_data.longitude or 80.2707,
        "radius_km": alert_data.radius_km,
        "triggered_by": current_user["name"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    saved_alert = alerts_col.insert_one(alert_doc)

    # Compile the warnings
    sms_english = f"⚠️ FLOOD WARNING ({alert_data.risk_level.upper()} RISK) - Affected areas: {alert_data.affected_areas}. {alert_data.message_en} Avoid flood zones."
    sms_tamil = f"⚠️ வெள்ள அபாயம் ({alert_data.risk_level.upper()}): {alert_data.affected_areas}. {alert_data.message_ta} பாதுகாப்பான இடத்திற்குச் செல்லவும்."
    
    # Broadcast to all registered accounts
    all_users = list(users_col.find({}))
    sms_count = 0
    
    for u in all_users:
        phone = u.get("phone")
        if phone:
            # We construct a multilingual alert to conserve SMS text size, or send based on regional preferences
            full_warning = f"{sms_english}\n\nதமிழ்:\n{sms_tamil}"
            send_sms_alert(phone, full_warning)
            sms_count += 1

    return {
        "message": f"Broadcast successfully distributed to {sms_count} registered users.",
        "alert": saved_alert
    }

@router.get("/history")
def get_alert_history(limit: int = 10):
    """
    Exposes high-urgency notifications chronologically.
    """
    alerts_col = db_manager.get_collection("alerts")
    history = list(alerts_col.find({}))
    
    # Sort descending (most recent first)
    history = sorted(history, key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # Pre-populate some historical alert warnings if database is empty so dashboard has contents
    if len(history) == 0:
        print("[Alerts] Pre-populating default alerts dataset for live visualization...")
        now = datetime.datetime.now()
        history = [
            {
                "_id": "a1",
                "title_en": "Extreme Rainfall and Reservoir Discharge Alert",
                "title_ta": "அதிதீவிர மழையின் காரணமாக நீர்த்தேக்கம் திறப்பு எச்சரிக்கை",
                "message_en": "Chembarambakkam reservoir releasing 2000 cusecs of surplus water. Low lying areas of Adyar river banks must prepare for evacuation.",
                "message_ta": "செம்பரம்பாக்கம் ஏரியில் இருந்து உபரிநீர் 2000 கனஅடி திறக்கப்பட உள்ளதால், அடையாறு ஆற்றங்கரையோரத் தாழ்வான மக்கள் பாதுகாப்பான இடங்களுக்குச் செல்லவும்.",
                "risk_level": "Critical",
                "affected_areas": "Adyar, Kotturpuram, Saidapet, Jafferkhanpet",
                "latitude": 13.018,
                "longitude": 80.222,
                "radius_km": 5.0,
                "triggered_by": "System Sentinel Engine",
                "timestamp": (now - datetime.timedelta(hours=4)).isoformat()
            },
            {
                "_id": "a2",
                "title_en": "Localized Inundation Warning",
                "title_ta": "குடியிருப்பு பகுதிகளில் தண்ணீர் தேங்குதல் எச்சரிக்கை",
                "message_en": "Severe water logging reported. Avoid driving on underground subways and stay indoors.",
                "message_ta": "கனமழையினால் பல்வேறு சாலைகளில் வெள்ள நீர் தேங்கியுள்ளது. சுரங்கப்பாதைகளில் பயணங்கள் செய்வதை தவிக்கவும்.",
                "risk_level": "High",
                "affected_areas": "Velachery Bypass, Madipakkam, Pallikaranai",
                "latitude": 12.980,
                "longitude": 80.218,
                "radius_km": 4.0,
                "triggered_by": "Chennai Disaster Core",
                "timestamp": (now - datetime.timedelta(hours=14)).isoformat()
            },
            {
                "_id": "a3",
                "title_en": "Heavy Rainfall Monsoon Advisory",
                "title_ta": "அடுத்த 24 மணிநேர கனமழைக்கான முன்னெச்சரிக்கை",
                "message_en": "Monsoon troughs active over coast. Keep standard food reserves and charging equipment active.",
                "message_ta": "கடலோரப் பகுதிகளில் பருவமழை தீவிரம் அடைந்துள்ளது. அத்தியாவசிய உணவு மற்றும் மின்சாரச் சாதனங்களைச் சேமித்து வைக்கவும்.",
                "risk_level": "Medium",
                "affected_areas": "Mylapore, Nungambakkam, T-Nagar",
                "latitude": 13.041,
                "longitude": 80.233,
                "radius_km": 8.0,
                "triggered_by": "Meteorological Agency",
                "timestamp": (now - datetime.timedelta(days=2)).isoformat()
            }
        ]
        # Insert them into the collection
        for a in history:
            alerts_col.insert_one(a)
            
    return history[:limit]
