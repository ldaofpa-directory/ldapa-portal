"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, DollarSign, Calendar,
  Flag, Edit, CheckCircle, User, AlertTriangle, Archive,
  Eye, EyeOff, Clock, Shield, Users, FileText, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { mockProviders, mockVerificationHistory } from "@/lib/mockData";
import type { Provider } from "@/types";

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [provider, setProvider] = useState<Provider | null>(
    id ? mockProviders.find((p) => p.id === id) || null : null
  );
  const verificationHistory = id ? mockVerificationHistory[id] || [] : [];
  const [staffComments, setStaffComments] = useState(provider?.notes || "");
  const [verificationNotes, setVerificationNotes] = useState(provider?.verificationNotes || "");
  const [isVerified, setIsVerified] = useState(provider?.status === "verified");

  if (!provider) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Provider not found</p>
          <Button onClick={() => router.push("/providers")} className="mt-4">Back to Directory</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Provider["status"]) => {
    const variants = {
      verified: { className: "bg-green-100 text-green-800 border-green-200", label: "Verified", icon: CheckCircle },
      pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending Review", icon: Clock },
      "needs-update": { className: "bg-red-100 text-red-800 border-red-200", label: "Needs Update", icon: AlertTriangle },
      archived: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Archived", icon: Archive },
    };
    const variant = variants[status];
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.className} border text-base px-3 py-1 flex items-center gap-1.5 w-fit`} variant="outline">
        <Icon className="w-4 h-4" aria-hidden="true" />
        {variant.label}
      </Badge>
    );
  };

  const handleMarkVerified = () => {
    setProvider((prev) => prev ? {
      ...prev, status: "verified",
      lastVerified: new Date().toISOString().split("T")[0],
      nextVerificationDue: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      verifiedBy: "Staff Admin", visibleToLLM: true,
    } : null);
    setIsVerified(true);
    alert("Provider marked as verified and is now visible to the LLM chat interface.");
  };

  const handleMoveToPending = () => {
    setProvider((prev) => prev ? { ...prev, status: "pending", visibleToLLM: false } : null);
    alert("Provider moved to pending review queue.");
  };

  const handleArchive = () => {
    if (confirm("Are you sure you want to archive this provider? They will no longer be visible to the LLM chat interface.")) {
      setProvider((prev) => prev ? { ...prev, status: "archived", visibleToLLM: false } : null);
      alert("Provider has been archived.");
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to permanently delete "${provider.name}"? This action cannot be undone.`)) {
      alert(`Provider "${provider.name}" has been permanently deleted.`);
      router.push("/providers");
    }
  };

  const handleFlagForReview = () => {
    setProvider((prev) => prev ? { ...prev, status: "needs-update" } : null);
    alert("This provider has been flagged for review.");
  };

  const handleSaveComments = () => {
    setProvider((prev) => prev ? { ...prev, notes: staffComments } : null);
    alert("Comments saved successfully.");
  };

  const handleSaveVerificationNotes = () => {
    setProvider((prev) => prev ? { ...prev, verificationNotes } : null);
    alert("Verification notes saved successfully.");
  };

  const isOverdue = new Date(provider.nextVerificationDue) < new Date();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/providers" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Back to Provider Directory
        </Link>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">{provider.name}</h1>
            {provider.organization && <p className="text-lg text-gray-600">{provider.organization}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(provider.status)}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/providers/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" aria-hidden="true" />Edit Provider
              </Button>
            </div>
          </div>
        </div>

        {!provider.visibleToLLM && provider.status !== "archived" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <EyeOff className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-yellow-900">Not Visible to LLM Chat Interface</p>
              <p className="text-sm text-yellow-800 mt-1">This provider is not currently visible to families using the chat interface. Verify and approve this provider to make them discoverable.</p>
            </div>
          </div>
        )}

        {provider.visibleToLLM && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-green-900">Visible to LLM Chat Interface</p>
              <p className="text-sm text-green-800 mt-1">This provider is currently discoverable by families using the chat interface.</p>
            </div>
          </div>
        )}

        {isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-red-900">Verification Overdue</p>
              <p className="text-sm text-red-800 mt-1">This provider&apos;s verification expired on {new Date(provider.nextVerificationDue).toLocaleDateString()}. Please re-verify their information.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" aria-hidden="true" />Provider Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Service Type</p>
                  <p className="text-base text-gray-900 capitalize">{provider.serviceType}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                  <p className="text-base text-gray-900">{provider.location}, {provider.zip}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Cost</p>
                  <p className="text-base text-gray-900">{provider.cost}</p>
                </div>
              </div>
              {provider.licenseNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">License Number</p>
                  <p className="text-base text-gray-900">{provider.licenseNumber}</p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                  <a href={`tel:${provider.phone}`} className="text-base text-blue-600 hover:text-blue-800">{provider.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                  <a href={`mailto:${provider.email}`} className="text-base text-blue-600 hover:text-blue-800 break-all">{provider.email}</a>
                </div>
              </div>
              {provider.website && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 hover:text-blue-800 break-all">{provider.website}</a>
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">Languages Spoken</p>
                <p className="text-base text-gray-900">{provider.languages.join(", ")}</p>
              </div>
              {provider.populationsServed && provider.populationsServed.length > 0 && (
                <div className="md:col-span-2 flex items-start gap-2">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Populations Served</p>
                    <p className="text-base text-gray-900">{provider.populationsServed.join(", ")}</p>
                  </div>
                </div>
              )}
              {provider.insurance && provider.insurance.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">Insurance Accepted</p>
                  <p className="text-base text-gray-900">{provider.insurance.join(", ")}</p>
                </div>
              )}
              {provider.specializations && provider.specializations.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">Specializations</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {provider.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" aria-hidden="true" />Verification Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <Checkbox id="verified-checkbox" checked={isVerified} onCheckedChange={(c) => setIsVerified(c as boolean)} />
                <Label htmlFor="verified-checkbox" className="text-base font-medium text-gray-900 cursor-pointer">Provider is Verified</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Last Verified</p>
                  <p className="text-base text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />{new Date(provider.lastVerified).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Next Verification Due</p>
                  <p className={`text-base flex items-center gap-2 ${isOverdue ? "text-red-700 font-semibold" : "text-gray-900"}`}>
                    <Calendar className="w-4 h-4 text-gray-400" />{new Date(provider.nextVerificationDue).toLocaleDateString()}
                    {isOverdue && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  </p>
                </div>
                {provider.verifiedBy && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Verified By</p>
                    <p className="text-base text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{provider.verifiedBy}</p>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Label htmlFor="verification-notes" className="text-sm font-medium text-gray-700 mb-2 block">Verification Notes</Label>
                <Textarea id="verification-notes" value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} rows={3} className="mb-2" placeholder="Add notes about verification" />
                <Button variant="outline" size="sm" onClick={handleSaveVerificationNotes}>Save Verification Notes</Button>
              </div>
            </div>
          </div>

          {/* Verification History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />Verification History
            </h2>
            <div className="space-y-3">
              {verificationHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No verification history available</p>
              ) : (
                verificationHistory.map((record) => (
                  <div key={record.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{record.action}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>by {record.staffMember}</span>
                      </div>
                      {record.notes && <p className="text-sm text-gray-600 mt-1 italic">{record.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Internal Staff Comments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Label htmlFor="staff-comments" className="text-xl font-semibold text-gray-900 mb-4 block flex items-center gap-2">
              <FileText className="w-5 h-5" />Internal Staff Comments
            </Label>
            <p className="text-sm text-gray-600 mb-3">These notes are for internal use only and are not visible to end users or the LLM chat interface.</p>
            <Textarea id="staff-comments" value={staffComments} onChange={(e) => setStaffComments(e.target.value)} rows={4} className="mb-3" placeholder="Add internal notes about this provider..." />
            <Button variant="outline" size="sm" onClick={handleSaveComments}>Save Comments</Button>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white justify-start" onClick={handleMarkVerified}>
                <CheckCircle className="w-4 h-4 mr-2" />Mark as Verified
              </Button>
              <Button variant="outline" className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-50 justify-start" onClick={handleMoveToPending}>
                <Clock className="w-4 h-4 mr-2" />Move to Pending Review
              </Button>
              <Button variant="outline" className="w-full border-orange-600 text-orange-700 hover:bg-orange-50 justify-start" onClick={handleFlagForReview}>
                <Flag className="w-4 h-4 mr-2" />Flag for Review
              </Button>
              <Button variant="outline" className="w-full border-gray-600 text-gray-700 hover:bg-gray-50 justify-start" onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />Archive Provider
              </Button>
              <Button variant="outline" className="w-full border-red-600 text-red-700 hover:bg-red-50 justify-start" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />Delete Provider
              </Button>
            </div>
          </div>

          {!provider.visibleToLLM && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Action Required
              </h4>
              <p className="text-sm text-yellow-800">This provider is not currently visible to the LLM chat interface. Verify their information to make them discoverable to families.</p>
            </div>
          )}

          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />Re-Verification Overdue
              </h4>
              <p className="text-sm text-red-800">This provider&apos;s verification expired on {new Date(provider.nextVerificationDue).toLocaleDateString()}.</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">About Verification</h4>
            <p className="text-sm text-blue-800">Providers should be re-verified every 6 months to ensure information accuracy for families using the LLM chat interface.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
