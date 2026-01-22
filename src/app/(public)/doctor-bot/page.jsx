'use client';

export default function DoctorBotDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            DoctorBot Animation Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Interactive AI healthcare assistant with lifelike animations powered by pure CSS
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Desktop Size Demo */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Desktop View (400px)
            </h2>
            <div className="flex justify-center">
              <div className="w-full max-w-[400px] aspect-square bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <p className="font-bold">DoctorBot</p>
                  <p className="text-sm opacity-80 mt-1">AI Assistant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Size Demo */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Mobile View (250px)
            </h2>
            <div className="flex justify-center">
              <div className="w-full max-w-[250px] aspect-square bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <p className="font-bold text-sm">DoctorBot</p>
                  <p className="text-xs opacity-80 mt-1">AI Assistant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animation Features Showcase */}
        <div className="mt-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Animation Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Float Idle</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Gentle up-down floating with subtle swaying motion (4.5s cycle)
              </p>
            </div>

            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-6 border border-cyan-200/50 dark:border-cyan-700/50">
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Wave Arm</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Natural arm waving motion every 9 seconds with smooth rotation
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-700/50">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Head Tilt</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Occasional head movements every 12 seconds for lifelike behavior
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Eye Glow</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Pulsing blue eye lights every 2.1 seconds for engaging interaction
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Breathing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Subtle scale pulsing every 3.2 seconds mimicking gentle breathing
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-700/50">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">60fps Smooth</h3>
              <p className="text-gray-600 dark:text-gray-300">
                GPU-accelerated animations with will-change and transform optimization
              </p>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Technical Specifications
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Pure CSS animations (no JavaScript overhead)</li>
                <li>• GPU accelerated with transform and opacity</li>
                <li>• will-change property for smooth rendering</li>
                <li>• 60fps target frame rate maintained</li>
                <li>• Backface visibility hidden for optimization</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Responsive Design</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Desktop: 400px max width</li>
                <li>• Mobile: 250px max width</li>
                <li>• Proportional scaling maintained</li>
                <li>• Flexible container with aspect ratio preservation</li>
                <li>• Touch-friendly interaction zones</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}