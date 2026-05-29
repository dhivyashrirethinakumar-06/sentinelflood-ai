import datetime
import random
import requests
from fastapi import APIRouter, Query
from app.config import settings
from app.db import db_manager

router = APIRouter(prefix="/weather", tags=["Live Weather Analytics"])

# Complete coordinates database for all 38 Districts of Tamil Nadu
TAMILNADU_DISTRICTS_GEO = {
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "type": "coastal"},
    "Coimbatore": {"lat": 11.0168, "lon": 76.9558, "type": "interior_dry"},
    "Madurai": {"lat": 9.9252, "lon": 78.1198, "type": "interior_dry"},
    "Tiruchirappalli": {"lat": 10.7905, "lon": 78.7047, "type": "river_basin"},
    "Salem": {"lat": 11.6643, "lon": 78.1460, "type": "interior_dry"},
    "Tirunelveli": {"lat": 8.7139, "lon": 77.7567, "type": "interior_dry"},
    "Vellore": {"lat": 12.9165, "lon": 79.1325, "type": "interior_dry"},
    "Cuddalore": {"lat": 11.7480, "lon": 79.7714, "type": "coastal"},
    "Thanjavur": {"lat": 10.7870, "lon": 79.1378, "type": "river_basin"},
    "The Nilgiris": {"lat": 11.4102, "lon": 76.6950, "type": "hilly"},
    "Tuticorin": {"lat": 8.7642, "lon": 78.1348, "type": "coastal"},
    "Nagapattinam": {"lat": 10.7672, "lon": 79.8449, "type": "coastal"},
    "Chengalpattu": {"lat": 12.6916, "lon": 79.9758, "type": "coastal"},
    "Tiruvallur": {"lat": 13.1384, "lon": 79.9079, "type": "coastal"},
    "Kancheepuram": {"lat": 12.8342, "lon": 79.7036, "type": "coastal"},
    "Erode": {"lat": 11.3410, "lon": 77.7172, "type": "interior_dry"},
    "Tiruppur": {"lat": 11.1085, "lon": 77.3411, "type": "interior_dry"},
    "Karur": {"lat": 10.9601, "lon": 78.0766, "type": "river_basin"},
    "Namakkal": {"lat": 11.2189, "lon": 78.1672, "type": "interior_dry"},
    "Dharmapuri": {"lat": 12.1278, "lon": 78.1580, "type": "interior_dry"},
    "Krishnagiri": {"lat": 12.5186, "lon": 78.2137, "type": "interior_dry"},
    "Pudukkottai": {"lat": 10.3797, "lon": 78.8242, "type": "coastal"},
    "Ramanathapuram": {"lat": 9.3639, "lon": 78.8395, "type": "coastal"},
    "Sivaganga": {"lat": 9.8433, "lon": 78.4809, "type": "interior_dry"},
    "Virudhunagar": {"lat": 9.5680, "lon": 77.9624, "type": "interior_dry"},
    "Dindigul": {"lat": 10.3673, "lon": 77.9806, "type": "hilly"},
    "Theni": {"lat": 10.0104, "lon": 77.4777, "type": "hilly"},
    "Tenkasi": {"lat": 8.9595, "lon": 77.3150, "type": "hilly"},
    "Tirupathur": {"lat": 12.4934, "lon": 78.5678, "type": "hilly"},
    "Ranipet": {"lat": 12.9272, "lon": 79.3328, "type": "interior_dry"},
    "Tiruvannamalai": {"lat": 12.2282, "lon": 79.0664, "type": "interior_dry"},
    "Viluppuram": {"lat": 11.9398, "lon": 79.4862, "type": "interior_dry"},
    "Kallakurichi": {"lat": 11.7377, "lon": 78.9627, "type": "interior_dry"},
    "Ariyalur": {"lat": 11.1401, "lon": 79.0786, "type": "river_basin"},
    "Perambalur": {"lat": 11.2335, "lon": 78.8819, "type": "interior_dry"},
    "Mayiladuthurai": {"lat": 11.1018, "lon": 79.6521, "type": "coastal"},
    "Tiruvarur": {"lat": 10.7725, "lon": 79.6361, "type": "coastal"},
    "Kanyakumari": {"lat": 8.0883, "lon": 77.5385, "type": "coastal"}
}

