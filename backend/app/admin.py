from fastapi import APIRouter, HTTPException, Depends, status
from app.db import db_manager
from app.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Administrative Panel"])

def check_admin_privileges(current_user: dict = Depends(get_current_user)):
    """
    Enforces administrator authorization rules.
    """
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )
    return current_user

@router.get("/users")
def get_all_users(current_user: dict = Depends(check_admin_privileges)):
    """
    Retrieves all registered user profiles for administrative auditing.
    """
    users_col = db_manager.get_collection("users")
    users = list(users_col.find({}))
    
    # Strip out password hashes for security
    cleaned_users = []
    for u in users:
        u_copy = dict(u)
        if "password" in u_copy:
            del u_copy["password"]
        cleaned_users.append(u_copy)
        
    return cleaned_users

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user: dict = Depends(check_admin_privileges)):
    """
    Deletes a user account by its ID.
    """
    users_col = db_manager.get_collection("users")
    success = users_col.delete_one({"_id": user_id})
    if not success:
        raise HTTPException(status_code=404, detail="User account not found.")
    return {"message": "User account successfully terminated."}

@router.get("/stats")
def get_system_statistics(current_user: dict = Depends(check_admin_privileges)):
    """
    Computes aggregates across users, alerts, and logged real-time predictions.
    """
    users_col = db_manager.get_collection("users")
    alerts_col = db_manager.get_collection("alerts")
    predicts_col = db_manager.get_collection("predictions")
    weather_col = db_manager.get_collection("weather_logs")
    
    users_count = len(list(users_col.find({})))
    alerts_count = len(list(alerts_col.find({})))
    predictions_count = len(list(predicts_col.find({})))
    weather_logs_count = len(list(weather_col.find({})))
    
    # Calculate high-risk alerts count
    critical_alerts = len(list(alerts_col.find({"risk_level": "Critical"})))
    
    # Get last 5 predictions
    recent_preds = list(predicts_col.find({}))
    recent_preds = sorted(recent_preds, key=lambda x: x.get("timestamp", ""), reverse=True)[:5]
    
    return {
        "metrics": {
            "registered_users": users_count,
            "alerts_dispatched": alerts_count,
            "critical_disasters": critical_alerts,
            "queries_analyzed": predictions_count,
            "telemetry_samples": weather_logs_count
        },
        "recent_predictions": recent_preds
    }

@router.delete("/predictions/clear")
def clear_prediction_history(current_user: dict = Depends(check_admin_privileges)):
    """
    Clears historical prediction request history.
    """
    predicts_col = db_manager.get_collection("predictions")
    # For local JSON database, we can delete the file and recreate it empty
    if hasattr(db_manager, "use_fallback") and db_manager.use_fallback:
        db_manager.fallback_db._write_file("predictions", [])
    else:
        # MongoDB clear
        predicts_col.delete_many({})
    return {"message": "Prediction telemetry logs cleared successfully."}
