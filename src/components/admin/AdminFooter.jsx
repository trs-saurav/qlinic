// components/admin/AdminFooter.jsx (Compact Version)
'use client'

import Link from 'next/link'

export default function AdminFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {/* Left */}
          <div className="flex items-center gap-3">
            <span>© {currentYear} Qlinic Health</span>
            <span className="hidden sm:inline">•</span>
            <Link 
              href="/privacy" 
              className="hidden sm:inline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Privacy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link 
              href="/terms" 
              className="hidden sm:inline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Terms
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
              Beta v1.0
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="hidden sm:inline">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
