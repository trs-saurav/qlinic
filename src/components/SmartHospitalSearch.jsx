"use client";

import { useState } from "react";
import { searchHospitalsWithAI } from "@/app/actions/smartSearch"; // Import the server action we created
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, Navigation, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function SmartHospitalSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null, city: null });
  const [results, setResults] = useState(null); // Stores { analysis, hospitals }
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | detecting | done | error

  // 1. Get User's Location (Browser GPS)
  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: "detected" // We let the backend/Gemini infer the city or use GPS
        });
        setLocationStatus("done");
        toast.success("Location detected!");
      },
      (err) => {
        console.error(err);
        setLocationStatus("error");
        toast.error("Could not get location. Results may not be nearby.");
      }
    );
  };

  // 2. The Search Handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResults(null);

    try {
      // Call the Server Action (The "Perfect Search" Logic)
      const data = await searchHospitalsWithAI(
        query,
        location.lat, 
        location.lng,
        "Meerut" // Default fallback city if GPS fails (you can make this dynamic)
      );

      if (data.success) {
        setResults({
          analysis: data.analysis,
          hospitals: data.results
        });
      } else {
        toast.error("Search failed. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* --- Search Header --- */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Find the Right Care</h1>
        <p className="text-muted-foreground">
          Describe your symptoms (e.g., "severe headache", "child has fever") and we'll find the best specialist nearby.
        </p>
      </div>

      {/* --- Search Bar --- */}
      <Card className="border-2 border-primary/10 shadow-lg">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-col sm:flex-row">
            
            {/* Location Button */}
            <Button 
              type="button" 
              variant={locationStatus === "done" ? "default" : "outline"}
              onClick={handleGetLocation}
              className={`shrink-0 ${locationStatus === "done" ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {locationStatus === "detecting" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : locationStatus === "done" ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              {locationStatus === "done" ? "Located" : "Near Me"}
            </Button>

            {/* Text Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Ex: My father is having chest pain..." 
                className="pl-9 h-10 text-base"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading || !query} className="h-10 px-8">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- Results Section --- */}
      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* AI Analysis Badge */}
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-100">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">
              Start Search Strategy: Looking for 
              <span className="font-bold ml-1">
                {results.analysis.specialties.join(", ") || "General"}
              </span> 
              {results.analysis.isEmergency && <span className="text-red-600 font-bold ml-1">(Emergency Priority)</span>}
            </span>
          </div>

          {/* Hospital List */}
          <div className="grid gap-4 md:grid-cols-2">
            {results.hospitals.length > 0 ? (
              results.hospitals.map((hospital) => (
                <Card key={hospital._id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {hospital.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {hospital.type} • {hospital.address.city}
                        </p>
                      </div>
                      {hospital.rating > 0 && (
                        <Badge variant="secondary">⭐ {hospital.rating}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> 
                        {hospital.address.street}
                      </p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {hospital.specialties.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-xs bg-slate-50">
                            {s}
                          </Badge>
                        ))}
                        {hospital.specialties.length > 3 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{hospital.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <p>No matching hospitals found nearby.</p>
                <p className="text-xs">Try searching for a major city name explicitly.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}