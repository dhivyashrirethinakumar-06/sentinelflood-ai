import os
import numpy as np
import pandas as pd

# The 38 official districts of Tamil Nadu classified by physical climatology profiles
DISTRICT_PROFILES = {
    # 1. Coastal Districts (Cyclonic & Monsoon surge high-exposure zones)
    "Chennai": "coastal", "Cuddalore": "coastal", "Nagapattinam": "coastal", 
    "Thoothukudi": "coastal", "Kanyakumari": "coastal", "Ramanathapuram": "coastal",
    "Pudukkottai": "coastal", "Tiruvarur": "coastal", "Tiruvallur": "coastal", 
    "Chengalpattu": "coastal", "Mayiladuthurai": "coastal",
    
    # 2. Kaveri River Basin Districts (High reservoir surplus discharge zones)
    "Tiruchirappalli": "river_basin", "Thanjavur": "river_basin", "Karur": "river_basin",
    "Ariyalur": "river_basin",
    
    # 3. Hilly Mountainous Districts (Cool, heavy monsoons, rapid runoff flash floods)
    "The Nilgiris": "hilly", "Dindigul": "hilly", "Theni": "hilly", 
    "Tirupathur": "hilly", "Tenkasi": "hilly",
    
    # 4. Interior Dry/Semi-Arid Districts (High temperature averages, convective sudden cloudbursts)
    "Coimbatore": "interior_dry", "Madurai": "interior_dry", "Salem": "interior_dry",
    "Erode": "interior_dry", "Tiruppur": "interior_dry", "Namakkal": "interior_dry",
    "Dharmapuri": "interior_dry", "Krishnagiri": "interior_dry", "Vellore": "interior_dry",
    "Ranipet": "interior_dry", "Tiruvannamalai": "interior_dry", "Viluppuram": "interior_dry",
    "Kallakurichi": "interior_dry", "Perambalur": "interior_dry", "Sivaganga": "interior_dry",
    "Virudhunagar": "interior_dry", "Tirunelveli": "interior_dry"
}