# Global simulation override values
SIMULATED_RAINFALL = None
SIMULATED_WATER_LEVEL = None

def get_simulated_weather_by_district(district: str) -> dict:
    global SIMULATED_RAINFALL, SIMULATED_WATER_LEVEL
    
    geo = TAMILNADU_DISTRICTS_GEO.get(district, TAMILNADU_DISTRICTS_GEO["Chennai"])
    profile = geo["type"]
    
    # 1. Base climate variations by profile
    if profile == "coastal":
        base_temp = 31.0 + random.uniform(-2.0, 2.0)
        base_humidity = 76.0 + random.uniform(-6.0, 6.0)
        base_pressure = 1009.0 + random.uniform(-3.0, 3.0)
        base_wind = 14.0 + random.uniform(-3.0, 10.0)
        base_rainfall = random.choice([0.0] * 3 + [random.uniform(5.0, 30.0)])
    elif profile == "river_basin":
        base_temp = 33.0 + random.uniform(-1.5, 2.0)
        base_humidity = 65.0 + random.uniform(-8.0, 8.0)
        base_pressure = 1010.0 + random.uniform(-2.0, 2.0)
        base_wind = 10.0 + random.uniform(-2.0, 6.0)
        base_rainfall = random.choice([0.0] * 5 + [random.uniform(1.0, 15.0)])
    elif profile == "hilly":
        base_temp = 17.5 + random.uniform(-3.0, 3.0)  # Ooty/Kodaikanal cool
        base_humidity = 82.0 + random.uniform(-5.0, 5.0)
        base_pressure = 1004.0 + random.uniform(-4.0, 4.0)
        base_wind = 8.0 + random.uniform(-2.0, 5.0)
        base_rainfall = random.choice([0.0] * 2 + [random.uniform(8.0, 45.0)])
    else: # interior_dry
        base_temp = 36.0 + random.uniform(-2.0, 3.0)  # Salem/Madurai heat
        base_humidity = 48.0 + random.uniform(-10.0, 8.0)
        base_pressure = 1011.0 + random.uniform(-2.0, 2.0)
        base_wind = 11.0 + random.uniform(-3.0, 4.0)
        base_rainfall = random.choice([0.0] * 8 + [random.uniform(0.1, 10.0)])

    # Apply manual simulation overrides
    rainfall = SIMULATED_RAINFALL if SIMULATED_RAINFALL is not None else base_rainfall
    
    # Water level calculations
    if SIMULATED_WATER_LEVEL is not None:
        water_level = SIMULATED_WATER_LEVEL
    else:
        # Base water depths by delta profiles
        wl_base = 3.5 if profile == "river_basin" else 1.2 if profile == "hilly" else 1.8
        water_level = wl_base + (rainfall * 0.035) + random.uniform(-0.15, 0.15)
        water_level = max(0.4, round(water_level, 2))

    # Apply cyclonic storm impacts if overrides are high
    if rainfall > 100.0:
        base_temp -= 5.0
        base_humidity = 96.0 + random.uniform(-1.0, 2.0)
        base_pressure -= 15.0
        base_wind += 40.0

    return {
        "location": {
            "latitude": geo["lat"],
            "longitude": geo["lon"],
            "city": f"{district} Sector",
            "country": "India (Tamil Nadu)"
        },
        "telemetry": {
            "rainfall": round(rainfall, 2),
            "water_level": round(water_level, 2),
            "temperature": round(base_temp, 1),
            "humidity": round(min(base_humidity, 100.0), 1),
            "pressure": round(base_pressure, 1),
            "wind_speed": round(base_wind, 1),
        },
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source": f"Tamil Nadu Climatological Simulator ({profile.upper()} Profile)"
    }

