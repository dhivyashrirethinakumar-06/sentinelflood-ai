import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ShieldAlert, User, Mail, Lock, Phone, MapPin, CheckSquare } from "lucide-react";

export default function Register({ togglePage }) {
  const { API_BASE, login } = useContext(AppContext);
  
  const TN_DISTRICTS_GEO = {
    "Ariyalur": {lat: 11.1401, lon: 79.0786},
    "Chengalpattu": {lat: 12.6916, lon: 79.9758},
    "Chennai": {lat: 13.0827, lon: 80.2707},
    "Coimbatore": {lat: 11.0168, lon: 76.9558},
    "Cuddalore": {lat: 11.7480, lon: 79.7714},
    "Dharmapuri": {lat: 12.1278, lon: 78.1580},
    "Dindigul": {lat: 10.3673, lon: 77.9806},
    "Erode": {lat: 11.3410, lon: 77.7172},
    "Kallakurichi": {lat: 11.7377, lon: 78.9627},
    "Kancheepuram": {lat: 12.8342, lon: 79.7036},
    "Kanyakumari": {lat: 8.0883, lon: 77.5385},
    "Karur": {lat: 10.9601, lon: 78.0766},
    "Krishnagiri": {lat: 12.5186, lon: 78.2137},
    "Madurai": {lat: 9.9252, lon: 78.1198},
    "Mayiladuthurai": {lat: 11.1018, lon: 79.6521},
    "Nagapattinam": {lat: 10.7672, lon: 79.8449},
    "Namakkal": {lat: 11.2189, lon: 78.1672},
    "Perambalur": {lat: 11.2335, lon: 78.8819},
    "Pudukkottai": {lat: 10.3797, lon: 78.8242},
    "Ramanathapuram": {lat: 9.3639, lon: 78.8395},
    "Ranipet": {lat: 12.9272, lon: 79.3328},
    "Salem": {lat: 11.6643, lon: 78.1460},
    "Sivaganga": {lat: 9.8433, lon: 78.4809},
    "Tenkasi": {lat: 8.9595, lon: 77.3150},
    "Thanjavur": {lat: 10.7870, lon: 79.1378},
    "The Nilgiris": {lat: 11.4102, lon: 76.6950},
    "Theni": {lat: 10.0104, lon: 77.4777},
    "Thoothukudi": {lat: 8.7642, lon: 78.1348},
    "Tiruchirappalli": {lat: 10.7905, lon: 78.7047},
    "Tirunelveli": {lat: 8.7139, lon: 77.7567},
    "Tirupathur": {lat: 12.4934, lon: 78.5678},
    "Tiruppur": {lat: 11.1085, lon: 77.3411},
    "Tiruvallur": {lat: 13.1384, lon: 79.9079},
    "Tiruvannamalai": {lat: 12.2282, lon: 79.0664},
    "Tiruvarur": {lat: 10.7725, lon: 79.6361},
    "Vellore": {lat: 12.9165, lon: 79.1325},
    "Viluppuram": {lat: 11.9398, lon: 79.4862},
    "Virudhunagar": {lat: 9.5680, lon: 77.9624}
  };

  const [formData, setFormData] = useState({
    name: "Command Officer",
    email: "admin@sentinel.com",
    password: "admin123",
    phone: "+919876543210",
    latitude: 13.0827,
    longitude: 80.2707,
    address: "Chennai", // serves as active district label
    admin_secret: "admin_super_secret_token_2026"
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDistrictChange = (e) => {
    const dist = e.target.value;
    const geo = TN_DISTRICTS_GEO[dist];
    setFormData((prev) => ({
      ...prev,
      address: dist,
      latitude: geo.lat,
      longitude: geo.lon
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        login(data.access_token, data.user);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Registration failed");
      }
    } catch (error) {
      setErr(error.message || "Failed to establish registration link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-bg p-4 relative overflow-hidden font-sans">
      {/* ambient backgrounds */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-cyan/5 blur-[120px] -top-32 -left-32 animate-pulse-slow"></div>
      <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-blue/5 blur-[100px] -bottom-32 -right-32 animate-pulse-slow"></div>

      <div className="glass-card w-full max-w-lg p-8 rounded-3xl border border-white/5 shadow-2xl relative space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-brand-cyan/15 p-3 rounded-xl border border-brand-cyan/30 text-brand-cyan mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-brand-cyan to-indigo-400 bg-clip-text text-transparent">
              REGISTER NEW SECTOR CHANNEL
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
              Initialize Disaster Communication Node
            </p>
          </div>
        </div>

        {/* Errors banner */}
        {err && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 text-red-400 text-xs font-bold text-center animate-fade-in">
            ⚠️ {err}
          </div>
        )}

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4 font-bold text-xs">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-300">Node Operator Name:</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
                  placeholder="Officer name"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-gray-300">Email Address:</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
                  placeholder="name@sentinel.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-300">Security Password:</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-gray-300">Phone Number (Twilio SMS):</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
                  placeholder="+919876543210"
                />
              </div>
            </div>
          </div>

          {/* District Selector & Geo Coordinate Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-300">Select Tamil Nadu District:</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <select
                  value={formData.address}
                  onChange={handleDistrictChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40 cursor-pointer"
                >
                  {Object.keys(TN_DISTRICTS_GEO).map((d) => (
                    <option key={d} value={d} className="bg-dark-card text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-gray-300">Assigned Geolocation Nodes:</label>
              <div className="w-full px-3 py-2.5 rounded-xl bg-dark-card/50 border border-white/5 text-xs text-brand-cyan font-bold flex items-center justify-between h-9.5">
                <span>Lat: {formData.latitude.toFixed(4)}</span>
                <span>Lon: {formData.longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* Admin Secret Verification */}
          <div className="space-y-1">
            <label className="text-gray-300 flex items-center space-x-1">
              <span>Admin Authorization Token:</span>
              <span className="text-[9px] text-gray-500 font-bold uppercase">(Optional for normal sectors)</span>
            </label>
            <div className="relative">
              <CheckSquare className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                name="admin_secret"
                value={formData.admin_secret}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
                placeholder="Enter admin token for privileges"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/90 hover:to-brand-blue/90 text-dark-bg font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-xl shadow-brand-cyan/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-dark-bg border-t-transparent animate-spin"></span>
            ) : (
              <span>ESTABLISH NODE COMMUNICATION</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 text-xs font-bold text-gray-500 border-t border-white/5">
          <span>Already registered? </span>
          <button 
            onClick={togglePage} 
            className="text-brand-cyan hover:underline transition-all font-extrabold cursor-pointer"
          >
            Sign In to Terminal
          </button>
        </div>

      </div>
    </div>
  );
}
