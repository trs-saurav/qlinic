"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, Loader2, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

const SearchBar = ({ className, onLocationFromSearch }) => {
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Fetch suggestions with debounce
  useEffect(() => {
    const q = searchQuery.trim()
    
    if (!q || q.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setActiveIndex(-1)
      setIsLoading(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        abortControllerRef.current = new AbortController()

        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(q)}`,
          {
            headers: { Accept: "application/json" },
            signal: abortControllerRef.current.signal
          }
        )

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const data = await res.json()

        // Handle both response formats
        if (data.success && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions)
          setShowSuggestions(data.suggestions.length > 0)
          setActiveIndex(data.suggestions.length > 0 ? 0 : -1)
        } else if (Array.isArray(data)) {
          // Legacy format support
          setSuggestions(data)
          setShowSuggestions(data.length > 0)
          setActiveIndex(data.length > 0 ? 0 : -1)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
          setActiveIndex(-1)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Suggestions error:', err)
          setSuggestions([])
          setShowSuggestions(false)
          setActiveIndex(-1)
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [searchQuery])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setActiveIndex(-1)
      }
    }
    
    if (showSuggestions) {
      document.addEventListener("mousedown", handler)
    }
    
    return () => document.removeEventListener("mousedown", handler)
  }, [showSuggestions])

  const goToEntity = useCallback((item) => {
    const itemType = item.type
    const itemId = item.id
    const itemText = item.text || item.name

    if (itemType === "doctor") {
      router.push(`/patient/doctors/${itemId}`)
    } else if (itemType === "hospital") {
      router.push(`/patient/hospitals/${itemId}`)
    } else if (itemType === "specialization") {
      router.push(`/search?q=${encodeURIComponent(itemText)}&type=doctors`)
    } else {
      router.push(`/search?q=${encodeURIComponent(itemText)}`)
    }
  }, [router])

  const handleSelect = useCallback((item) => {
    setSearchQuery("")
    setShowSuggestions(false)
    setActiveIndex(-1)
    setIsSearchFocused(false)
    goToEntity(item)
  }, [goToEntity])

  const handleEnter = useCallback(() => {
    const q = searchQuery.trim()
    if (!q) return

    const chosen =
      activeIndex >= 0 && suggestions[activeIndex]
        ? suggestions[activeIndex]
        : null

    if (chosen) {
      handleSelect(chosen)
    } else {
      // If onLocationFromSearch exists, try location search first
      if (onLocationFromSearch) {
        onLocationFromSearch(q)
      }
      
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchQuery("")
      setIsSearchFocused(false)
      setShowSuggestions(false)
    }
  }, [searchQuery, activeIndex, suggestions, handleSelect, router, onLocationFromSearch])

  const handleKeyDown = useCallback((e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        handleEnter()
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
        setActiveIndex(-1)
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleEnter()
    } else if (e.key === "Escape") {
      setSearchQuery("")
      setIsSearchFocused(false)
    }
  }, [showSuggestions, suggestions, handleEnter])

  const getIconForType = (type) => {
    switch (type) {
      case "doctor":
        return "👨‍⚕️"
      case "hospital":
        return "🏥"
      case "specialization":
        return "💫"
      default:
        return "🔍"
    }
  }

  const getBadgeLabel = (type) => {
    switch (type) {
      case "doctor":
        return "Doctor"
      case "hospital":
        return "Hospital"
      case "specialization":
        return "Specialty"
      default:
        return "Result"
    }
  }

  return (
    <div
      ref={containerRef}
      className={
        className ||
        "relative flex items-center gap-2 px-3 py-1.5 bg-emerald-50/30 dark:bg-emerald-900/20 rounded-full border border-emerald-200/30 dark:border-emerald-800/30"
      }
    >
      <div className="relative w-full">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none z-10" />
        
        <Input
          type="text"
          placeholder="Search doctors, hospitals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setIsSearchFocused(true)
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={handleKeyDown}
          className={`pl-8 pr-10 h-8 text-xs rounded-full border-0 bg-white/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-emerald-500 transition-all ${
            isSearchFocused || searchQuery ? "w-[260px]" : "w-[200px]"
          }`}
          autoComplete="off"
          spellCheck={false}
        />

        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
        )}

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-2 left-0 right-0 min-w-[280px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-emerald-100 dark:border-emerald-800 overflow-hidden"
            >
              <div className="px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800">
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Suggestions ({suggestions.length})
                </p>
              </div>
              
              <ul className="max-h-64 overflow-auto py-1 text-xs">
                {suggestions.map((item, idx) => {
                  const displayText = item.text || item.name
                  const displaySubtitle = item.subtitle || item.extra
                  
                  return (
                    <motion.li
                      key={`${item.type}-${item.id || displayText}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(item)
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`px-3 py-2.5 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                        idx === activeIndex
                          ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          : "hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base flex-shrink-0">
                          {getIconForType(item.type)}
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate font-medium">
                            {displayText}
                          </span>
                          {displaySubtitle && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                              {displaySubtitle}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                        {getBadgeLabel(item.type)}
                      </span>
                    </motion.li>
                  )
                })}
              </ul>
              
              {/* Search all hint */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-[9px]">Enter</kbd> to search all
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SearchBar
