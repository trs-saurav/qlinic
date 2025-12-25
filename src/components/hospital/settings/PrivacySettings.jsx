"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PrivacySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shareDataWithDoctors: true,
    shareDataWithInsurance: false,
    publicProfile: true,
    showInSearch: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hospital/settings/privacy", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          shareDataWithDoctors: data.shareDataWithDoctors ?? true,
          shareDataWithInsurance: data.shareDataWithInsurance ?? false,
          publicProfile: data.publicProfile ?? true,
          showInSearch: data.showInSearch ?? true,
        });
      }
    } catch (err) {
      console.error("Failed to load privacy settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/hospital/settings/privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Failed to update privacy settings");
        return;
      }

      toast.success("Privacy settings updated successfully");
    } catch (err) {
      toast.error("Failed to update privacy settings");
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
        <h2 className="text-2xl font-bold">Privacy & Security</h2>
        <p className="text-sm text-muted-foreground">
          Control who can see and access your hospital data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Sharing</CardTitle>
            <CardDescription className="text-xs">
              Control how your hospital data is shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Share with Doctors</Label>
                <p className="text-xs text-muted-foreground">
                  Allow affiliated doctors to access patient records
                </p>
              </div>
              <Switch
                checked={form.shareDataWithDoctors}
                onCheckedChange={(val) =>
                  setForm((p) => ({ ...p, shareDataWithDoctors: val }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Share with Insurance</Label>
                <p className="text-xs text-muted-foreground">
                  Share data with insurance providers for claims
                </p>
              </div>
              <Switch
                checked={form.shareDataWithInsurance}
                onCheckedChange={(val) =>
                  setForm((p) => ({ ...p, shareDataWithInsurance: val }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public Visibility</CardTitle>
            <CardDescription className="text-xs">
              Control hospital visibility in search and listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Public Profile</Label>
                <p className="text-xs text-muted-foreground">
                  Allow patients to view your hospital profile
                </p>
              </div>
              <Switch
                checked={form.publicProfile}
                onCheckedChange={(val) =>
                  setForm((p) => ({ ...p, publicProfile: val }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show in Search</Label>
                <p className="text-xs text-muted-foreground">
                  Appear in patient hospital search results
                </p>
              </div>
              <Switch
                checked={form.showInSearch}
                onCheckedChange={(val) =>
                  setForm((p) => ({ ...p, showInSearch: val }))
                }
              />
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
