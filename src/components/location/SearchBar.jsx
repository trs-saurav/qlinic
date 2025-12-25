"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

const SearchBar = ({ className }) => {
  const ctx = useAppContext();
  const router = ctx?.router || useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // {id,name,type,extra}
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/search/suggestions?${new URLSearchParams({ q })}`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) {
          setSuggestions([]);
          setShowSuggestions(false);
          setActiveIndex(-1);
          return;
        }
        const data = await res.json();
        // [{ id, name, type: "doctor" | "hospital", extra? }]
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(data.length > 0);
        setActiveIndex(data.length ? 0 : -1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveIndex(-1);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    if (showSuggestions) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSuggestions]);

  const goToEntity = (item) => {
    if (item.type === "doctor") {
      // you already have /doctor pages; adjust if you use different slug
      router.push(`/doctor/profile?id=${item.id}`);
    } else if (item.type === "hospital") {
      // you already have patient/hospitals/[id] route
      router.push(`/patient/hospitals/${item.id}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(item.name)}`);
    }
  };

  const handleSelect = async (item) => {
    setSearchQuery(item.name);
    setShowSuggestions(false);
    setActiveIndex(-1);

    goToEntity(item);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const handleEnter = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    const chosen =
      activeIndex >= 0 && suggestions[activeIndex]
        ? suggestions[activeIndex]
        : null;

    if (chosen) {
      await handleSelect(chosen);
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery("");
      setIsSearchFocused(false);
    }
  };

  const handleKeyDown = async (e) => {
    if (showSuggestions && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        await handleEnter();
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    } else if (e.key === "Enter") {
      await handleEnter();
    }
  };

  const getBadgeLabel = (type) => {
    if (type === "doctor") return "Doctor";
    if (type === "hospital") return "Hospital";
    return "Result";
  };

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "relative flex items-center gap-2 px-3 py-1.5 bg-emerald-50/30 dark:bg-emerald-900/20 rounded-full border border-emerald-200/30 dark:border-emerald-800/30"
      }
    >
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <Input
          type="text"
          placeholder="Search doctors or hospitals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setIsSearchFocused(true);
            if (suggestions.length) setShowSuggestions(true);
          }}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={handleKeyDown}
          className={`pl-8 pr-10 h-8 text-xs rounded-full border-0 bg-white/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-emerald-500 transition-all ${
            isSearchFocused || searchQuery ? "w-[260px]" : "w-[200px]"
          }`}
        />

        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
            ...
          </span>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-40 mt-1 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-emerald-100 dark:border-emerald-800 overflow-hidden">
            <ul className="max-h-64 overflow-auto py-1 text-xs">
              {suggestions.map((item, idx) => (
                <li
                  key={`${item.type}-${item.id || item.name}-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                    idx === activeIndex
                      ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      : "hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="truncate max-w-[170px]">{item.name}</span>
                    {item.extra && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[170px]">
                        {item.extra}
                      </span>
                    )}
                  </div>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    {getBadgeLabel(item.type)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
