"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Users,
  ThumbsUp,
  DollarSign,
  TrendingUp,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { getSubmissions, getStats } from "@/lib/admin/api";

export default function AdminLOIDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [copied, setCopied] = useState(false);

  const surveyLink = "/loi/survey";

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + surveyLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = async (submissionId, clinicName) => {
    setDownloadLoading(prev => ({ ...prev, [submissionId]: true }));
    try {
      const response = await fetch(`/api/loi/download/${submissionId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `LOI_${clinicName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (fileNameMatch?.[1]) fileName = fileNameMatch[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert(`Failed to download: ${error.message}`);
    } finally {
      setDownloadLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [submissionsRes, statsRes] = await Promise.all([
        getSubmissions(),
        getStats(),
      ]);
      setSubmissions(submissionsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getUsefulnessVariant = (usefulness) => {
    if (usefulness.includes("Extremely")) return "default";
    if (usefulness.includes("Moderately")) return "secondary";
    if (usefulness.includes("Somewhat")) return "outline";
    return "ghost";
  };

  const getYesNoVariant = (value) => {
    return value === "Yes" ? "default" : "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              LOI Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage Letters of Intent submissions and analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={copyLink}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Survey Link
                </>
              )}
            </Button>
            <Button
              onClick={fetchData}
              variant="outline"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Submissions */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-primary">
                  {stats.total_submissions}
                </CardTitle>
                <CardDescription>Total Submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Users className="w-8 h-8 text-muted-foreground" />
                  <div className="text-2xl font-bold text-primary-foreground">
                    {stats.total_submissions}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Willing to Use */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-emerald-50/50 border-emerald-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-emerald-600">
                  {stats.willing_to_use}
                </CardTitle>
                <CardDescription>Willing to Use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <ThumbsUp className="w-8 h-8 text-emerald-500" />
                  <Badge variant="default" className="bg-emerald-500">
                    {stats.willing_to_use}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Willing to Pay */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-blue-50/50 border-blue-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-blue-600">
                  {stats.willing_to_pay}
                </CardTitle>
                <CardDescription>Willing to Pay</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                  <Badge variant="default" className="bg-blue-500">
                    {stats.willing_to_pay}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-amber-50/50 border-amber-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-amber-600">
                  {stats.conversion_rate}%
                </CardTitle>
                <CardDescription>Conversion Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-amber-500" />
                  <Badge variant="default" className="bg-amber-500">
                    {stats.conversion_rate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Separator className="my-8" />

        {/* Submissions Table */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">
              Recent Submissions
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              All Letters of Intent submissions with key metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <div>
                    <p className="text-xl font-semibold text-foreground">Loading submissions...</p>
                    <p className="text-muted-foreground">Please wait while we fetch the latest data</p>
                  </div>
                </div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Share the survey link with clinics to start receiving Letters of Intent
                </p>
                <Button size="lg" onClick={copyLink}>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Survey Link
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-accent/50">
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Date
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Clinic
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Doctor
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Specialty
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Mobile
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Usefulness
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Willing to Use
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Willing to Pay
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Fee Range
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow
                        key={submission._id}
                        className="hover:bg-accent/80 border-b border-border hover:border-primary/50 transition-all duration-200"
                      >
                        <TableCell className="font-medium">
                          {formatDate(submission.submitted_at)}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {submission.clinic_profile.clinic_name}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground/90">
                            {submission.clinic_profile.doctor_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="border-primary/50 text-primary"
                          >
                            {submission.clinic_profile.specialty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-muted-foreground">
                            {submission.mobile_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getUsefulnessVariant(submission.software_usefulness)}
                            className={
                              submission.software_usefulness.includes("Extremely")
                                ? "bg-emerald-500 text-white"
                                : submission.software_usefulness.includes("Moderately")
                                ? "bg-blue-500 text-white"
                                : "bg-amber-500 text-white"
                            }
                          >
                            {submission.software_usefulness.split(" ")[0]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getYesNoVariant(submission.willingness_to_use)}
                            className={
                              submission.willingness_to_use === "Yes"
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-destructive hover:bg-destructive/90 text-white"
                            }
                          >
                            {submission.willingness_to_use}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getYesNoVariant(submission.willingness_to_pay)}
                            className={
                              submission.willingness_to_pay === "Yes"
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-destructive hover:bg-destructive/90 text-white"
                            }
                          >
                            {submission.willingness_to_pay}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground/90">
                          {submission.fee_range}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              downloadPDF(
                                submission.id,
                                submission.clinic_profile.clinic_name
                              )
                            }
                            disabled={downloadLoading[submission.id]}
                            className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            {downloadLoading[submission.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