@router.get("/live")
def get_live_weather(district: str = Query("Chennai")):
    """
    Fetches real-time weather analytics.
    Attempts OpenWeatherMap fetch if configured, otherwise serves high-fidelity
    climatological simulations for any of the 38 Tamil Nadu districts.
    """
    # Clean district input
    clean_dist = district.strip()
    if clean_dist not in TAMILNADU_DISTRICTS_GEO:
        # Check case-insensitive match
        matched = [d for d in TAMILNADU_DISTRICTS_GEO if d.lower() == clean_dist.lower()]
        clean_dist = matched[0] if matched else "Chennai"

    weather_data = None
    geo = TAMILNADU_DISTRICTS_GEO[clean_dist]

    # Try live OpenWeather API if key exists
    if settings.OPENWEATHER_API_KEY:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={geo['lat']}&lon={geo['lon']}&appid={settings.OPENWEATHER_API_KEY}&units=metric"
            response = requests.get(url, timeout=3.5)
            if response.status_code == 200:
                data = response.json()
                rain_1h = data.get("rain", {}).get("1h", 0.0)
                
                wl_base = 3.5 if geo["type"] == "river_basin" else 1.5
                water_level = wl_base + (rain_1h * 0.038) + random.uniform(-0.1, 0.1)
                
                weather_data = {
                    "location": {
                        "latitude": geo["lat"],
                        "longitude": geo["lon"],
                        "city": f"{clean_dist} Live",
                        "country": "India"
                    },
                    "telemetry": {
                        "rainfall": round(rain_1h, 2),
                        "water_level": round(max(0.4, water_level), 2),
                        "temperature": round(data.get("main", {}).get("temp", 30.0), 1),
                        "humidity": round(data.get("main", {}).get("humidity", 70.0), 1),
                        "pressure": round(data.get("main", {}).get("pressure", 1010.0), 1),
                        "wind_speed": round(data.get("wind", {}).get("speed", 5.0) * 3.6, 1),
                    },
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "source": "OpenWeatherMap API Live Stream"
                }
        except Exception:
            pass
            
    if not weather_data:
        weather_data = get_simulated_weather_by_district(clean_dist)
        
    # Log weather metrics in database
    weather_logs = db_manager.get_collection("weather_logs")
    weather_logs.insert_one(weather_data)
    
    return weather_data

@router.post("/simulate")
def configure_simulation_parameters(rainfall: float = None, water_level: float = None):
    global SIMULATED_RAINFALL, SIMULATED_WATER_LEVEL
    SIMULATED_RAINFALL = rainfall
    SIMULATED_WATER_LEVEL = water_level
    return {
        "message": "Simulation overrides updated successfully",
        "current_overrides": {
            "simulated_rainfall": SIMULATED_RAINFALL,
            "simulated_water_level": SIMULATED_WATER_LEVEL
        }
    }

@router.post("/simulate/reset")
def reset_simulation_parameters():
    global SIMULATED_RAINFALL, SIMULATED_WATER_LEVEL
    SIMULATED_RAINFALL = None
    SIMULATED_WATER_LEVEL = None
    return {"message": "Simulation environment returned to standard weather patterns."}

@router.get("/historical")
def get_historical_trends(limit: int = 15):
    logs_col = db_manager.get_collection("weather_logs")
    records = list(logs_col.find({}))
    
    records = sorted(records, key=lambda x: x.get("timestamp", ""))
    records = records[-limit:]
    
    series = []
    for r in records:
        tel = r.get("telemetry", {})
        ts = r.get("timestamp", "")
        try:
            dt = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
            time_label = dt.strftime("%H:%M:%S")
        except Exception:
            time_label = ts[-13:-5]
            
        series.append({
            "time": time_label,
            "rainfall": tel.get("rainfall", 0.0),
            "water_level": tel.get("water_level", 0.0),
            "temperature": tel.get("temperature", 30.0),
            "humidity": tel.get("humidity", 70.0),
            "wind_speed": tel.get("wind_speed", 10.0)
        })
        
    # Fallback historical pre-population
    if len(series) < 5:
        now = datetime.datetime.now()
        for i in range(10):
            past_time = now - datetime.timedelta(minutes=(10 - i) * 15)
            wave_rain = float(np.sin(i / 1.5) * 45 + 50) if i > 3 else 0.0
            wave_wl = 1.8 + (wave_rain * 0.035) + random.uniform(-0.1, 0.1)
            series.append({
                "time": past_time.strftime("%H:%M:%S"),
                "rainfall": round(wave_rain, 2),
                "water_level": round(max(0.4, wave_wl), 2),
                "temperature": round(30.0 - (wave_rain * 0.03), 1),
                "humidity": round(72.0 + (wave_rain * 0.22), 1),
                "wind_speed": round(14.0 + (wave_rain * 0.25), 1)
            })
            
    return series
