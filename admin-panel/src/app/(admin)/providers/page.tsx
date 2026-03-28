"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Plus, ArrowUpDown, X, FileQuestion, Edit, Trash2, Filter,
  Users as UsersIcon, MapPin, DollarSign, Shield, UserPlus,
  CheckCircle, Clock, AlertTriangle, Info, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockProviders } from "@/lib/mockData";
import type { Provider } from "@/types";

type SortField = "name" | "lastVerified" | "status" | "serviceType";
type SortDirection = "asc" | "desc";

export default function ProviderDirectoryPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>(mockProviders);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(true);
  const itemsPerPage = 10;

  const getStatusBadge = (status: Provider["status"]) => {
    const variants = {
      verified: {
        className: "bg-[#C57B7D]/10 text-[#C57B7D] border-[#C57B7D] font-semibold",
        label: "Verified", icon: CheckCircle,
        description: "Provider has been verified and is visible to the chat interface",
      },
      pending: {
        className: "bg-[#A9A850]/10 text-[#A9A850] border-[#A9A850] font-semibold",
        label: "Pending Review", icon: Clock,
        description: "Provider submitted information awaiting verification/approval",
      },
      "needs-update": {
        className: "bg-[#5A5870]/10 text-[#5A5870] border-[#5A5870] font-semibold",
        label: "Needs Update", icon: AlertTriangle,
        description: "Provider information is outdated or requires re-verification",
      },
      archived: {
        className: "bg-[#A8AFBA]/10 text-[#A8AFBA] border-[#A8AFBA] font-semibold",
        label: "Archived", icon: X,
        description: "Provider is no longer active in the directory",
      },
    };
    const variant = variants[status];
    return (
      <Badge className={`${variant.className} border-2`} variant="outline" title={variant.description}>
        {variant.label}
      </Badge>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = (providerId: string, providerName: string) => {
    if (confirm(`Are you sure you want to delete "${providerName}"? This action cannot be undone.`)) {
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
      alert(`Provider "${providerName}" has been deleted successfully.`);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setServiceTypeFilter("all");
    setLocationFilter("all");
    setCostFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" || serviceTypeFilter !== "all" || locationFilter !== "all" ||
    costFilter !== "all" || statusFilter !== "all";

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      searchQuery === "" ||
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesServiceType = serviceTypeFilter === "all" || provider.serviceType === serviceTypeFilter;
    const matchesLocation = locationFilter === "all" || provider.zip === locationFilter;
    const matchesCost =
      costFilter === "all" ||
      (costFilter === "free" && provider.cost.toLowerCase().includes("free")) ||
      (costFilter === "sliding" && provider.cost.toLowerCase().includes("sliding")) ||
      (costFilter === "paid" && !provider.cost.toLowerCase().includes("free") && !provider.cost.toLowerCase().includes("sliding"));
    const matchesStatus = statusFilter === "all" || provider.status === statusFilter;
    return matchesSearch && matchesServiceType && matchesLocation && matchesCost && matchesStatus;
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name": comparison = a.name.localeCompare(b.name); break;
      case "lastVerified": comparison = new Date(a.lastVerified).getTime() - new Date(b.lastVerified).getTime(); break;
      case "status": comparison = a.status.localeCompare(b.status); break;
      case "serviceType": comparison = a.serviceType.localeCompare(b.serviceType); break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedProviders.length / itemsPerPage);
  const paginatedProviders = sortedProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const lastSyncTime = new Date().toLocaleString();

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-[#92A7C3]/5 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#17789C] to-[#2d7a9e] rounded-xl flex items-center justify-center shadow-lg shadow-[#17789C]/30">
              <UsersIcon className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            Provider Directory
          </h1>
        </div>
        <div className="bg-gradient-to-r from-[#92A7C3]/15 to-[#17789C]/10 border-2 border-[#17789C]/30 rounded-xl px-5 py-3 text-sm text-[#17789C] font-medium shadow-sm mb-4">
          Last directory sync with chat interface: {lastSyncTime}
        </div>

        {/* Provider Onboarding Banner */}
        {showOnboardingBanner && (
          <div className="bg-gradient-to-r from-[#92A7C3]/10 to-[#C57B7D]/10 border-2 border-[#5A5870]/20 rounded-xl p-5 shadow-sm mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-[#5A5870] to-[#454356] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <UserPlus className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#5A5870] mb-2">Join Our Directory!</h3>
                  <p className="text-[#5A5870] mb-3 leading-relaxed">
                    <strong>Are you a service provider that supports individuals with learning disabilities?</strong>
                    <br />
                    Join the LDA of PA Provider Directory to connect with families and individuals who need your services.
                  </p>
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="w-4 h-4 text-[#17789C] mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-sm text-[#17789C]">
                      Our directory includes evaluators, tutors, advocates, therapists, and other learning disability specialists throughout Pennsylvania.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/providers/new">
                      <Button className="bg-gradient-to-r from-[#17789C] to-[#2d7a9e] hover:from-[#0f5470] hover:to-[#17789C] text-white shadow-lg shadow-[#17789C]/30">
                        <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                        Submit Provider Information
                      </Button>
                    </Link>
                    <a href="https://ldaofpa.org" target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#17789C] hover:text-[#0f5470] underline">
                      Learn more about the directory
                    </a>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowOnboardingBanner(false)}
                className="text-[#A8AFBA] hover:text-[#5A5870] transition-colors"
                aria-label="Close onboarding banner">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Status Legend */}
        <div className="bg-white border-2 border-slate-100 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Provider Status Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-bold text-green-800">Verified</p><p className="text-xs text-green-700">Provider verified & visible to chat interface</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-bold text-yellow-800">Pending Review</p><p className="text-xs text-yellow-700">Information submitted, awaiting approval</p></div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-bold text-red-800">Needs Update</p><p className="text-xs text-red-700">Information outdated, requires re-verification</p></div>
            </div>
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-bold text-gray-800">Archived</p><p className="text-xs text-gray-700">Provider no longer active in directory</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border-2 border-slate-100 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#17789C]" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search providers by name, service type, or location"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 border-2 border-slate-200 focus:border-[#17789C] focus:ring-[#17789C]"
              aria-label="Search providers"
            />
          </div>
          <Link href="/providers/new">
            <Button className="bg-gradient-to-r from-[#17789C] to-[#2d7a9e] hover:from-[#0f5470] hover:to-[#17789C] text-white shadow-lg shadow-[#17789C]/30 px-6 h-11">
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              Add New Provider
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Service Type", id: "service-type-filter", value: serviceTypeFilter, onChange: setServiceTypeFilter, options: [{ value: "all", label: "All types" }, { value: "evaluator", label: "Evaluator" }, { value: "tutor", label: "Tutor" }, { value: "advocate", label: "Advocate" }, { value: "therapist", label: "Therapist" }] },
            { label: "Location/ZIP", id: "location-filter", value: locationFilter, onChange: setLocationFilter, options: [{ value: "all", label: "All locations" }, { value: "90001", label: "90001 - Los Angeles" }, { value: "92101", label: "92101 - San Diego" }, { value: "94601", label: "94601 - Oakland" }, { value: "94102", label: "94102 - San Francisco" }] },
            { label: "Cost Range", id: "cost-filter", value: costFilter, onChange: setCostFilter, options: [{ value: "all", label: "All costs" }, { value: "free", label: "Free" }, { value: "sliding", label: "Sliding scale" }, { value: "paid", label: "Paid services" }] },
            { label: "Verification Status", id: "status-filter", value: statusFilter, onChange: setStatusFilter, options: [{ value: "all", label: "All statuses" }, { value: "verified", label: "Verified" }, { value: "pending", label: "Pending Review" }, { value: "needs-update", label: "Needs Update" }] },
          ].map((filter) => (
            <div key={filter.id}>
              <label htmlFor={filter.id} className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <Filter className="w-4 h-4 text-[#17789C]" aria-hidden="true" />
                {filter.label}
              </label>
              <Select value={filter.value} onValueChange={(v) => { filter.onChange(v); setCurrentPage(1); }}>
                <SelectTrigger id={filter.id}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing {sortedProviders.length} of {providers.length} providers</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" aria-hidden="true" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Provider Table */}
      <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              {[
                { label: "Provider Name", field: "name" as SortField },
                { label: "Service Type", field: "serviceType" as SortField },
              ].map((col) => (
                <TableHead key={col.field} className="font-bold text-slate-900 py-4">
                  <button onClick={() => handleSort(col.field)} className="flex items-center gap-2 hover:text-teal-600 transition-colors">
                    {col.label}<ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                  </button>
                </TableHead>
              ))}
              <TableHead className="font-bold text-slate-900 py-4">Location</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Cost</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">
                <button onClick={() => handleSort("lastVerified")} className="flex items-center gap-2 hover:text-teal-600 transition-colors">
                  Last Verified<ArrowUpDown className="w-4 h-4" />
                </button>
              </TableHead>
              <TableHead className="font-bold text-slate-900 py-4">
                <button onClick={() => handleSort("status")} className="flex items-center gap-2 hover:text-teal-600 transition-colors">
                  Status<ArrowUpDown className="w-4 h-4" />
                </button>
              </TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProviders.length === 0 && !hasActiveFilters && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-inner">
                      <FileQuestion className="w-10 h-10 text-slate-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">No providers yet</p>
                      <p className="text-sm text-slate-500 mt-2">Get started by adding your first provider</p>
                    </div>
                    <Link href="/providers/new">
                      <Button className="mt-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />Add New Provider
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {paginatedProviders.length === 0 && hasActiveFilters && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center shadow-inner">
                      <Search className="w-10 h-10 text-amber-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">No providers found</p>
                      <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or search query</p>
                    </div>
                    <Button variant="outline" onClick={clearFilters} className="mt-2 border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700">
                      <X className="w-4 h-4 mr-2" />Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {paginatedProviders.map((provider) => (
              <TableRow key={provider.id} className="hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-cyan-50/30 transition-all duration-150 border-b border-slate-100">
                <TableCell className="py-4">
                  <Link href={`/providers/${provider.id}`} className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                    {provider.name}
                  </Link>
                  {provider.organization && <div className="text-sm text-slate-500 mt-1">{provider.organization}</div>}
                </TableCell>
                <TableCell className="py-4">
                  <span className="inline-flex items-center gap-1.5 capitalize text-slate-700 font-medium">{provider.serviceType}</span>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" aria-hidden="true" />
                    <div>
                      <div className="text-slate-900 font-medium">{provider.location}</div>
                      <div className="text-sm text-slate-500">{provider.zip}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span className="text-slate-700 font-medium">{provider.cost}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span className="text-slate-700">{new Date(provider.lastVerified).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">{getStatusBadge(provider.status)}</TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/providers/${provider.id}`}>
                      <Button variant="outline" size="sm" className="border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all">
                        <Eye className="w-4 h-4 mr-1" />View
                      </Button>
                    </Link>
                    <Link href={`/providers/${provider.id}/edit`}>
                      <Button variant="outline" size="sm" className="border-2 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm"
                      onClick={() => handleDelete(provider.id, provider.name)}
                      className="border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-xl border-2 border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, sortedProviders.length)}</span> of{" "}
              <span className="font-bold text-slate-900">{sortedProviders.length}</span> providers
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50">
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={page === currentPage ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md" : "border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"}
                    aria-label={`Go to page ${page}`} aria-current={page === currentPage ? "page" : undefined}>
                    {page}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
