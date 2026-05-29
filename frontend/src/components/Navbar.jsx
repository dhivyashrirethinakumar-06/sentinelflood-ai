import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Map, 
  BrainCircuit, 
  Bell, 
  Settings, 
  LogOut, 
  Globe 
} from "lucide-react";

export default function Navbar() {
  const { 
    user, 
    language, 
    setLanguage, 
    activeTab, 
    setActiveTab, 
    logout 
  } = useContext(AppContext);

  const navItems = [
    { id: "dashboard", labelEn: "Dashboard", labelTa: "கட்டுப்பாட்டு அறை", icon: LayoutDashboard },
    { id: "predictions", labelEn: "ML Predictor", labelTa: "கணிப்பு மையம்", icon: BrainCircuit },
    { id: "map", labelEn: "Disaster Map", labelTa: "பேரிடர் வரைபடம்", icon: Map },
    { id: "alerts", labelEn: "Active Alerts", labelTa: "அவசர எச்சரிக்கைகள்", icon: Bell },
  ];

  // If user is admin, append Admin panel option
  if (user?.is_admin) {
    navItems.push({
      id: "admin",
      labelEn: "Admin Core",
      labelTa: "நிர்வாகக் குழு",
      icon: Settings
    });
  }

  return (
    <nav className="glass-card sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between border-b border-white/5">
      {/* Brand Logo and Title */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
        <div className="bg-brand-cyan/20 p-2 rounded-xl border border-brand-cyan/40 alert-glow-critical">
          <ShieldAlert className="h-6 w-6 text-brand-cyan" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-cyan via-brand-blue to-indigo-400 bg-clip-text text-transparent uppercase">
            SENTINEL FLOOD
          </h1>
          <p className="text-[10px] text-gray-400 tracking-wider font-semibold uppercase">
            {language === "en" ? "AI Prediction & Alert Core" : "செயற்கை நுண்ணறிவு பேரிடர் மையம்"}
          </p>
        </div>
      </div>

      {/* Center Nav Items */}
      <div className="hidden md:flex items-center space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isActive 
                  ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-md shadow-brand-cyan/5" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{language === "en" ? item.labelEn : item.labelTa}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Multilingual Toggle */}
        <button
          onClick={() => setLanguage(language === "en" ? "ta" : "en")}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-card hover:bg-white/5 border border-white/5 transition-all text-xs font-bold text-brand-cyan cursor-pointer"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{language === "en" ? "TAMIL" : "ENGLISH"}</span>
        </button>

        {/* User profile & logout wrapper */}
        {user && (
          <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-200">{user.name}</p>
              <p className="text-[9px] font-semibold text-brand-cyan uppercase">
                {user.is_admin ? (language === "en" ? "System Admin" : "முதன்மை அதிகாரி") : (language === "en" ? "Sector Node" : "பொதுப் பயனர்")}
              </p>
            </div>
            <button
              onClick={logout}
              title={language === "en" ? "Sign Out" : "வெளியேறு"}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
