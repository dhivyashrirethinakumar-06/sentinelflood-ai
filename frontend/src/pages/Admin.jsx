import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { Settings, Users, Radio, CloudRain, Trash2, ShieldAlert, BarChart2 } from "lucide-react";

export default function Admin() {
  const { language, token, API_BASE, fetchLiveTelemetry } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Simulated parameters state
  const [simParams, setSimParams] = useState({
    rainfall: 240.0,
    water_level: 8.2
  });

  // Emergency dispatch form state
  const [dispatch, setDispatch] = useState({
    title_en: "Monsoon Surge Advisory",
    title_ta: "பருவமழை தீவிர எச்சரிக்கை",
    message_en: "Heavy storm winds combined with high tides expected. Secure assets and stay within high dry altitudes.",
    message_ta: "அதிவேக காற்று மற்றும் கடல் சீற்றம் காரணமாக வெள்ள அபாயம் ஏற்பட்டுள்ளது. உயரமான பாதுகாப்பான இடங்களில் தங்கி இருக்கவும்.",
    risk_level: "High",
    affected_areas: "Adyar river banks, Foreshore Estate, Marina coast"
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAdminMetrics = async () => {
    try {
      const resStats = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resStats.ok) {
        const statsData = await resStats.ok ? resStats.json() : null;
        statsData && setStats(statsData);
      }

      const resUsers = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setUsers(usersData);
      }
    } catch (e) {
      console.warn("Error loading admin data: ", e);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, [token]);

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    
    try {
      const res = await fetch(`${API_BASE}/weather/simulate?rainfall=${simParams.rainfall}&water_level=${simParams.water_level}`, {
        method: "POST"
      });
      if (res.ok) {
        setMsg("Simulation override parameters updated successfully!");
        fetchLiveTelemetry(); // sync right away
      } else {
        throw new Error("Simulation pipeline error");
      }
    } catch (error) {
      setErr(error.message);
    }
  };

  const handleResetSim = async () => {
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/weather/simulate/reset`, { method: "POST" });
      if (res.ok) {
        setMsg("Atmospheric patterns returned to natural state.");
        setSimParams({ rainfall: 0.0, water_level: 1.8 });
        fetchLiveTelemetry();
      }
    } catch (error) {
      setErr("Reset failed");
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/alerts/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dispatch)
      });

      if (res.ok) {
        setMsg("High-urgency emergency warnings successfully broadcast to all channels!");
        fetchLiveTelemetry();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Dispatch broadcast failed");
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Terminate this user profile sector?")) return;
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg("User account deleted.");
        loadAdminMetrics();
      }
    } catch (error) {
      setErr("Deletion failed");
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <Settings className="h-6 w-6 text-brand-cyan alert-glow-critical rounded-lg" />
          <span>{language === "en" ? "ADMINISTRATIVE COMMAND CORE" : "நிர்வாகக் கட்டுப்பாட்டு மையம்"}</span>
        </h1>
        <p className="text-xs text-gray-400 font-semibold mt-1 uppercase">
          {language === "en" 
            ? "Monitor users, inject climate anomalies, and broadcast high-priority warning alerts"
            : "பயனர்களைக் கண்காணிக்கவும், செயற்கை மழை அளவீடுகளை உள்ளீடு செய்யவும், அவசர அறிவிப்புகளை அனுப்பவும் கூடிய தளம்"}
        </p>
      </div>

      {/* Messages banner */}
      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-fade-in">
          ✓ {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold animate-fade-in">
          ⚠️ {err}
        </div>
      )}

      {/* System stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Registered Sectors", val: stats?.metrics?.registered_users || users.length, color: "text-brand-cyan border-cyan-500/20" },
          { label: "Alerts Dispatched", val: stats?.metrics?.alerts_dispatched || 0, color: "text-amber-400 border-amber-500/20" },
          { label: "Inferences Queried", val: stats?.metrics?.queries_analyzed || 0, color: "text-purple-400 border-purple-500/20" },
          { label: "Telemetry Records", val: stats?.metrics?.telemetry_samples || 0, color: "text-blue-400 border-blue-500/20" }
        ].map((c, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col justify-between h-20 shadow-md">
            <span className="text-[9px] uppercase font-bold text-gray-400">{c.label}</span>
            <span className={`text-2xl font-black ${c.color.split(" ")[0]}`}>{c.val}</span>
          </div>
        ))}
      </div>

      {/* Double Column Forms: Simulation Injector and Emergency Broadcast Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Form: Meteorological Simulation Overrides */}
        <form onSubmit={handleSimulateSubmit} className="glass-card p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
          <div className="border-b border-white/5 pb-2.5 flex items-center space-x-2">
            <CloudRain className="h-4.5 w-4.5 text-brand-cyan" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {language === "en" ? "Climate Anomaly Injector" : "செயற்கை வானிலை ஊடுருவி"}
            </h3>
          </div>
          
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            * Adjust parameters to artificially force rainfall spikes or high river water levels.
            The dashboard weather cards, Recharts plots, and ML Risk Gauges will immediately reflect this state change dynamically!
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Simulate Rainfall Amount (mm):</label>
              <input
                type="number"
                value={simParams.rainfall}
                onChange={(e) => setSimParams({ ...simParams, rainfall: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Simulate River Water Level (meters):</label>
              <input
                type="number"
                value={simParams.water_level}
                onChange={(e) => setSimParams({ ...simParams, water_level: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={handleResetSim}
              className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-gray-300 transition-all cursor-pointer"
            >
              Reset Environment
            </button>
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/85 text-dark-bg font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand-cyan/20 cursor-pointer active:scale-95"
            >
              Force Parameters
            </button>
          </div>
        </form>

        {/* Right Form: Broadcast Dispatcher */}
        <form onSubmit={handleDispatchSubmit} className="glass-card p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
          <div className="border-b border-white/5 pb-2.5 flex items-center space-x-2">
            <Radio className="h-4.5 w-4.5 text-brand-cyan" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {language === "en" ? "Emergency Broadcast Dispatcher" : "அவசர அறிவிப்பு வரைவி"}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Title (English):</label>
              <input
                type="text"
                value={dispatch.title_en}
                onChange={(e) => setDispatch({ ...dispatch, title_en: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">தலைப்பு (தமிழ்):</label>
              <input
                type="text"
                value={dispatch.title_ta}
                onChange={(e) => setDispatch({ ...dispatch, title_ta: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Message (English):</label>
              <textarea
                value={dispatch.message_en}
                onChange={(e) => setDispatch({ ...dispatch, message_en: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">செய்தி (தமிழ்):</label>
              <textarea
                value={dispatch.message_ta}
                onChange={(e) => setDispatch({ ...dispatch, message_ta: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Affected Zones:</label>
              <input
                type="text"
                value={dispatch.affected_areas}
                onChange={(e) => setDispatch({ ...dispatch, affected_areas: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Broadcast Severity Level:</label>
              <select
                value={dispatch.risk_level}
                onChange={(e) => setDispatch({ ...dispatch, risk_level: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40 cursor-pointer"
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical Emergency</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/25 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            {loading ? "DISTRIBUTING WARNINGS..." : "⚠️ DISPATCH BROADCAST ALERTS"}
          </button>
        </form>

      </div>

      {/* User Sector Audit Table */}
      <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
        <div className="border-b border-white/5 pb-2.5 flex items-center space-x-2">
          <Users className="h-4.5 w-4.5 text-brand-cyan" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {language === "en" ? "Registered Communication Sector Nodes" : "பதிவு செய்யப்பட்ட பயனர்கள் தணிக்கை"}
          </h3>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs font-semibold text-gray-300">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 uppercase text-[9px] font-bold">
                <th className="pb-3 pr-4">Node Operator</th>
                <th className="pb-3 pr-4">Email Channel</th>
                <th className="pb-3 pr-4">SMS Phone</th>
                <th className="pb-3 pr-4">Geo-Coordinates</th>
                <th className="pb-3 pr-4">Role Privileges</th>
                <th className="pb-3 text-right">Auditing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u._id || u.id} className="hover:bg-white/5 transition-all">
                  <td className="py-3.5 pr-4 text-white font-extrabold">{u.name}</td>
                  <td className="py-3.5 pr-4">{u.email}</td>
                  <td className="py-3.5 pr-4 text-brand-cyan">{u.phone || "---"}</td>
                  <td className="py-3.5 pr-4 text-[10px] text-gray-400">
                    {u.latitude.toFixed(4)}, {u.longitude.toFixed(4)}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.is_admin ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/5 text-gray-400 border border-white/5"}`}>
                      {u.is_admin ? "ADMIN" : "NODE"}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleDeleteUser(u._id || u.id)}
                      disabled={u.is_admin}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
