"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Hash,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

const HOSPITAL_TYPES = [
  "Government",
  "Private",
  "Trust",
  "Corporate",
  "Multi-Specialty",
  "Super-Specialty",
];

const SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Gynecology",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "Dentistry",
  "General Surgery",
  "Oncology",
  "Psychiatry",
  "Radiology",
  "Anesthesiology",
  "Urology",
  "Nephrology",
  "Gastroenterology",
  "Pulmonology",
  "Endocrinology",
  "Rheumatology",
];

const FACILITIES = [
  "ICU",
  "NICU",
  "Emergency",
  "OT",
  "Blood Bank",
  "Pharmacy",
  "Laboratory",
  "X-Ray",
  "CT Scan",
  "MRI",
  "Ultrasound",
  "Dialysis",
  "Physiotherapy",
  "Ambulance Service",
  "Oxygen Plant",
  "Ventilator Support",
];

const AMENITIES = [
  "Parking",
  "Cafeteria",
  "WiFi",
  "ATM",
  "Wheelchair Access",
  "Waiting Room",
  "Prayer Room",
  "Pharmacy 24x7",
  "AC Rooms",
  "TV in Rooms",
  "Visitor Lounge",
  "Lift",
];

const ACCREDITATIONS = [
  "NABH",
  "NABL",
  "ISO 9001",
  "JCI",
  "AAAHC",
  "IGBC Green",
  "LEED Certified",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function HospitalProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [hospital, setHospital] = useState(null);
  const [shortId, setShortId] = useState("");
  const [idCopied, setIdCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    registrationNumber: "",
    type: "Private",
    email: "",
    phone: "",
    website: "",
    emergencyNumber: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    established: "",
    totalBeds: "",
    icuBeds: "",
    emergencyBeds: "",
    consultationFee: "",
    emergencyFee: "",
    isOpen24x7: false,
    operatingHours: {
      Monday: { open: "09:00", close: "18:00" },
      Tuesday: { open: "09:00", close: "18:00" },
      Wednesday: { open: "09:00", close: "18:00" },
      Thursday: { open: "09:00", close: "18:00" },
      Friday: { open: "09:00", close: "18:00" },
      Saturday: { open: "09:00", close: "18:00" },
      Sunday: { open: "09:00", close: "18:00" },
    },
    specialties: [],
    facilities: [],
    amenities: [],
    accreditations: [],
  });

  useEffect(() => {
    fetchHospitalProfile();
  }, []);

  const fetchHospitalProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hospital/profile", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        toast.error("Failed to load hospital profile");
        return;
      }
      const data = await res.json();
      const h = data.hospital || {};
      setHospital(h);

      // Set short ID
      setShortId(h.shortId || h._id?.toString().slice(-8).toUpperCase());

      setForm({
        name: h.name || "",
        registrationNumber: h.registrationNumber || "",
        type: h.type || "Private",
        email: h.contactDetails?.email || "",
        phone: h.contactDetails?.phone || "",
        website: h.contactDetails?.website || "",
        emergencyNumber: h.contactDetails?.emergencyNumber || "",
        street: h.address?.street || "",
        landmark: h.address?.landmark || "",
        city: h.address?.city || "",
        state: h.address?.state || "",
        pincode: h.address?.pincode || "",
        country: h.address?.country || "India",
        established: h.established ? h.established.slice(0, 10) : "",
        totalBeds: h.totalBeds || "",
        icuBeds: h.icuBeds || "",
        emergencyBeds: h.emergencyBeds || "",
        consultationFee: h.consultationFee || "",
        emergencyFee: h.emergencyFee || "",
        isOpen24x7: h.operatingHours?.isOpen24x7 || false,
        operatingHours: h.operatingHours || {
          Monday: { open: "09:00", close: "18:00" },
          Tuesday: { open: "09:00", close: "18:00" },
          Wednesday: { open: "09:00", close: "18:00" },
          Thursday: { open: "09:00", close: "18:00" },
          Friday: { open: "09:00", close: "18:00" },
          Saturday: { open: "09:00", close: "18:00" },
          Sunday: { open: "09:00", close: "18:00" },
        },
        specialties: h.specialties || [],
        facilities: h.facilities || [],
        amenities: h.amenities || [],
        accreditations: h.accreditations || [],
      });
    } catch (err) {
      toast.error("Failed to load hospital profile");
    } finally {
      setLoading(false);
    }
  };

  const copyShortId = async () => {
    if (!shortId) return;

    try {
      await navigator.clipboard.writeText(shortId);
      setIdCopied(true);
      toast.success("Hospital ID copied to clipboard");
      setTimeout(() => setIdCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy ID");
    }
  };

  const isVerified = hospital?.isVerified;
  const verificationStatus = hospital?.verificationRequest?.status || "none";
  const canEditBasicInfo = !isVerified && verificationStatus !== "pending";

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleSelection = (field, value) => {
    setForm((prev) => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleOperatingHoursChange = (day, type, value) => {
    setForm((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [type]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const payload = {
        // Basic info - only if not verified
        ...(canEditBasicInfo && {
          name: form.name,
          registrationNumber: form.registrationNumber,
          type: form.type,
          contactDetails: {
            email: form.email,
            phone: form.phone,
            website: form.website,
            emergencyNumber: form.emergencyNumber,
          },
          address: {
            street: form.street,
            landmark: form.landmark,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            country: form.country,
          },
          established: form.established || null,
          consultationFee: parseInt(form.consultationFee) || 500,
          emergencyFee: parseInt(form.emergencyFee) || 0,
          specialties: form.specialties,
          facilities: form.facilities,
          amenities: form.amenities,
          accreditations: form.accreditations,
        }),
        // Always editable fields
        totalBeds: parseInt(form.totalBeds) || 0,
        icuBeds: parseInt(form.icuBeds) || 0,
        emergencyBeds: parseInt(form.emergencyBeds) || 0,
        operatingHours: {
          ...form.operatingHours,
          isOpen24x7: form.isOpen24x7,
        },
      };

      const res = await fetch("/api/hospital/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Hospital profile updated successfully");
      await fetchHospitalProfile();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    try {
      const res = await fetch("/api/hospital/verification/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to request verification");
        return;
      }

      toast.success("Verification request submitted successfully");
      await fetchHospitalProfile();
    } catch (err) {
      toast.error("Failed to request verification");
    } finally {
      setRequestingVerification(false);
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
      {/* Header with Verification Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hospital Profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your hospital information and contact details
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isVerified && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {verificationStatus === "pending" && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              <Clock className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
          )}
          {verificationStatus === "rejected" && (
            <Badge variant="outline" className="border-red-500 text-red-600">
              <XCircle className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          )}
        </div>
      </div>

      {/* Hospital ID Card */}
      {shortId && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Your Hospital ID
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold font-mono tracking-wider">
                    {shortId}
                  </p>
                  <Button variant="outline" size="sm" onClick={copyShortId}>
                    {idCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy ID
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this ID with doctors to help them find your hospital
                </p>
              </div>
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Hash className="h-10 w-10 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Card */}
      {!isVerified && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Hospital Verification
            </CardTitle>
            <CardDescription className="text-xs">
              {verificationStatus === "none" &&
                "Request verification to gain trust and unlock premium features"}
              {verificationStatus === "pending" &&
                "Your verification request is under review by our admin team"}
              {verificationStatus === "rejected" &&
                `Verification rejected: ${hospital?.verificationRequest?.rejectionReason || "Please contact support"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationStatus === "none" && (
              <Button
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                className="w-full sm:w-auto"
              >
                {requestingVerification ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Request Verification
                  </>
                )}
              </Button>
            )}
            {verificationStatus === "pending" && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600" />
                <p>
                  Requested on{" "}
                  {new Date(
                    hospital.verificationRequest.requestedAt
                  ).toLocaleDateString()}
                  . Basic info is locked while verification is pending.
                </p>
              </div>
            )}
            {verificationStatus === "rejected" && (
              <Button
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                variant="outline"
              >
                Request Again
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Lock Warning for Basic Info */}
      {!canEditBasicInfo && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600" />
              <p className="text-muted-foreground">
                {isVerified
                  ? "Basic information is locked for verified hospitals. However, you can still update bed counts and operating hours."
                  : "Basic information is locked while verification is pending. You can still update bed counts and operating hours."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription className="text-xs">
              Hospital name, type and registration details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Hospital Name *</Label>
                <Input
                  value={form.name}
                  onChange={handleChange("name")}
                  className="mt-1 h-9"
                  required
                  disabled={!canEditBasicInfo}
                />
              </div>
              <div>
                <Label className="text-xs">Hospital Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm((p) => ({ ...p, type: val }))}
                  disabled={!canEditBasicInfo}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSPITAL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Registration Number</Label>
                <Input
                  value={form.registrationNumber}
                  onChange={handleChange("registrationNumber")}
                  className="mt-1 h-9"
                  disabled={!canEditBasicInfo}
                />
              </div>
              <div>
                <Label className="text-xs">Established Date</Label>
                <Input
                  type="date"
                  value={form.established}
                  onChange={handleChange("established")}
                  className="mt-1 h-9"
                  disabled={!canEditBasicInfo}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Details</CardTitle>
            <CardDescription className="text-xs">
              How patients and doctors can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="mt-1 h-9"
                  disabled={!canEditBasicInfo}
                />
              </div>
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="mt-1 h-9"
                  required
                  disabled={!canEditBasicInfo}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Website</Label>
                <Input
                  value={form.website}
                  onChange={handleChange("website")}
                  className="mt-1 h-9"
                  placeholder="https://"
                  disabled={!canEditBasicInfo}
                />
              </div>
              <div>
                <Label className="text-xs">Emergency Number</Label>
                <Input
                  value={form.emergencyNumber}
                  onChange={handleChange("emergencyNumber")}
                  className="mt-1 h-9"
                  disabled={!canEditBasicInfo}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Address</CardTitle>
            <CardDescription className="text-xs">
              Physical location of the hospital
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Street Address *</Label>
              <Input
                value={form.street}
                onChange={handleChange("street")}
                className="mt-1 h-9"
                required
                disabled={!canEditBasicInfo}
              />
            </div>
            <div>
              <Label className="text-xs">Landmark</Label>
              <Input
                value={form.landmark}
                onChange={handleChange("landmark")}
                className="mt-1 h-9"
                disabled={!canEditBasicInfo}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">City *</Label>
                <Input
                  value={form.city}
                  onChange={handleChange("city")}
                  className="mt-1 h-9"
                  required
                  disabled={!canEditBasicInfo}
                />
              </div>
              <div>
                <Label className="text-xs">State *</Label>
                <Input
                  value={form.state}
                  onChange={handleChange("state")}
                  className="mt-1 h-9"
                  required
                  disabled={!canEditBasicInfo}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Pincode *</Label>
                <Input
                  value={form.pincode}
                  onChange={handleChange("pincode")}
                  className="mt-1 h-9"
                  required
                  disabled={!canEditBasicInfo}
                />
              </div>
              <div>
                <Label className="text-xs">Country</Label>
                <Input
                  value={form.country}
                  onChange={handleChange("country")}
                  className="mt-1 h-9"
                  disabled={!canEditBasicInfo}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Fees - ALWAYS EDITABLE */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Capacity & Fees
              <Badge variant="outline" className="text-[10px]">
                Always Editable
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Bed capacity can be updated anytime
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Total Beds</Label>
                <Input
                  type="number"
                  value={form.totalBeds}
                  onChange={handleChange("totalBeds")}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs">ICU Beds</Label>
                <Input
                  type="number"
                  value={form.icuBeds}
                  onChange={handleChange("icuBeds")}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Emergency Beds</Label>
                <Input
                  type="number"
                  value={form.emergencyBeds}
                  onChange={handleChange("emergencyBeds")}
                  className="mt-1 h-9"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Consultation Fee (₹)</Label>
                <Input
                  type="number"
                  value={form.consultationFee}
                  onChange={handleChange("consultationFee")}
                  className="mt-1 h-9"
                  disabled={!canEditBasicInfo}
                />
              </div>
              <div>
                <Label className="text-xs">Emergency Fee (₹)</Label>
                <Input
                  type="number"
                  value={form.emergencyFee}
                  onChange={handleChange("emergencyFee")}
                  className="mt-1 h-9"
                  disabled={!canEditBasicInfo}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours - ALWAYS EDITABLE */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Operating Hours
              <Badge variant="outline" className="text-[10px]">
                Always Editable
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Hospital availability schedule - can be updated anytime
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Open 24/7</Label>
              <Switch
                checked={form.isOpen24x7}
                onCheckedChange={(val) =>
                  setForm((p) => ({ ...p, isOpen24x7: val }))
                }
              />
            </div>

            {!form.isOpen24x7 && (
              <div className="space-y-3 pt-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center"
                  >
                    <Label className="text-xs">{day}</Label>
                    <Input
                      type="time"
                      value={form.operatingHours[day]?.open || "09:00"}
                      onChange={(e) =>
                        handleOperatingHoursChange(day, "open", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                    <Input
                      type="time"
                      value={form.operatingHours[day]?.close || "18:00"}
                      onChange={(e) =>
                        handleOperatingHoursChange(day, "close", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specialties</CardTitle>
            <CardDescription className="text-xs">
              Select medical specialties offered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="gap-1">
                  {specialty}
                  {canEditBasicInfo && (
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleSelection("specialties", specialty)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {SPECIALTIES.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={`specialty-${specialty}`}
                    checked={form.specialties.includes(specialty)}
                    onCheckedChange={() =>
                      toggleSelection("specialties", specialty)
                    }
                    disabled={!canEditBasicInfo}
                  />
                  <label
                    htmlFor={`specialty-${specialty}`}
                    className="text-xs cursor-pointer"
                  >
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Facilities</CardTitle>
            <CardDescription className="text-xs">
              Select available medical facilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.facilities.map((facility) => (
                <Badge key={facility} variant="secondary" className="gap-1">
                  {facility}
                  {canEditBasicInfo && (
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleSelection("facilities", facility)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {FACILITIES.map((facility) => (
                <div key={facility} className="flex items-center space-x-2">
                  <Checkbox
                    id={`facility-${facility}`}
                    checked={form.facilities.includes(facility)}
                    onCheckedChange={() => toggleSelection("facilities", facility)}
                    disabled={!canEditBasicInfo}
                  />
                  <label
                    htmlFor={`facility-${facility}`}
                    className="text-xs cursor-pointer"
                  >
                    {facility}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amenities</CardTitle>
            <CardDescription className="text-xs">
              Select available amenities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="gap-1">
                  {amenity}
                  {canEditBasicInfo && (
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleSelection("amenities", amenity)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={form.amenities.includes(amenity)}
                    onCheckedChange={() => toggleSelection("amenities", amenity)}
                    disabled={!canEditBasicInfo}
                  />
                  <label
                    htmlFor={`amenity-${amenity}`}
                    className="text-xs cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accreditations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accreditations</CardTitle>
            <CardDescription className="text-xs">
              Select your hospital's accreditations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.accreditations.map((accreditation) => (
                <Badge key={accreditation} variant="secondary" className="gap-1">
                  {accreditation}
                  {canEditBasicInfo && (
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        toggleSelection("accreditations", accreditation)
                      }
                    />
                  )}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACCREDITATIONS.map((accreditation) => (
                <div key={accreditation} className="flex items-center space-x-2">
                  <Checkbox
                    id={`accreditation-${accreditation}`}
                    checked={form.accreditations.includes(accreditation)}
                    onCheckedChange={() =>
                      toggleSelection("accreditations", accreditation)
                    }
                    disabled={!canEditBasicInfo}
                  />
                  <label
                    htmlFor={`accreditation-${accreditation}`}
                    className="text-xs cursor-pointer"
                  >
                    {accreditation}
                  </label>
                </div>
              ))}
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
