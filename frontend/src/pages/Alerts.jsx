import React, { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { Bell, MapPin, ShieldAlert, Calendar } from "lucide-react";

export default function Alerts() {
  const { language, alerts, fetchLiveTelemetry } = useContext(AppContext);

  // Poll alerts on page load
  useEffect(() => {
    fetchLiveTelemetry();
  }, []);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <Bell className="h-6 w-6 text-brand-cyan alert-glow-critical rounded-lg" />
          <span>{language === "en" ? "DISASTER EMERGENCY BROADCASTS" : "அவசரக்கால எச்சரிக்கை முனையம்"}</span>
        </h1>
        <p className="text-xs text-gray-400 font-semibold mt-1 uppercase">
          {language === "en" 
            ? "Recent alerts and high-priority warnings dispatched by local administrative authorities"
            : "நிர்வாகத் துறையால் சென்னை முழுவதும் வெளியிடப்பட்ட அத்தியாவசிய முன்னெச்சரிக்கை அறிவிப்புகள்"}
        </p>
      </div>

      {/* Warnings Feed List */}
      <div className="space-y-6 max-w-4xl">
        {alerts.length > 0 ? (
          alerts.map((a) => {
            // Check risk color
            let cardBorder = "border-white/5 hover:border-emerald-500/30";
            let leftAccent = "bg-emerald-500 shadow-emerald-500/20";
            let badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            let blinkClass = "";

            if (a.risk_level === "Medium") {
              cardBorder = "border-white/5 hover:border-amber-500/30";
              leftAccent = "bg-amber-500 shadow-amber-500/20";
              badgeBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            } else if (a.risk_level === "High") {
              cardBorder = "border-white/5 hover:border-orange-500/30";
              leftAccent = "bg-orange-500 shadow-orange-500/20";
              badgeBg = "bg-orange-500/10 text-orange-400 border-orange-500/20";
            } else if (a.risk_level === "Critical") {
              cardBorder = "alert-glow-critical border-red-500/40";
              leftAccent = "bg-red-500 shadow-red-500/30 animate-pulse";
              badgeBg = "bg-red-500/15 text-red-400 border-red-500/30";
              blinkClass = "animate-blink";
            }

            // Standard date formatter
            let dateLabel = "";
            try {
              const dt = new Date(a.timestamp);
              dateLabel = dt.toLocaleDateString(language === "en" ? "en-US" : "ta-IN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
                year: "numeric"
              });
            } catch (e) {
              dateLabel = a.timestamp;
            }

            return (
              <div 
                key={a._id || a.id} 
                className={`glass-card p-5 rounded-2xl border flex items-start space-x-4 shadow-xl transition-all duration-300 ${cardBorder}`}
              >
                {/* Visual Left colored indicator bar */}
                <div className={`w-1 h-24 rounded-full shrink-0 ${leftAccent}`} />
                
                {/* Warning details */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${badgeBg} ${blinkClass}`}>
                      {language === "en" ? `${a.risk_level} RISK LEVEL` : `${a.risk_level} அபாய நிலை`}
                    </span>
                    <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 font-bold">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{dateLabel}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight leading-snug">
                      {language === "en" ? a.title_en : a.title_ta}
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-semibold mt-1">
                      {language === "en" ? a.message_en : a.message_ta}
                    </p>
                  </div>

                  {/* Impact locations */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-400">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-cyan" />
                      <span>
                        {language === "en" ? "AFFECTED REGIONS: " : "பாதிக்கப்படும் பகுதிகள்: "}
                        <span className="text-gray-200 uppercase">{a.affected_areas}</span>
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-500">
                      Dispatched by: <span className="font-extrabold text-brand-cyan uppercase">{a.triggered_by || "Administrator"}</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center text-gray-500 shadow-xl h-64">
            <ShieldAlert className="h-10 w-10 text-dark-border mb-3" />
            <strong className="text-xs uppercase font-extrabold tracking-wider">{language === "en" ? "No Active Warnings" : "செயலில் எச்சரிக்கைகள் எதுவும் இல்லை"}</strong>
            <p className="text-xs leading-relaxed max-w-[240px] mt-1 font-semibold">
              {language === "en" ? "Conditions are normal. When a warning is generated, it will appear here." : "நிலைமைகள் சாதாரணமாக உள்ளன. எச்சரிக்கை வெளியிடப்பட்டால் இங்கே தோன்றும்."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
