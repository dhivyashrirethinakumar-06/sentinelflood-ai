import React from "react";
import { CloudRain, Waves, Droplets, Thermometer, Wind } from "lucide-react";

export default function LiveWeatherCard({ telemetry, language }) {
  if (!telemetry) return null;

  const { rainfall, water_level, temperature, humidity, wind_speed } = telemetry;

  const metrics = [
    {
      titleEn: "24h Accumulated Rainfall",
      titleTa: "24 மணிநேர மழைப்பொழிவு",
      value: `${rainfall} mm`,
      icon: CloudRain,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      glow: "shadow-blue-500/5 hover:border-blue-500/30"
    },
    {
      titleEn: "River Water Depth",
      titleTa: "ஆற்றின் தற்போதைய நீர்மட்டம்",
      value: `${water_level} m`,
      icon: Waves,
      color: "text-brand-cyan bg-cyan-500/10 border-cyan-500/20",
      glow: "shadow-cyan-500/5 hover:border-cyan-500/30"
    },
    {
      titleEn: "Atmospheric Humidity",
      titleTa: "காற்றின் ஈரப்பதம்",
      value: `${humidity} %`,
      icon: Droplets,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      glow: "shadow-emerald-500/5 hover:border-emerald-500/30"
    },
    {
      titleEn: "Temperature Index",
      titleTa: "வெப்பநிலை அளவீடு",
      value: `${temperature} °C`,
      icon: Thermometer,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      glow: "shadow-amber-500/5 hover:border-amber-500/30"
    },
    {
      titleEn: "Wind Velocity",
      titleTa: "காற்றின் வேகம்",
      value: `${wind_speed} km/h`,
      icon: Wind,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      glow: "shadow-indigo-500/5 hover:border-indigo-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 w-full">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div 
            key={idx} 
            className={`glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 transition-all duration-300 shadow-md ${m.glow} hover:translate-y-[-2px]`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                {language === "en" ? m.titleEn : m.titleTa}
              </span>
              <div className={`p-2 rounded-xl border ${m.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white tracking-tight">
                {m.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
