"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

// Dynamically import SignatureCanvas to avoid SSR issues
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), {
  ssr: false,
  loading: () => <div className="border-2 border-dashed border-slate-200 rounded-xl bg-white w-full h-40 flex items-center justify-center text-slate-400">Loading signature pad...</div>
});

const STEPS = [
  { id: "profile", title: "Clinic Profile" },
  { id: "usefulness", title: "Software Usefulness" },
  { id: "features", title: "Valuable Features" },
  { id: "problems", title: "Current Situation" },
  { id: "intent", title: "Intent & Payment" },
  { id: "signature", title: "Confirmation" },
];

const USEFULNESS_OPTIONS = [
  "Extremely useful",
  "Moderately useful",
  "Slightly useful",
  "Not useful",
  "Unsure",
];

const FEATURE_OPTIONS = [
  "Live patient queue & token system",
  "Faster reception & check-in",
  "Billing & payment tracking",
  "Digital prescriptions & records",
  "Patient app for queue tracking",
  "Overall OPD workflow visibility",
];

const SEVERITY_OPTIONS = [
  "Very serious – affects daily operations",
  "Moderate – manageable but inefficient",
  "Minor inconvenience",
  "Not a problem",
];

const OPD_MANAGEMENT_OPTIONS = [
  "Fully manual (registers, verbal calling)",
  "Partially digital (billing or EMR only)",
  "Fully digital software",
  "Mixed / workaround system",
];

const OPD_PROBLEMS_OPTIONS = [
  "Long patient waiting times",
  "Crowd / queue mismanagement",
  "Reception staff overload",
  "Billing errors or delays",
  "Difficulty maintaining patient records",
  "None of the above",
];

const BARRIERS_OPTIONS = [
  "Staff training effort",
  "Time required to switch",
  "Cost",
  "Internet / technical concerns",
  "Satisfaction with current system",
  "Nothing major",
];

const FEE_RANGE_OPTIONS = [
  "₹999-₹1,499",
  "₹1,500-₹2,999",
  "₹3,000-₹4,999",
  "₹5,000+",
];

const RECOMMENDATION_OPTIONS = ["Very likely", "Unlikely"];

