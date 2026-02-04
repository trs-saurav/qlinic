"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, FileCheck, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">


      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Clock className="w-4 h-4" />
              Takes only 2 minutes
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 font-['Manrope'] tracking-tight mb-6">
              Express Your Interest in
              <span className="block text-BLUE-600 font-bold">Qlinic</span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-10 leading-relaxed">
              Help us understand if our digital clinic operations platform would
              benefit your practice. Complete this quick survey to receive
              priority access.
            </p>

            {/* CTA Button */}
            <Button
              size="lg"
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => router.push("/loi/survey")}
            >
              Start LOI Survey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure & Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>Digital LOI Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>2-3 Minutes</span>
              </div>
            </div>
          </div>
          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
            {[
              {
                title: "Live Queue System",
                description: "Real-time patient queue & token management",
              },
              {
                title: "Digital Records",
                description:
                  "Prescriptions & patient history at your fingertips",
              },
              {
                title: "Billing Made Easy",
                description: "Automated billing & payment tracking",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors duration-200"
              >
                <h3 className="font-semibold text-slate-900 font-['Manrope'] mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 text-center text-slate-500 text-sm">
        <p>&copy; 2025 Qlinic. All rights reserved.</p>
      </footer>
    </div>
  );
}

