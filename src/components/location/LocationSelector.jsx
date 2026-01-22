"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";

const LocationSelector = ({
  locationName,
  setLocationName,
  setUserLocation,
  locationStatus,
  setLocationStatus,
  showLocationModal,
  setShowLocationModal,
  onLocationSelect, // 👈 Added this prop
  buttonClassName,
}) => {
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const manualRef = useRef(null);

  // Helper to handle final selection
  const confirmLocation = (loc) => {
    // 1. Update Local Storage
    localStorage.setItem("userLocation", JSON.stringify(loc));
    
    // 2. Trigger Parent Callback (This updates the Search Bar & API)
    if (onLocationSelect) {
      onLocationSelect(loc);
    } else {
      // Fallback if no callback provided
      setUserLocation(loc);
      setLocationName(loc.name);
    }

    // 3. UI Feedback
    setLocationStatus("success");
    toast.success(`Location set to ${loc.name}`);
    setShowLocationModal(false);
    
    // 4. Reset Search State
    setManualQuery("");
    setManualResults([]);
    setActiveIndex(-1);
  };

  const handleLocationRequest = () => {
    setLocationStatus("loading");

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setLocationStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { credentials: "omit" }
          );
          const data = await response.json();
          const city =
            data.address?.city || data.address?.town || "Your Location";
          const state = data.address?.state || "";
          const name = `${city}${state ? ", " + state : ""}`;

          const loc = {
            latitude,
            longitude,
            name,
            timestamp: new Date().toISOString(),
          };
          
          confirmLocation(loc); // ✅ Use helper

        } catch (err) {
          // Fallback if reverse geocoding fails
          const loc = {
            latitude,
            longitude,
            name: "Current Location",
            timestamp: new Date().toISOString(),
          };
          confirmLocation(loc);
        }
      },
      (err) => {
        console.error(err);
        toast.error("Unable to get location. Please enable GPS.");
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchManualLocations = async () => {
    const q = manualQuery.trim();
    if (!q) {
      setManualResults([]);
      setActiveIndex(-1);
      return;
    }
    try {
      setIsSearching(true);
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q,
          format: "json",
          addressdetails: "1",
          limit: "5",
        }).toString();
      const res = await fetch(url, { headers: { Accept: "application/json" }, credentials: "omit" });
      const data = await res.json();
      setManualResults(Array.isArray(data) ? data : []);
      setActiveIndex(data.length ? 0 : -1);
    } catch (err) {
      toast.error("Failed to search locations");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectManual = (place) => {
    const city =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      place.display_name?.split(",")[0] ||
      "Selected Location";
    const state = place.address?.state || "";
    const name = `${city}${state ? ", " + state : ""}`;

    const loc = {
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      name,
      timestamp: new Date().toISOString(),
    };

    confirmLocation(loc); // ✅ Use helper
  };

  const handleManualKeyDown = async (e) => {
    if (!manualResults.length && e.key === "Enter") {
        e.preventDefault();
        searchManualLocations();
        return;
    }
    if (!manualResults.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < manualResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : manualResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && manualResults[activeIndex]) {
        handleSelectManual(manualResults[activeIndex]);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (manualRef.current && !manualRef.current.contains(e.target)) {
        setManualResults([]);
      }
    };
    if (manualResults.length) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [manualResults.length]);

  return (
    <>
      {/* Modal Overlay */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Location</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Find nearby hospitals & doctors</p>
                  </div>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* GPS Button */}
                <button
                  onClick={handleLocationRequest}
                  disabled={locationStatus === "loading"}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none group-hover:scale-105 transition-transform">
                    {locationStatus === "loading" ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Navigation className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Use Current Location</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Using GPS</p>
                  </div>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or search manually</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Manual Search */}
                <div className="relative" ref={manualRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search city, area, or pincode..."
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={handleManualKeyDown}
                    className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                  />
                  
                  {/* Results Dropdown */}
                  {manualResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                      <ul className="py-1">
                        {manualResults.map((place, idx) => (
                          <li
                            key={place.place_id}
                            onClick={() => handleSelectManual(place)}
                            className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                              idx === activeIndex
                                ? "bg-blue-50 dark:bg-slate-800"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{place.display_name.split(',')[0]}</p>
                                <p className="text-xs text-slate-500 truncate">{place.display_name}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LocationSelector;