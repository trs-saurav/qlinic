"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Search } from "lucide-react";
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
  buttonClassName,
}) => {
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState([]); // array of Nominatim results
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const manualRef = useRef(null);

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
          setUserLocation(loc);
          setLocationName(name);
          setLocationStatus("success");
          localStorage.setItem("userLocation", JSON.stringify(loc));
          setShowLocationModal(false);
          toast.success(`Location set to ${name}`);
        } catch (err) {
          setLocationStatus("success");
          setUserLocation({
            latitude,
            longitude,
            name: "Your Location",
            timestamp: new Date().toISOString(),
          });
          setShowLocationModal(false);
        }
      },
      () => {
        toast.error("Unable to get location");
        setLocationStatus("error");
      }
    );
  };

  // Global location search with Nominatim
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
      "Your Location";
    const state = place.address?.state || "";
    const name = `${city}${state ? ", " + state : ""}`;

    const loc = {
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      name,
      timestamp: new Date().toISOString(),
    };

    setUserLocation(loc);
    setLocationName(name);
    setLocationStatus("success");
    localStorage.setItem("userLocation", JSON.stringify(loc));
    toast.success(`Location set to ${name}`);
    setShowLocationModal(false);
    setManualQuery("");
    setManualResults([]);
    setActiveIndex(-1);
  };

  // keyboard navigation for manual list
  const handleManualKeyDown = async (e) => {
    if (!manualResults.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < manualResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : manualResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && manualResults[activeIndex]) {
        handleSelectManual(manualResults[activeIndex]);
      } else {
        await searchManualLocations();
      }
    }
  };

  // close dropdown on outside click of manual list
  useEffect(() => {
    const handler = (e) => {
      if (manualRef.current && !manualRef.current.contains(e.target)) {
        setManualResults([]);
        setActiveIndex(-1);
      }
    };
    if (manualResults.length) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [manualResults.length]);

  return (
    <>
      {/* Trigger button - only render if showLocationModal is not controlled by parent */}
      {showLocationModal === undefined && (
        <button
          type="button"
          onClick={() => setShowLocationModal(true)}
          className={
            buttonClassName ??
            "flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50/50 " +
              "dark:bg-blue-900/20 text-xs font-medium text-gray-700 " +
              "dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          }
        >
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="truncate max-w-[80px]">
            {locationName || "Location"}
          </span>
        </button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border-2 border-blue-200/50 dark:border-blue-800/50 overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Choose Location
                  </h2>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  We'll show you doctors and hospitals in your area
                </p>

                {/* Use current location */}
                <button
                  onClick={handleLocationRequest}
                  disabled={locationStatus === "loading"}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 hover:from-blue-100 hover:to-teal-100 dark:hover:from-blue-900/30 dark:hover:to-teal-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    {locationStatus === "loading" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Navigation className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <Navigation className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">
                      Use current location
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {locationStatus === "loading"
                        ? "Detecting..."
                        : "Using GPS"}
                    </p>
                  </div>
                </button>

                {/* Divider text */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-blue-100 dark:bg-blue-900/60" />
                  <span className="text-[11px] uppercase tracking-wide text-gray-400">
                    Or search anywhere
                  </span>
                  <div className="h-px flex-1 bg-blue-100 dark:bg-blue-900/60" />
                </div>

                {/* Manual global search */}
                <div ref={manualRef} className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      type="text"
                      placeholder="Search any city, area or place in the world..."
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      onKeyDown={handleManualKeyDown}
                      className="w-full pl-10 pr-20 h-10 rounded-2xl border-blue-200/70 dark:border-blue-800/70 focus:border-blue-500 dark:focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={searchManualLocations}
                      disabled={isSearching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
                    >
                      {isSearching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {manualResults.length > 0 && (
                    <div className="mt-1 max-h-52 overflow-auto rounded-2xl border border-blue-100 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/40">
                      <ul className="divide-y divide-blue-100/70 dark:divide-blue-900/70 text-sm">
                        {manualResults.map((place, idx) => (
                          <li
                            key={place.place_id}
                            onClick={() => handleSelectManual(place)}
                            className={`px-3 py-2.5 cursor-pointer hover:bg-blue-100/80 dark:hover:bg-blue-900/50 ${
                              idx === activeIndex
                                ? "bg-blue-100/80 dark:bg-blue-900/60"
                                : ""
                            }`}
                          >
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {place.display_name}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {parseFloat(place.lat).toFixed(3)},{" "}
                              {parseFloat(place.lon).toFixed(3)}
                            </p>
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
