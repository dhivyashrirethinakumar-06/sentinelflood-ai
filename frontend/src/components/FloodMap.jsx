import React, { useEffect, useRef } from "react";
import L from "leaflet";

export default function FloodMap({ userCoords, riskLevel, language }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Coordinate references
  const lat = userCoords?.latitude || 13.0827;
  const lon = userCoords?.longitude || 80.2707;

  // Active Shelters list
  const shelters = [
    {
      nameEn: "Kotturpuram Community Relief Center",
      nameTa: "கோட்டூர்புரம் சமுதாய நிவாரண முகாம்",
      lat: 13.0418,
      lon: 80.2341,
      address: "12, Gandhi Mandapam Rd, Chennai",
      capacity: 350,
      occupied: 120,
      amenities: ["Medical Aid", "Purified Water", "Hot Food"]
    },
    {
      nameEn: "Velachery Emergency Shelter Hub",
      nameTa: "வேளச்சேரி அவசர கால தங்குமிடம்",
      lat: 12.9815,
      lon: 80.2185,
      address: "45, Velachery Bypass Rd, Chennai",
      capacity: 500,
      occupied: 420,
      amenities: ["Surplus Food Packages", "Rescue Boats", "Power Backup"]
    },
    {
      nameEn: "Saidapet Secondary Relief Camp",
      nameTa: "சைதாப்பேட்டை நிவாரண முகாம்",
      lat: 13.0201,
      lon: 80.2223,
      address: "7, Anna Salai, Saidapet, Chennai",
      capacity: 250,
      occupied: 85,
      amenities: ["First Aid", "Sleeping Mats", "Milk Powder"]
    }
  ];

  // Flood Prone Threat Zones (Chennai waterways)
  const dangerZones = [
    { name: "Adyar River Basin", lat: 13.0120, lon: 80.2200, radius: 1000 },
    { name: "Velachery Low Lands", lat: 12.9800, lon: 80.2200, radius: 1200 },
    { name: "Cooum Canal Sector", lat: 13.0680, lon: 80.2450, radius: 900 }
  ];

  useEffect(() => {
    // 1. Initialize Map instance
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lon], 12);

      // Load dark-themed tile layers to match premium dark UX
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(mapRef.current);
    } else if (mapRef.current) {
      // Pan map if user coordinates change
      mapRef.current.setView([lat, lon], 12);
    }

    const map = mapRef.current;

    // 2. Clear old markers/overlays
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 3. Draw User Current Location pin
    const userIcon = L.divIcon({
      html: `<div class="relative w-6 h-6 flex items-center justify-center">
               <div class="absolute w-4 h-4 rounded-full bg-brand-cyan/40 animate-ping"></div>
               <div class="absolute w-2.5 h-2.5 rounded-full bg-brand-cyan border-2 border-white"></div>
             </div>`,
      className: "custom-leaflet-icon",
      iconSize: [24, 24]
    });

    const userMarker = L.marker([lat, lon], { icon: userIcon })
      .addTo(map)
      .bindPopup(`
        <div style="color:#FFF; background:#161E2E; padding:8px; border-radius:8px; border:1px solid #06B6D4;">
          <strong style="color:#06B6D4;">${language === "en" ? "YOUR SECTOR LOCATION" : "உங்களின் இருப்பிடம்"}</strong><br/>
          <span style="font-size:11px;color:#A0AEC0;">Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}</span>
        </div>
      `);
    markersRef.current.push(userMarker);

    // 4. Plot Emergency Shelters pins
    const shelterIcon = L.divIcon({
      html: `<div class="relative w-8 h-8 flex items-center justify-center">
               <div class="absolute w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400"></div>
               <div class="absolute w-3 h-3 rounded bg-emerald-400 rotate-45 flex items-center justify-center text-[7px] text-dark-bg font-black">S</div>
             </div>`,
      className: "custom-leaflet-icon",
      iconSize: [32, 32]
    });

    shelters.forEach((shelter) => {
      const name = language === "en" ? shelter.nameEn : shelter.nameTa;
      const amenitiesList = shelter.amenities.map(a => `<li style="margin:2px 0;">✓ ${a}</li>`).join("");
      
      const sMarker = L.marker([shelter.lat, shelter.lon], { icon: shelterIcon })
        .addTo(map)
        .bindPopup(`
          <div style="color:#E2E8F0; background:#161E2E; padding:10px; border-radius:10px; width:220px; font-family:'Inter',sans-serif;">
            <strong style="color:#10B981; font-size:13px;">🏕️ ${name}</strong><br/>
            <p style="font-size:11px; margin:5px 0; color:#A0AEC0;">${shelter.address}</p>
            <div style="font-size:10px; margin-bottom:6px; font-weight:bold; color:#E2E8F0;">
              Capacity: ${shelter.occupied} / ${shelter.capacity} occupied
            </div>
            <ul style="font-size:10px; color:#34D399; padding-left:5px; margin:0; list-style:none;">
              ${amenitiesList}
            </ul>
          </div>
        `);
      markersRef.current.push(sMarker);
    });

    // 5. Draw Hazard Hotspots (danger zone circles colored by active riskLevel)
    let dangerColor = "#10B981"; // Low = Emerald
    let fillOpacity = 0.15;
    
    if (riskLevel === "Medium") {
      dangerColor = "#F59E0B"; // Amber
      fillOpacity = 0.25;
    } else if (riskLevel === "High") {
      dangerColor = "#EF4444"; // Red
      fillOpacity = 0.35;
    } else if (riskLevel === "Critical") {
      dangerColor = "#7F1D1D"; // Dark Red
      fillOpacity = 0.45;
    }

    dangerZones.forEach((zone) => {
      const zoneCircle = L.circle([zone.lat, zone.lon], {
        color: dangerColor,
        fillColor: dangerColor,
        fillOpacity: fillOpacity,
        weight: 1.5,
        radius: zone.radius
      })
        .addTo(map)
        .bindPopup(`
          <div style="color:#FFF; background:#111827; padding:8px; border-radius:6px;">
            <strong style="color:${dangerColor};">${zone.name}</strong><br/>
            <span style="font-size:11px;">Risk Level: ${riskLevel}</span>
          </div>
        `);
      markersRef.current.push(zoneCircle);
    });

    // Handle map resize trigger
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [lat, lon, riskLevel, language]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] border border-white/5 shadow-inner" />
      {/* Legend Indicator Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-card p-3 rounded-xl border border-white/10 text-xs">
        <div className="flex flex-col space-y-1.5 font-bold">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan border border-white/20"></span>
            <span>{language === "en" ? "User Coordinate Node" : "பயனர் இருப்பிடம்"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400 rotate-45 border border-white/10"></span>
            <span>{language === "en" ? "Disaster Relief Shelter" : "நிவாரண தங்குமிடம்"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-full bg-red-500/25 border border-red-500/50"></span>
            <span>{language === "en" ? "Active High-Risk Hotzone" : "வெள்ள அபாய பகுதி"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
