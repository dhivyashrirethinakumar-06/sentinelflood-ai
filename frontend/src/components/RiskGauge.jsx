import React from "react";

export default function RiskGauge({ probability, riskLevel, severityScore, advice, language }) {
  // Convert probability to percentage: e.g. 0.85 -> 85%
  const percentage = Math.round(probability * 100);
  
  // Calculate SVG circular parameters
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine risk category color classes
  let strokeColor = "stroke-emerald-500";
  let textColor = "text-emerald-400";
  let bgGlow = "shadow-emerald-500/10";
  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  
  if (riskLevel === "Medium") {
    strokeColor = "stroke-amber-500";
    textColor = "text-amber-400";
    bgGlow = "shadow-amber-500/10";
    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  } else if (riskLevel === "High") {
    strokeColor = "stroke-orange-500";
    textColor = "text-orange-400";
    bgGlow = "shadow-orange-500/10";
    badgeColor = "bg-orange-500/10 text-orange-400 border-orange-500/30";
  } else if (riskLevel === "Critical") {
    strokeColor = "stroke-red-500";
    textColor = "text-red-500";
    bgGlow = "shadow-red-500/20";
    badgeColor = "bg-red-500/10 text-red-400 border-red-500/30";
  }

  // Multilingual risk level labels
  const riskLabels = {
    Low: { en: "LOW RISK", ta: "சாதாரண நிலை" },
    Medium: { en: "MODERATE RISK", ta: "மிதமான அபாயம்" },
    High: { en: "HIGH FLOOD RISK", ta: "அதிக வெள்ள அபாயம்" },
    Critical: { en: "CRITICAL DANGER", ta: "மிகக் கடுமையான வெள்ள அபாயம்" }
  };

  const selectedLabel = riskLabels[riskLevel]?.[language] || riskLevel;

  return (
    <div className={`glass-card p-6 rounded-2xl flex flex-col items-center justify-between border border-white/5 transition-all duration-300 shadow-xl ${bgGlow}`}>
      {/* Header */}
      <div className="w-full text-center border-b border-white/5 pb-4 mb-4">
        <h2 className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
          {language === "en" ? "Real-time AI Prediction Core" : "செயற்கை நுண்ணறிவு கணிப்பு"}
        </h2>
      </div>

      {/* SVG Radial Gauge */}
      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background track circle */}
          <circle
            className="stroke-dark-border"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx="100"
            cy="100"
          />
          {/* Active progressive stroke */}
          <circle
            className={`${strokeColor} transition-all duration-1000 ease-out`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx="100"
            cy="100"
            style={{ filter: "drop-shadow(0px 0px 6px currentColor)" }}
          />
        </svg>
        {/* Inner Text Centered */}
        <div className="absolute text-center flex flex-col justify-center items-center">
          <span className="text-4xl font-black text-white tracking-tight leading-none">
            {percentage}%
          </span>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1.5">
            {language === "en" ? "Probability" : "அபாய வாய்ப்பு"}
          </span>
        </div>
      </div>

      {/* Risk Assessment Label */}
      <div className="text-center mt-3 w-full">
        <div className={`inline-block px-4 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase mb-3 ${badgeColor}`}>
          {selectedLabel}
        </div>
        
        {/* Disaster Severity Score */}
        <div className="text-xs text-gray-400 font-bold mb-4">
          {language === "en" ? "Calculated Severity Index: " : "கணிக்கப்பட்ட தீவிரம்: "}
          <span className={`text-sm font-black ${textColor}`}>
            {severityScore} / 100
          </span>
        </div>

        {/* Safety Guidance Advice block */}
        <div className="bg-dark-card border border-white/5 rounded-xl p-3 text-left">
          <p className="text-[9px] uppercase font-extrabold text-brand-cyan tracking-wider mb-1">
            {language === "en" ? "Immediate Safety Advisory" : "உடனடி பாதுகாப்பு வழிகாட்டுதல்"}
          </p>
          <p className="text-xs text-gray-300 font-medium leading-relaxed">
            {advice}
          </p>
        </div>
      </div>
    </div>
  );
}
