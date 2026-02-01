"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function TermsModal({ userId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAgree = async () => {
    setLoading(true);
    try {
      // Call the API we designed earlier
      const res = await fetch('/api/legal/agree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }) // Sending ID to link the log
      });

      if (res.ok) {
        // Refresh the page to bypass the check
        router.refresh(); 
      }
    } catch (err) {
      console.error("Failed to log consent", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop blur + z-50 ensures they CANNOT click anything else
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center relative overflow-hidden">
        
        {/* Decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

        <div className="w-16 h-16 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
           <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          One final step
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Welcome to Qlinic! Before you access the Portal, you must accept our latest 
          <a href="qlinichealth.com/terms" target="_blank" className="text-blue-600 hover:underline mx-1">Terms of Service</a> 
          and 
          <a href="qlinichealth.com/privacy" target="_blank" className="text-blue-600 hover:underline mx-1">Privacy Policy</a>.
        </p>

        <Button 
          onClick={handleAgree} 
          disabled={loading}
          size="lg" 
          className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {loading ? "Signing..." : "I Agree & Continue"} 
          {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}