def generate_district_flood_dataset(num_samples=100000, output_path="flood_dataset.csv"):
    print(f"Generating large-scale Tamil Nadu multi-district flood dataset ({num_samples} samples)...")
    np.random.seed(101)

    districts = list(DISTRICT_PROFILES.keys())
    
    # Randomly assign a district to each sample
    sample_districts = np.random.choice(districts, size=num_samples)
    
    # Pre-allocate arrays for speed
    rainfalls = np.zeros(num_samples)
    water_levels = np.zeros(num_samples)
    humidities = np.zeros(num_samples)
    temperatures = np.zeros(num_samples)
    wind_speeds = np.zeros(num_samples)
    flood_occurrences = np.zeros(num_samples, dtype=int)

    for i in range(num_samples):
        dist = sample_districts[i]
        profile = DISTRICT_PROFILES[dist]
        
        # 1. Weather parameter simulation based on District profile seeds
        if profile == "coastal":
            # High rain potential (cyclones), humid, high wind gusts
            rain = np.random.gamma(shape=0.6, scale=60.0) # mean=36mm, max up to 350mm
            wind = np.random.exponential(scale=18.0) + 12.0 + (rain * 0.18)
            temp = np.random.normal(loc=31.0, scale=3.0) - (rain * 0.03)
            humid = np.random.uniform(65, 92) + (rain * 0.12)
            base_water = np.random.normal(loc=1.5, scale=0.5)
            water = base_water + (rain * 0.024) + np.random.normal(loc=0, scale=0.4)
            
        elif profile == "river_basin":
            # Moderate rain, very high river water level bases (influenced by Cauvery river upstream delta flow)
            rain = np.random.gamma(shape=0.5, scale=40.0) # mean=20mm
            wind = np.random.exponential(scale=10.0) + 6.0 + (rain * 0.08)
            temp = np.random.normal(loc=33.0, scale=3.5) - (rain * 0.03)
            humid = np.random.uniform(55, 85) + (rain * 0.14)
            base_water = np.random.normal(loc=3.2, scale=1.0) # high base depth (e.g. Kaveri water level)
            water = base_water + (rain * 0.032) + np.random.normal(loc=0, scale=0.5)
            
        elif profile == "hilly":
            # High rain volume, rapid flash floods but cooler temperatures, lower winds
            rain = np.random.gamma(shape=0.8, scale=55.0) # mean=44mm
            wind = np.random.exponential(scale=8.0) + 4.0 + (rain * 0.04)
            temp = np.random.normal(loc=18.0, scale=4.0) - (rain * 0.04) # cool climate (Nilgiris/Ooty)
            humid = np.random.uniform(60, 95) + (rain * 0.10)
            base_water = np.random.normal(loc=1.2, scale=0.4)
            water = base_water + (rain * 0.042) + np.random.normal(loc=0, scale=0.3) # rapid rising river
            
        else: # interior_dry
            # Rare dry rain (mostly 0mm), hot climate, low humidity
            rain = np.random.choice([0.0] * 12 + [np.random.gamma(shape=0.3, scale=35.0)]) # highly dry
            wind = np.random.exponential(scale=9.0) + 5.0 + (rain * 0.1)
            temp = np.random.normal(loc=35.0, scale=3.0) - (rain * 0.02) # Salem/Madurai heat
            humid = np.random.uniform(40, 75) + (rain * 0.15)
            base_water = np.random.normal(loc=1.0, scale=0.3)
            water = base_water + (rain * 0.018) + np.random.normal(loc=0, scale=0.2)

        # Clip values to physically realistic limits
        rain = np.clip(rain, 0.0, 380.0)
        water = np.clip(water, 0.3, 16.0)
        humid = np.clip(humid, 25.0, 100.0)
        temp = np.clip(temp, 8.0, 45.0)
        wind = np.clip(wind, 1.0, 130.0)

        # 2. Probability of flooding (highly non-linear and district specific)
        prob = (rain / 380.0) * 0.35 + (water / 16.0) * 0.35 + ((humid - 40) / 60.0) * 0.10
        
        # Profile modifiers representing physical triggers (coastal surges, river releases, hilly landslides)
        if profile == "coastal":
            prob += np.where((rain > 160.0) | (wind > 85.0), 0.30, 0.0)
        elif profile == "river_basin":
            prob += np.where((water > 8.0), 0.38, 0.0)
        elif profile == "hilly":
            prob += np.where((rain > 140.0), 0.40, 0.0) # severe landslide runoff
        else: # interior dry
            prob += np.where((rain > 200.0) & (water > 5.0), 0.25, 0.0)

        prob = np.clip(prob, 0.0, 1.0)
        
        # Deterministic outcome with stochastic sampling
        flood_occurrences[i] = np.random.binomial(n=1, p=prob)
        
        rainfalls[i] = rain
        water_levels[i] = water
        humidities[i] = humid
        temperatures[i] = temp
        wind_speeds[i] = wind

    # Construct dataframe
    df = pd.DataFrame({
        "District": sample_districts,
        "Rainfall": np.round(rainfalls, 2),
        "Water_Level": np.round(water_levels, 2),
        "Humidity": np.round(humidities, 1),
        "Temperature": np.round(temperatures, 1),
        "Wind_Speed": np.round(wind_speeds, 1),
        "Flood_Occurrence": flood_occurrences
    })

    # Save to CSV
    df.to_csv(output_path, index=False)
    print(f"Large-scale dataset successfully saved to {output_path}!")
    print(df.head(10))
    print("\nClass distribution:")
    print(df["Flood_Occurrence"].value_counts(normalize=True))
    print("\nDistrict representation count (first 5):")
    print(df["District"].value_counts().head(5))

if __name__ == "__main__":
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    generate_district_flood_dataset(output_path=os.path.join(os.path.dirname(__file__), "flood_dataset.csv"))
