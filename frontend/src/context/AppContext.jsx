import React, { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "en"); // "en" or "ta"
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "predictions", "map", "alerts", "admin"
  const [selectedDistrict, setSelectedDistrict] = useState("Chennai");
  
  // Shared weather and alerts telemetries
  const [liveWeather, setLiveWeather] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const API_BASE = "https://sentinelflood-backend.onrender.com/api/v1";

  // Persistent storage sync
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      if (user.address && user.address !== "Chennai, Tamil Nadu" && user.address !== "Custom Set Coordinates") {
        setSelectedDistrict(user.address);
      }
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  // Global actions
  const login = (jwtToken, userProfile) => {
    setToken(jwtToken);
    setUser(userProfile);
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setSelectedDistrict("Chennai");
    setActiveTab("dashboard");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Helper fetcher
  const fetchLiveTelemetry = async () => {
    try {
      const res = await fetch(`${API_BASE}/weather/live?district=${selectedDistrict}`);
      if (res.ok) {
        const data = await res.json();
        setLiveWeather(data);
      }
      
      const resHist = await fetch(`${API_BASE}/weather/historical`);
      if (resHist.ok) {
        const histData = await resHist.json();
        setHistoricalData(histData);
      }

      const resAlerts = await fetch(`${API_BASE}/alerts/history`);
      if (resAlerts.ok) {
        const alertsData = await resAlerts.json();
        setAlerts(alertsData);
      }
    } catch (e) {
      console.warn("Unable to fetch live API telemetry. Mock fallback active.", e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        language,
        activeTab,
        selectedDistrict,
        setSelectedDistrict,
        liveWeather,
        historicalData,
        alerts,
        API_BASE,
        setToken,
        setUser,
        setLanguage,
        setActiveTab,
        setLiveWeather,
        setHistoricalData,
        setAlerts,
        login,
        logout,
        fetchLiveTelemetry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
