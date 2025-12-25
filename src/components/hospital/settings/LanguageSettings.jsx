"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "IST (India Standard Time)" },
  { value: "Asia/Dubai", label: "GST (Gulf Standard Time)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (24/12/2025)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/24/2025)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-12-24)" },
];

export default function LanguageSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    language: "en",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hospital/settings/language", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          language: data.language || "en",
          timezone: data.timezone || "Asia/Kolkata",
          dateFormat: data.dateFormat || "DD/MM/YYYY",
        });
      }
    } catch (err) {
      console.error("Failed to load language settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/hospital/settings/language", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Failed to update settings");
        return;
      }

      toast.success("Language settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Language & Region</h2>
        <p className="text-sm text-muted-foreground">
          Set your preferred language, timezone and formats
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Language Preferences</CardTitle>
            <CardDescription className="text-xs">
              Choose your preferred display language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="text-xs">Display Language</Label>
            <Select
              value={form.language}
              onValueChange={(val) => setForm((p) => ({ ...p, language: val }))}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regional Settings</CardTitle>
            <CardDescription className="text-xs">
              Timezone and date format preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Timezone</Label>
              <Select
                value={form.timezone}
                onValueChange={(val) => setForm((p) => ({ ...p, timezone: val }))}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date Format</Label>
              <Select
                value={form.dateFormat}
                onValueChange={(val) => setForm((p) => ({ ...p, dateFormat: val }))}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((df) => (
                    <SelectItem key={df.value} value={df.value}>
                      {df.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
