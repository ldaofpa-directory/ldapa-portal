"use client";

import { useState } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockAuditLog } from "@/lib/mockData";
import type { AuditLogEntry } from "@/types";

export default function AuditLogPage() {
  const [logs] = useState<AuditLogEntry[]>(mockAuditLog);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");

  const getActionBadge = (action: AuditLogEntry["action"]) => {
    const variants = {
      created: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Created" },
      edited: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Edited" },
      verified: { className: "bg-green-100 text-green-800 border-green-200", label: "Verified" },
      archived: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Archived" },
      restored: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "Restored" },
      rejected: { className: "bg-red-100 text-red-800 border-red-200", label: "Rejected" },
      approved: { className: "bg-green-100 text-green-800 border-green-200", label: "Approved" },
    };
    const variant = variants[action];
    return <Badge className={`${variant.className} border`} variant="outline">{variant.label}</Badge>;
  };

  const uniqueStaff = Array.from(new Set(logs.map((log) => log.staffMember))).sort();

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffMember.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesStaff = staffFilter === "all" || log.staffMember === staffFilter;
    return matchesSearch && matchesAction && matchesStaff;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-8 h-8" aria-hidden="true" />Audit Log
        </h1>
        <p className="text-gray-600">View all changes to provider records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Events", value: logs.length, color: "text-gray-900" },
          { label: "Verifications", value: logs.filter((l) => l.action === "verified").length, color: "text-green-700" },
          { label: "Edits", value: logs.filter((l) => l.action === "edited").length, color: "text-yellow-700" },
          { label: "New Providers", value: logs.filter((l) => l.action === "created").length, color: "text-blue-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-log" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <Input id="search-log" type="search" placeholder="Search by provider or staff" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div>
            <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger id="action-filter"><SelectValue placeholder="All actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="edited">Edited</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="restored">Restored</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="staff-filter" className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger id="staff-filter"><SelectValue placeholder="All staff" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All staff</SelectItem>
                {uniqueStaff.map((staff) => <SelectItem key={staff} value={staff}>{staff}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Date & Time</TableHead>
              <TableHead className="font-semibold text-gray-900">Staff Member</TableHead>
              <TableHead className="font-semibold text-gray-900">Action</TableHead>
              <TableHead className="font-semibold text-gray-900">Provider</TableHead>
              <TableHead className="font-semibold text-gray-900">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No audit log entries found.</TableCell></TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{new Date(log.timestamp).toLocaleDateString()}</p>
                      <p className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-900">{log.staffMember}</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="font-medium text-blue-600">{log.providerName}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-md">
                    {log.changes && <p className="italic">{log.changes}</p>}
                    {log.notes && <p className="mt-1">{log.notes}</p>}
                    {!log.changes && !log.notes && <span className="text-gray-400">—</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredLogs.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredLogs.length} of {logs.length} entries
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>About Audit Logs:</strong> This log tracks all changes to provider records for accountability and compliance. Entries are stored permanently and cannot be deleted.
        </p>
      </div>
    </div>
  );
}
