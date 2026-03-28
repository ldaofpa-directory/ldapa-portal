"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, AlertTriangle, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { mockPendingReviews } from "@/lib/mockData";
import type { PendingReview } from "@/types";

export default function PendingReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>(mockPendingReviews);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [checklist, setChecklist] = useState({
    websiteConfirmed: false,
    costConfirmed: false,
    licenseVerified: false,
  });

  const getPriorityBadge = (priority: PendingReview["priority"]) => {
    const variants = {
      high: { className: "bg-red-100 text-red-800 border-red-200", label: "High Priority" },
      medium: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Medium Priority" },
      low: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Low Priority" },
    };
    const variant = variants[priority];
    return <Badge className={`${variant.className} border`} variant="outline">{variant.label}</Badge>;
  };

  const handleOpenReview = (review: PendingReview) => {
    setSelectedReview(review);
    setReviewNotes("");
    setChecklist({ websiteConfirmed: false, costConfirmed: false, licenseVerified: false });
  };

  const handleCloseReview = () => {
    setSelectedReview(null);
    setReviewNotes("");
    setChecklist({ websiteConfirmed: false, costConfirmed: false, licenseVerified: false });
  };

  const handleApprove = () => {
    if (selectedReview) {
      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id));
      alert("Provider approved and marked as verified!");
      handleCloseReview();
    }
  };

  const handleRequestChanges = () => {
    if (!reviewNotes.trim()) { alert("Please provide notes explaining what changes are needed."); return; }
    if (selectedReview) {
      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id));
      alert("Provider has been notified of requested changes.");
      handleCloseReview();
    }
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) { alert("Please provide a reason for rejection."); return; }
    if (confirm("Are you sure you want to reject this provider? This action cannot be undone.")) {
      if (selectedReview) {
        setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id));
        alert("Provider has been rejected.");
        handleCloseReview();
      }
    }
  };

  const filteredReviews = reviews.filter((r) => priorityFilter === "all" || r.priority === priorityFilter);
  const stats = {
    total: reviews.length,
    high: reviews.filter((r) => r.priority === "high").length,
    medium: reviews.filter((r) => r.priority === "medium").length,
    low: reviews.filter((r) => r.priority === "low").length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Pending Reviews</h1>
        <p className="text-gray-600">Review and verify provider information</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Pending", value: stats.total, icon: Clock, color: "bg-gray-100 text-gray-600" },
          { label: "High Priority", value: stats.high, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
          { label: "Medium Priority", value: stats.medium, icon: Clock, color: "bg-yellow-100 text-yellow-600" },
          { label: "Low Priority", value: stats.low, icon: Clock, color: "bg-blue-100 text-blue-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <label htmlFor="priority-filter" className="text-sm font-medium text-gray-700">Filter by Priority:</label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger id="priority-filter" className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High priority</SelectItem>
              <SelectItem value="medium">Medium priority</SelectItem>
              <SelectItem value="low">Low priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Provider Name</TableHead>
              <TableHead className="font-semibold text-gray-900">Service Type</TableHead>
              <TableHead className="font-semibold text-gray-900">Submitted Date</TableHead>
              <TableHead className="font-semibold text-gray-900">Priority</TableHead>
              <TableHead className="font-semibold text-gray-900">Reason</TableHead>
              <TableHead className="font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">No pending reviews found.</TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Link href={`/providers/${review.providerId}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                      {review.provider.name}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{review.provider.serviceType}</TableCell>
                  <TableCell>{new Date(review.submittedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getPriorityBadge(review.priority)}</TableCell>
                  <TableCell className="max-w-xs"><span className="text-sm text-gray-600">{review.reason}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenReview(review)}>
                        <Eye className="w-4 h-4 mr-1" />Review
                      </Button>
                      <Link href={`/providers/${review.providerId}`}>
                        <Button variant="outline" size="sm">View Detail</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredReviews.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Click &quot;Review&quot; to see a detailed comparison and verification checklist. High priority items require immediate attention.
          </p>
        </div>
      )}

      {/* Review Modal */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={handleCloseReview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Review Provider: {selectedReview.provider.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Changed Fields */}
              {selectedReview.changedFields && selectedReview.changedFields.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-3">Changes Detected</h3>
                  <div className="space-y-3">
                    {selectedReview.changedFields.map((field) => (
                      <div key={field} className="grid grid-cols-2 gap-4 bg-white rounded p-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Previous {field}</p>
                          <p className="text-sm text-gray-700 line-through">
                            {selectedReview.previousVersion?.[field as keyof typeof selectedReview.previousVersion] as string || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-700 uppercase mb-1">New {field}</p>
                          <p className="text-sm text-green-900 font-medium">
                            {selectedReview.provider[field as keyof typeof selectedReview.provider] as string || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Provider Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Provider Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Service Type</p><p className="text-gray-900 font-medium capitalize">{selectedReview.provider.serviceType}</p></div>
                  <div><p className="text-gray-500">Location</p><p className="text-gray-900 font-medium">{selectedReview.provider.location}</p></div>
                  <div><p className="text-gray-500">Phone</p><p className="text-gray-900 font-medium">{selectedReview.provider.phone}</p></div>
                  <div><p className="text-gray-500">Email</p><p className="text-gray-900 font-medium break-all">{selectedReview.provider.email}</p></div>
                  <div><p className="text-gray-500">Cost</p><p className="text-gray-900 font-medium">{selectedReview.provider.cost}</p></div>
                  {selectedReview.provider.website && (
                    <div><p className="text-gray-500">Website</p>
                      <a href={selectedReview.provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium break-all">{selectedReview.provider.website}</a>
                    </div>
                  )}
                  <div className="col-span-2"><p className="text-gray-500">Languages</p><p className="text-gray-900 font-medium">{selectedReview.provider.languages.join(", ")}</p></div>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Verification Checklist</h3>
                <div className="space-y-3">
                  {[
                    { id: "website-check", key: "websiteConfirmed" as const, label: "Website confirmed (if applicable) - verify URL is active and belongs to provider" },
                    { id: "cost-check", key: "costConfirmed" as const, label: "Cost information confirmed - pricing is current and accurate" },
                    { id: "license-check", key: "licenseVerified" as const, label: "License verified (if applicable) - credentials checked with appropriate board" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <Checkbox id={item.id} checked={checklist[item.key]} onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, [item.key]: c as boolean }))} />
                      <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="review-notes" className="text-sm font-medium text-gray-700 mb-2 block">
                  Review Notes {!reviewNotes.trim() && "(Required for rejection or requesting changes)"}
                </Label>
                <Textarea id="review-notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={4} placeholder="Add notes about your review decision..." className="mb-2" />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseReview}>Cancel</Button>
                <Button variant="outline" onClick={handleReject} className="border-red-600 text-red-700 hover:bg-red-50">
                  <X className="w-4 h-4 mr-2" />Reject
                </Button>
                <Button variant="outline" onClick={handleRequestChanges} className="border-yellow-600 text-yellow-700 hover:bg-yellow-50">
                  <AlertTriangle className="w-4 h-4 mr-2" />Request Changes
                </Button>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-2" />Approve & Verify
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