export default function SurveyPage() {
  const router = useRouter();
  const signatureRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clinic_profile: {
      clinic_name: "",
      doctor_name: "",
      specialty: "",
    },
    software_usefulness: "",
    valuable_features: [],
    problem_severity: "",
    current_opd_management: "",
    frequent_opd_problems: [],
    willingness_to_use: "",
    barriers_to_adoption: [],
    willingness_to_pay: "",
    fee_range: "",
    recommendation_likelihood: "",
    signature: "",
    mobile_number: "",
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateProfile = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      clinic_profile: { ...prev.clinic_profile, [field]: value },
    }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setFormData((prev) => ({ ...prev, signature: "" }));
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL("image/png");
      setFormData((prev) => ({ ...prev, signature: dataUrl }));
      return true;
    }
    return false;
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Profile
        if (
          !formData.clinic_profile.clinic_name ||
          !formData.clinic_profile.doctor_name ||
          !formData.clinic_profile.specialty
        ) {
          toast.error("Please fill all clinic details");
          return false;
        }
        return true;
      case 1: // Usefulness
        if (!formData.software_usefulness) {
          toast.error("Please select an option");
          return false;
        }
        return true;
      case 2: // Features
        if (formData.valuable_features.length === 0) {
          toast.error("Please select at least one feature");
          return false;
        }
        return true;
      case 3: // Problems
        if (
          !formData.problem_severity ||
          !formData.current_opd_management ||
          formData.frequent_opd_problems.length === 0
        ) {
          toast.error("Please complete all fields");
          return false;
        }
        return true;
      case 4: // Intent
        if (
          !formData.willingness_to_use ||
          formData.barriers_to_adoption.length === 0 ||
          !formData.willingness_to_pay ||
          !formData.fee_range ||
          !formData.recommendation_likelihood
        ) {
          toast.error("Please complete all fields");
          return false;
        }
        return true;
      case 5: // Signature
        if (!formData.mobile_number || formData.mobile_number.length < 10) {
          toast.error("Please enter a valid mobile number");
          return false;
        }
        if (!saveSignature() && !formData.signature) {
          toast.error("Please provide your signature");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    // Get signature directly from canvas
    let signatureData = formData.signature;
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      signatureData = signatureRef.current.toDataURL("image/png");
    }

    const submitData = {
      ...formData,
      signature: signatureData,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/loi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      const result = await response.json();
      const submissionId = result.id;

      toast.success("LOI submitted successfully! Check your email for PDF.");
      router.push(`/loi/thank-you?id=${submissionId}`);
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clinic_name" className="text-slate-700 font-medium">
                Clinic Name
              </Label>
              <Input
                id="clinic_name"
                placeholder="Enter your clinic name"
                value={formData.clinic_profile.clinic_name}
                onChange={(e) => updateProfile("clinic_name", e.target.value)}
                className="h-12 border-slate-200 focus:border-slate-900 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor_name" className="text-slate-700 font-medium">
                Doctor / Owner Name
              </Label>
              <Input
                id="doctor_name"
                placeholder="Enter your name"
                value={formData.clinic_profile.doctor_name}
                onChange={(e) => updateProfile("doctor_name", e.target.value)}
                className="h-12 border-slate-200 focus:border-slate-900 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-slate-700 font-medium">
                Specialty
              </Label>
              <Input
                id="specialty"
                placeholder="e.g., General Physician, Pediatrics"
                value={formData.clinic_profile.specialty}
                onChange={(e) => updateProfile("specialty", e.target.value)}
                className="h-12 border-slate-200 focus:border-slate-900 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-slate-600 mb-4">
              Based on the Qlinic idea / demo explained, how useful do you feel
              this software would be for your clinic?
            </p>
            <div className="space-y-3">
              {USEFULNESS_OPTIONS.map((option) => (
                <div
                  key={option}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      software_usefulness: option,
                    }))
                  }
                  className={`option-card flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                    formData.software_usefulness === option ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200/50" : ""
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.software_usefulness === option
                        ? "border-slate-900 bg-slate-900"
                        : "border-slate-300"
                    }`}
                  >
                    {formData.software_usefulness === option && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-slate-700">{option}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-slate-600 mb-4">
              Which Qlinic features seem most valuable to you? (Select all that apply)
            </p>
            <div className="space-y-3">
              {FEATURE_OPTIONS.map((option) => (
                <div
                  key={option}
                  onClick={() => toggleMultiSelect("valuable_features", option)}
                  className={`checkbox-option flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                    formData.valuable_features.includes(option)
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200/50"
                      : ""
                  }`}
                >
                  <Checkbox
                    checked={formData.valuable_features.includes(option)}
                    className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <span className="text-slate-700">{option}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className=" font-medium">
                How serious are these problems for your clinic?
              </p>
              <div className="space-y-2">
                {SEVERITY_OPTIONS.map((option) => (
                  <div
                    key={option}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        problem_severity: option,
                      }))
                    }
                    className={`option-card flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.problem_severity === option ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200/50" : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.problem_severity === option
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-300"
                      }`}
                    >
                      {formData.problem_severity === option && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className=" text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className=" font-medium">
                How is OPD currently managed in your clinic?
              </p>
              <div className="space-y-2">
                {OPD_MANAGEMENT_OPTIONS.map((option) => (
                  <div
                    key={option}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        current_opd_management: option,
                      }))
                    }
                    className={`option-card flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.current_opd_management === option ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200/50" : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.current_opd_management === option
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-300"
                      }`}
                    >
                      {formData.current_opd_management === option && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className=" text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className=" font-medium">
                Which OPD-related problems do you face most often?
              </p>
              <div className="space-y-2">
                {OPD_PROBLEMS_OPTIONS.map((option) => (
                  <div
                    key={option}
                    onClick={() => toggleMultiSelect("frequent_opd_problems", option)}
                    className={`checkbox-option flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.frequent_opd_problems.includes(option)
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200/50"
                        : ""
                    }`}
                  >
                    <Checkbox
                      checked={formData.frequent_opd_problems.includes(option)}
                      className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <span className=" text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-slate-700 font-medium">
                If Qlinic improves OPD efficiency, would you be willing to use it?
              </p>
              <div className="flex gap-3">
                {["Yes", "No"].map((option) => (
                  <div
                    key={option}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        willingness_to_use: option,
                      }))
                    }
                    className={`option-card flex-1 flex items-center justify-center gap-2 py-4 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.willingness_to_use === option ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200/50" : ""
                    }`}
                  >
                    <span className="text-slate-700 font-medium">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-700 font-medium">
                What would stop you from using a new clinic software?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BARRIERS_OPTIONS.map((option) => (
                  <div
                    key={option}
                    onClick={() => toggleMultiSelect("barriers_to_adoption", option)}
                    className={`checkbox-option flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.barriers_to_adoption.includes(option)
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200/50"
                        : ""
                    }`}
                  >
                    <Checkbox
                      checked={formData.barriers_to_adoption.includes(option)}
                      className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <span className="text-slate-700 text-xs">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-700 font-medium">
                Would you consider paying for Qlinic if it delivers value?
              </p>
              <div className="flex gap-3">
                {["Yes", "No"].map((option) => (
                  <div
                    key={option}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        willingness_to_pay: option,
                      }))
                    }
                    className={`option-card flex-1 flex items-center justify-center gap-2 py-4 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.willingness_to_pay === option ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200/50" : ""
                    }`}
                  >
                    <span className="text-slate-700 font-medium">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-700 font-medium">
                Comfortable Monthly Fee Range:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FEE_RANGE_OPTIONS.map((option) => (
                  <div
                    key={option}
                    onClick={() => setFormData((prev) => ({ ...prev, fee_range: option }))}
                    className={`option-card flex items-center justify-center py-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.fee_range === option ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200/50" : ""
                    }`}
                  >
                    <span className="text-slate-700 font-medium">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-700 font-medium">
                How likely are you to recommend a useful clinic management system to other doctors?
              </p>
              <div className="flex gap-3">
                {RECOMMENDATION_OPTIONS.map((option) => (
                  <div
                    key={option}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        recommendation_likelihood: option,
                      }))
                    }
                    className={`option-card flex-1 flex items-center justify-center gap-2 py-4 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                      formData.recommendation_likelihood === option ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200/50" : ""
                    }`}
                  >
                    <span className=" font-medium">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Statement of Intent */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 font-['Manrope'] mb-2">
                  Statement of Intent
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We confirm that we would like to use Qlinic in our clinic if
                  it delivers clear improvement in OPD efficiency and patient
                  flow. By signing below, we confirm that the above responses
                  reflect our genuine opinion and intent to evaluate and use
                  Qlinic if it delivers the stated value.
                </p>
              </CardContent>
            </Card>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-slate-700 font-medium">
                Mobile Number
              </Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={formData.mobile_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mobile_number: e.target.value,
                  }))
                }
                className="h-12 border-slate-200 focus:border-slate-900 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-slate-700 font-medium">Signature</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSignature}
                  className="text-slate-500 hover:"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="relative signature-container border-2 border-dashed border-slate-200 rounded-xl bg-white w-full h-40">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-full rounded-lg absolute inset-0"
                  }}
                  penColor="#0F172A"
                  backgroundColor="transparent"
                />
                {!formData.signature && (
                  <p className="signature-placeholder absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                    Sign here
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
          <div className="max-w-2xl mx-auto px-6">
            <Progress 
              value={progress} 
              className="h-2 rounded-full mt-4 mb-2" 
              indicatorClassName="bg-gradient-to-r from-blue-600 to-indigo-600"
            />
          </div>
          <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                currentStep === 0 ? router.push("/loi") : prevStep()
              }
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="pt-32 pb-40 px-6">
          <div className="max-w-2xl mx-auto">
            {/* Step Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 font-['Manrope'] mb-2">
                {STEPS[currentStep].title}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
            </div>

            {/* Step Content */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 p-6 shadow-lg">
          <div className="max-w-2xl mx-auto">
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={nextStep}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-lg gap-3"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-lg gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Submit LOI
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
