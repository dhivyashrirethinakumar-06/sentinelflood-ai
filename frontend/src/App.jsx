import React, { useContext, useState } from "react";
import { AppContext, AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import ChatbotWindow from "./components/ChatbotWindow";
import Dashboard from "./pages/Dashboard";
import Predictions from "./pages/Predictions";
import Alerts from "./pages/Alerts";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FloodMap from "./components/FloodMap";
import { MapPin, ShieldAlert, Waves } from "lucide-react";

function AppContent() {
  const { token, activeTab, user, language } = useContext(AppContext);
  const [authPage, setAuthPage] = useState("login"); // "login" or "register"

  const toggleAuthPage = () => {
    setAuthPage(authPage === "login" ? "register" : "login");
  };

  // 1. Unauthenticated gate
  if (!token) {
    return authPage === "login" 
      ? <Login togglePage={toggleAuthPage} /> 
      : <Register togglePage={toggleAuthPage} />;
  }

  // 2. Render authenticated view routers
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "predictions":
        return <Predictions />;
      case "alerts":
        return <Alerts />;
      case "admin":
        return user?.is_admin ? <Admin /> : <Dashboard />;
      case "map":
        // Dedicated immersive tactical widescreen map view
        return (
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] animate-fade-in">
            {/* Left sidebar details */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col justify-between shadow-xl space-y-4 h-full lg:overflow-y-auto">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-tight flex items-center space-x-2">
                    <MapPin className="h-4.5 w-4.5 text-brand-cyan animate-pulse" />
                    <span>{language === "en" ? "Tactical Disaster Map" : "பேரிடர் வரைபடத் தகவல்"}</span>
                  </h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                    {language === "en" ? "Interactive Shelter Sectors" : "நிவாரண முகாம்கள் விபரம்"}
                  </p>
                </div>

                <div className="p-3.5 bg-dark-card border border-white/5 rounded-xl space-y-2 text-xs">
                  <span className="text-[9px] font-black uppercase text-brand-cyan tracking-wider">
                    {language === "en" ? "Interactive Guidelines" : "வழிமுறைகள்"}
                  </span>
                  <ul className="space-y-2 text-gray-300 font-semibold list-disc pl-3">
                    <li>{language === "en" ? "Green pins outline safe relief hubs." : "பச்சை நிறக் குறிகள் தங்குமிடங்களைக்குறிக்கும்."}</li>
                    <li>{language === "en" ? "Click any marker to inspect shelter capacities." : "முகாமின் கொள்ளளவை அறிய அதன் மீது அழுத்தவும்."}</li>
                    <li>{language === "en" ? "Red circular ranges highlight high-risk flood zones." : "சிவப்பு வட்டங்கள் அபாயகரமான வெள்ளப் பகுதிகள் ஆகும்."}</li>
                  </ul>
                </div>
              </div>

              {/* Emergency Advisory alert banner */}
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start space-x-2 text-red-400 text-xs">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold uppercase text-[9px] block tracking-wide">{language === "en" ? "Active Danger Zones" : "அபாய பகுதிகள்"}</strong>
                  <p className="font-semibold leading-relaxed mt-0.5 text-[11px]">
                    {language === "en" 
                      ? "Do not enter Adyar river basin or Velachery lowlands if rainfall exceeds 100mm." 
                      : "மழை 100மிமீ தாண்டினால் அடையாறு மற்றும் வேளச்சேரி பகுதிகளுக்குச் செல்வதைத் தவிர்க்கவும்."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right main immersive leaflet map */}
            <div className="lg:col-span-3 rounded-2xl overflow-hidden relative shadow-2xl border border-white/5 h-full min-h-[400px]">
              <FloodMap 
                userCoords={user}
                riskLevel="High" // Simulate Tactical high visibility settings
                language={language}
              />
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 flex flex-col font-sans select-none pb-8">
      {/* Top Glass Navigation Bar */}
      <Navbar />

      {/* Main Core View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-12">
        {renderActiveTab()}
      </main>

      {/* Floating AI chatbot coordinator widget */}
      <ChatbotWindow />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
