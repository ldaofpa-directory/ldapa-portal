"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, FileCheck, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockProviders } from "@/lib/mockData";
import type { Provider, ValidationError } from "@/types";

export default function AddEditProviderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const isEditing = Boolean(id);
  const existingProvider = id ? mockProviders.find((p) => p.id === id) : null;

  const [formData, setFormData] = useState<Partial<Provider>>({
    name: "", organization: "", serviceType: "evaluator", location: "",
    zip: "", phone: "", email: "", website: "", cost: "",
    languages: [], populationsServed: [], insurance: [],
    licenseNumber: "", specializations: [], notes: "", verificationNotes: "",
  });

  const [languagesInput, setLanguagesInput] = useState("");
  const [populationsInput, setPopulationsInput] = useState("");
  const [insuranceInput, setInsuranceInput] = useState("");
  const [specializationsInput, setSpecializationsInput] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (existingProvider) {
      setFormData(existingProvider);
      setLanguagesInput(existingProvider.languages?.join(", ") || "");
      setPopulationsInput(existingProvider.populationsServed?.join(", ") || "");
      setInsuranceInput(existingProvider.insurance?.join(", ") || "");
      setSpecializationsInput(existingProvider.specializations?.join(", ") || "");
    }
  }, [existingProvider]);

  const handleChange = (field: keyof Provider, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => new Set(prev).add(field));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    validateField(field);
  };

  const validateField = (field: string): boolean => {
    const newErrors = errors.filter((e) => e.field !== field);
    switch (field) {
      case "name":
        if (!formData.name?.trim()) newErrors.push({ field: "name", message: "Provider name is required" });
        break;
      case "email":
        if (!formData.email?.trim()) newErrors.push({ field: "email", message: "Email is required" });
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.push({ field: "email", message: "Please enter a valid email address" });
        break;
      case "phone":
        if (!formData.phone?.trim()) newErrors.push({ field: "phone", message: "Phone number is required" });
        break;
      case "location":
        if (!formData.location?.trim()) newErrors.push({ field: "location", message: "Location is required" });
        break;
      case "zip":
        if (!formData.zip?.trim()) newErrors.push({ field: "zip", message: "ZIP code is required" });
        else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) newErrors.push({ field: "zip", message: "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)" });
        break;
      case "cost":
        if (!formData.cost?.trim()) newErrors.push({ field: "cost", message: "Cost information is required" });
        break;
      case "website":
        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) newErrors.push({ field: "website", message: "Please enter a valid URL starting with http:// or https://" });
        break;
    }
    setErrors(newErrors);
    return newErrors.filter((e) => e.field === field).length === 0;
  };

  const validateAll = (): boolean => {
    const requiredFields = ["name", "email", "phone", "location", "zip", "cost"];
    let isValid = true;
    requiredFields.forEach((field) => { if (!validateField(field)) isValid = false; });
    if (!languagesInput.trim()) {
      setErrors((prev) => [...prev, { field: "languages", message: "At least one language is required" }]);
      isValid = false;
    }
    return isValid;
  };

  const getErrorForField = (field: string) => errors.find((e) => e.field === field)?.message;

  const inputClassName = (field: string) => {
    const hasError = touched.has(field) && getErrorForField(field);
    return hasError ? "border-red-500 focus:ring-red-500" : "";
  };

  const handleSave = async (saveType: "draft" | "save" | "verify") => {
    if (saveType !== "draft" && !validateAll()) { setSaveStatus("error"); return; }
    setSaveStatus("saving");

    const languages = languagesInput.split(",").map((l) => l.trim()).filter(Boolean);
    const populations = populationsInput.split(",").map((p) => p.trim()).filter(Boolean);
    const insurance = insuranceInput.split(",").map((i) => i.trim()).filter(Boolean);
    const specializations = specializationsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const now = new Date().toISOString().split("T")[0];

    // Simulate API call
    setTimeout(() => {
      setSaveStatus("success");
      setTimeout(() => {
        router.push(isEditing ? `/providers/${id}` : "/providers");
      }, 1000);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={isEditing ? `/providers/${id}` : "/providers"}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {isEditing ? "Back to Provider Detail" : "Back to Directory"}
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">
          {isEditing ? "Edit Provider" : "Add New Provider"}
        </h1>
        <p className="text-gray-600 mt-2">
          Fields marked with <span className="text-red-600">*</span> are required
        </p>
      </div>

      {/* Status Messages */}
      {saveStatus === "success" && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Success!</p>
            <p className="text-sm text-green-800">Provider saved successfully. Redirecting...</p>
          </div>
        </div>
      )}
      {saveStatus === "error" && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Validation Error</p>
            <p className="text-sm text-red-800">Please fix the errors below before saving.</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Provider Name <span className="text-red-600">*</span></Label>
              <Input id="name" type="text" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} onBlur={() => handleBlur("name")} className={`mt-1 ${inputClassName("name")}`} aria-required="true" />
              {touched.has("name") && getErrorForField("name") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("name")}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="organization" className="text-sm font-medium text-gray-700">Organization (Optional)</Label>
              <Input id="organization" type="text" value={formData.organization} onChange={(e) => handleChange("organization", e.target.value)} className="mt-1" />
              <p className="text-xs text-gray-500 mt-1">If the provider works under an organization name</p>
            </div>
            <div>
              <Label htmlFor="service-type" className="text-sm font-medium text-gray-700">Service Type <span className="text-red-600">*</span></Label>
              <Select value={formData.serviceType} onValueChange={(v) => handleChange("serviceType", v)}>
                <SelectTrigger id="service-type" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evaluator">Evaluator</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="advocate">Advocate</SelectItem>
                  <SelectItem value="therapist">Therapist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="license-number" className="text-sm font-medium text-gray-700">License Number (Optional)</Label>
              <Input id="license-number" type="text" value={formData.licenseNumber} onChange={(e) => handleChange("licenseNumber", e.target.value)} className="mt-1" placeholder="e.g., PSY-12345" />
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="populations" className="text-sm font-medium text-gray-700">Populations Served (Optional)</Label>
              <Input id="populations" type="text" value={populationsInput} onChange={(e) => setPopulationsInput(e.target.value)} className="mt-1" placeholder="e.g., K-12, Adults, Children (comma-separated)" />
              <p className="text-xs text-gray-500 mt-1">Separate multiple populations with commas</p>
            </div>
            <div>
              <Label htmlFor="specializations" className="text-sm font-medium text-gray-700">Specializations (Optional)</Label>
              <Input id="specializations" type="text" value={specializationsInput} onChange={(e) => setSpecializationsInput(e.target.value)} className="mt-1" placeholder="e.g., ADHD, Dyslexia, Anxiety (comma-separated)" />
            </div>
            <div>
              <Label htmlFor="languages" className="text-sm font-medium text-gray-700">Languages Spoken <span className="text-red-600">*</span></Label>
              <Input id="languages" type="text" value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} onBlur={() => handleBlur("languages")} className={`mt-1 ${inputClassName("languages")}`} placeholder="e.g., English, Spanish, Mandarin (comma-separated)" aria-required="true" />
              {touched.has("languages") && getErrorForField("languages") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("languages")}</p>}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">Address/City, State <span className="text-red-600">*</span></Label>
              <Input id="location" type="text" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} onBlur={() => handleBlur("location")} className={`mt-1 ${inputClassName("location")}`} placeholder="e.g., Philadelphia, PA" aria-required="true" />
              {touched.has("location") && getErrorForField("location") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("location")}</p>}
            </div>
            <div>
              <Label htmlFor="zip" className="text-sm font-medium text-gray-700">ZIP Code <span className="text-red-600">*</span></Label>
              <Input id="zip" type="text" value={formData.zip} onChange={(e) => handleChange("zip", e.target.value)} onBlur={() => handleBlur("zip")} className={`mt-1 ${inputClassName("zip")}`} placeholder="e.g., 19103" maxLength={10} aria-required="true" />
              {touched.has("zip") && getErrorForField("zip") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("zip")}</p>}
            </div>
          </div>
        </div>

        {/* Cost & Insurance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost & Insurance</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cost" className="text-sm font-medium text-gray-700">Cost/Sliding Scale <span className="text-red-600">*</span></Label>
              <Input id="cost" type="text" value={formData.cost} onChange={(e) => handleChange("cost", e.target.value)} onBlur={() => handleBlur("cost")} className={`mt-1 ${inputClassName("cost")}`} placeholder="e.g., $50-$100/session, Sliding scale, Free" aria-required="true" />
              {touched.has("cost") && getErrorForField("cost") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("cost")}</p>}
            </div>
            <div>
              <Label htmlFor="insurance" className="text-sm font-medium text-gray-700">Insurance Accepted (Optional)</Label>
              <Input id="insurance" type="text" value={insuranceInput} onChange={(e) => setInsuranceInput(e.target.value)} className="mt-1" placeholder="e.g., Blue Cross, Aetna, Private Pay (comma-separated)" />
              <p className="text-xs text-gray-500 mt-1">Separate multiple insurance providers with commas</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone <span className="text-red-600">*</span></Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} onBlur={() => handleBlur("phone")} className={`mt-1 ${inputClassName("phone")}`} placeholder="(555) 123-4567" aria-required="true" />
              {touched.has("phone") && getErrorForField("phone") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("phone")}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-red-600">*</span></Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")} className={`mt-1 ${inputClassName("email")}`} placeholder="provider@example.com" aria-required="true" />
              {touched.has("email") && getErrorForField("email") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("email")}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website (Optional)</Label>
              <Input id="website" type="url" value={formData.website} onChange={(e) => handleChange("website", e.target.value)} onBlur={() => handleBlur("website")} className={`mt-1 ${inputClassName("website")}`} placeholder="https://example.com" />
              {touched.has("website") && getErrorForField("website") && <p className="text-sm text-red-600 mt-1" role="alert">{getErrorForField("website")}</p>}
            </div>
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification & Notes</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-notes" className="text-sm font-medium text-gray-700">Verification Notes (Optional)</Label>
              <Textarea id="verification-notes" value={formData.verificationNotes} onChange={(e) => handleChange("verificationNotes", e.target.value)} rows={2} className="mt-1" placeholder="e.g., License verified with state board on [date]" />
              <p className="text-xs text-gray-500 mt-1">Record verification details for audit purposes</p>
            </div>
            <div>
              <Label htmlFor="staff-notes" className="text-sm font-medium text-gray-700">Internal Staff Notes (Optional)</Label>
              <Textarea id="staff-notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={3} className="mt-1" placeholder="Internal notes about this provider (not visible to end users)" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-blue-900">About Provider Visibility</p>
            <p className="text-sm text-blue-800 mt-1">To make this provider visible to the LLM chat interface, use &quot;Save &amp; Verify&quot; or verify them after saving. Draft saves will keep the provider in pending status.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 bg-white rounded-lg p-6">
          <Button type="button" variant="outline" onClick={() => router.push(isEditing ? `/providers/${id}` : "/providers")} disabled={saveStatus === "saving"}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={() => handleSave("draft")} disabled={saveStatus === "saving"}>
            <Save className="w-4 h-4 mr-2" />Save as Draft
          </Button>
          <Button type="button" onClick={() => handleSave("save")} disabled={saveStatus === "saving"} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === "saving" ? "Saving..." : "Save Provider"}
          </Button>
          <Button type="button" onClick={() => handleSave("verify")} disabled={saveStatus === "saving"} className="bg-green-600 hover:bg-green-700 text-white">
            <FileCheck className="w-4 h-4 mr-2" />Save & Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
