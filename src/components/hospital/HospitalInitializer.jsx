"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Hospital } from "lucide-react";
import toast from "react-hot-toast";

export default function HospitalInitializer({ children }) {
  const { user, isLoaded } = useUser();
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      checkHospital();
    }
  }, [isLoaded, user]);

  const checkHospital = async () => {
    try {
      const res = await fetch("/api/hospital/profile");
      
      if (res.ok) {
        setInitializing(false);
      } else if (res.status === 404) {
        await createHospital();
      } else {
        const data = await res.json();
        setError(data.error);
        setInitializing(false);
      }
    } catch (err) {
      console.error("Check hospital error:", err);
      setError("Failed to load hospital profile");
      setInitializing(false);
    }
  };

  const createHospital = async () => {
    try {
      const hospitalName = `${user.firstName || "Medical"} Hospital`;
      
      const res = await fetch("/api/hospital/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hospitalName }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Welcome! Complete your hospital profile in Settings.");
        setInitializing(false);
      } else {
        setError(data.error);
        setInitializing(false);
      }
    } catch (err) {
      console.error("Create hospital error:", err);
      setError("Failed to initialize hospital");
      setInitializing(false);
    }
  };

  if (!isLoaded || initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md">
          <Hospital className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Setting Up Your Hospital
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we prepare your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Setup Error
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
