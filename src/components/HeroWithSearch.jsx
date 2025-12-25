// src/components/HeroWithSearch.jsx
'use client'
import UniversalSearch from './UniversalSearch'
import { MapPin, Users, Stethoscope, Heart } from 'lucide-react'

export default function HeroWithSearch() {
  return (
    <section className="relative bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Find the Best Healthcare
            <span className="block text-emerald-600 mt-2">Near You</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Search doctors, hospitals, and specialists in your area. Book appointments instantly.
          </p>

          {/* Universal Search */}
          <UniversalSearch variant="hero" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Stethoscope className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">500+</p>
              <p className="text-sm text-slate-600">Doctors</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">100+</p>
              <p className="text-sm text-slate-600">Hospitals</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">10K+</p>
              <p className="text-sm text-slate-600">Patients</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">4.8</p>
              <p className="text-sm text-slate-600">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
