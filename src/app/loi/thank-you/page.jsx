"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Home, Mail, Download, Loader2, AlertCircle } from "lucide-react";

const API = `/api`;

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  // Get submission ID from query params
  const submissionId = searchParams.get("id");

  const downloadPDF = async () => {
    if (!submissionId) {
      setError("No submission data available");
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(`${API}/loi/download/${submissionId}`);

      // Handle API error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `Download failed: ${response.status}`
        );
      }

      const blob = await response.blob();
      
      // Extract filename from Content-Disposition header (set by our API)
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'LOI_document.pdf';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (fileNameMatch?.[1]) {
          fileName = fileNameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Success feedback
      setTimeout(() => {
        alert(`✅ ${fileName} downloaded successfully!`);
      }, 500);

    } catch (error) {
      console.error("Download error:", error);
      setError(error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Card className="form-card shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Success Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent font-['Manrope'] mb-4">
              Thank You!
            </h1>

            {/* Success Message */}
            <p className="text-lg text-slate-700 mb-8 leading-relaxed">
              Your Letter of Intent has been successfully submitted and sent to
              <span className="font-semibold text-blue-600"> Qlinic</span>.
            </p>

            {/* Email Confirmation */}
            <div className="flex items-center justify-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-800">
                A copy has been sent to Qlinic team
              </span>
            </div>

            {/* Submission ID (for reference) */}
            {submissionId && (
              <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Submission ID</p>
                <p className="font-mono text-sm font-semibold text-slate-900 break-all">
                  {submissionId.slice(-8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Download PDF Button */}
            <Button
              onClick={downloadPDF}
              disabled={downloading || !submissionId}
              className="w-full h-14 mb-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg transition-all duration-200 border-0 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-3" />
                  Download LOI PDF
                </>
              )}
            </Button>

            {/* Back to Home Button */}
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full h-14 bg-white/80 backdrop-blur-sm hover:bg-slate-50 border-slate-200 text-slate-800 font-semibold rounded-2xl shadow-md transition-all duration-200 text-lg border-2"
            >
              <Home className="w-5 h-5 mr-3" />
              Back to Home
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8 font-medium">
          We appreciate your time and interest in{" "}
          <span className="font-bold text-slate-900">Qlinic</span>.
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
