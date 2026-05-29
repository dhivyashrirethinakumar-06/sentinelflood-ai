import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ShieldAlert, Mail, Lock, LogIn } from "lucide-react";

export default function Login({ togglePage }) {
  const { API_BASE, login } = useContext(AppContext);
  const [email, setEmail] = useState("admin@sentinel.com"); // Pre-populate default admin credentials
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        login(data.access_token, data.user);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Authentication failed");
      }
    } catch (error) {
      setErr(error.message || "Failed to reach server core.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-bg p-4 relative overflow-hidden font-sans">
      {/* Absolute decorative ambient gradients */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-cyan/5 blur-[120px] -top-32 -left-32 animate-pulse-slow"></div>
      <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-blue/5 blur-[100px] -bottom-32 -right-32 animate-pulse-slow"></div>

      <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/5 shadow-2xl relative space-y-6">
        
        {/* Brand Logo and Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex bg-brand-cyan/15 p-3.5 rounded-2xl border border-brand-cyan/30 text-brand-cyan alert-glow-critical mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-brand-cyan to-indigo-400 bg-clip-text text-transparent">
              SENTINEL DISASTER CORE
            </h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1.5">
              Secure Sector Communication Portal
            </p>
          </div>
        </div>

        {/* Error notification banner */}
        {err && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 text-red-400 text-xs font-bold text-center animate-fade-in">
            ⚠️ {err}
          </div>
        )}

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4 font-bold text-xs">
          <div className="space-y-1.5">
            <label className="text-gray-300">Operational Email Channel:</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
                placeholder="operator@sentinel.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-300">Security Access Key:</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/90 hover:to-brand-blue/90 text-dark-bg font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-xl shadow-brand-cyan/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-dark-bg border-t-transparent animate-spin"></span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>ESTABLISH SECURE TERMINAL</span>
              </>
            )}
          </button>
        </form>

        {/* Footer helper links */}
        <div className="text-center pt-2 text-xs font-bold text-gray-500 border-t border-white/5">
          <span>New node operator? </span>
          <button 
            onClick={togglePage} 
            className="text-brand-cyan hover:underline transition-all font-extrabold cursor-pointer"
          >
            Register Sector Channel
          </button>
        </div>

      </div>
    </div>
  );
}
