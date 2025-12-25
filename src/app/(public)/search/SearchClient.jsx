"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/location/SearchBar";

const SearchClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ doctors: [], hospitals: [] });
  const [error, setError] = useState("");

  const fetchResults = async (q) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults({ doctors: [], hospitals: [] });
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `/api/search?${new URLSearchParams({ q: trimmed })}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) {
        setError("Failed to load results");
        setResults({ doctors: [], hospitals: [] });
        return;
      }
      const data = await res.json();
      setResults(data);
    } catch {
      setError("Failed to load results");
      setResults({ doctors: [], hospitals: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    fetchResults(q);
  }, [searchParams]);

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto mb-6 space-y-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Search
        </h1>
        <SearchBar className="w-full" />
        {query && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing results for: <span className="font-medium">{query}</span>
          </p>
        )}
      </div>

      <div className="max-w-5xl mx-auto">
        {loading && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading results...
          </p>
        )}
        {error && (
          <p className="text-red-500 text-sm mb-4">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          !results.doctors.length &&
          !results.hospitals.length &&
          query && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No results found.
            </p>
          )}

        {results.doctors.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Doctors
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.doctors.map((d) => (
                <button
                  key={d.id}
                  onClick={() =>
                    router.push(`/doctor/profile?id=${d.id}`)
                  }
                  className="w-full text-left p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 bg-white dark:bg-gray-900 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/40 transition-all"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {d.name}
                  </p>
                  {d.specialization && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {d.specialization}
                    </p>
                  )}
                  {d.experience != null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {d.experience} years experience
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {results.hospitals.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Hospitals
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.hospitals.map((h) => (
                <button
                  key={h.id}
                  onClick={() => router.push(`/patient/hospitals/${h.id}`)}
                  className="w-full text-left p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/40 transition-all"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {h.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {[h.city, h.state].filter(Boolean).join(", ")}
                  </p>
                  {h.rating > 0 && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Rating: {h.rating.toFixed(1)} / 5
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SearchClient;
