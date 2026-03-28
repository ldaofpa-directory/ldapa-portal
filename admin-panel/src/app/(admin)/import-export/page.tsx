"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertCircle, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockProviders } from "@/lib/mockData";
import { exportToCSV, downloadCSV, parseCSV, type CSVImportRow } from "@/lib/csv";

export default function ImportExportPage() {
  const [importResults, setImportResults] = useState<CSVImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "preview" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const csvContent = exportToCSV(mockProviders);
    const filename = `lda-of-pa-providers-${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const results = parseCSV(text, mockProviders);
      setImportResults(results);
      setImportStatus("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setImportStatus("success");
      setTimeout(() => { setImportStatus("idle"); setImportResults([]); }, 3000);
    }, 2000);
  };

  const handleCancel = () => {
    setImportStatus("idle");
    setImportResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validRows = importResults.filter((r) => r.errors.length === 0);
  const errorRows = importResults.filter((r) => r.errors.length > 0);
  const duplicateRows = importResults.filter((r) => r.isDuplicate);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Bulk Import/Export</h1>
        <p className="text-gray-600">Import or export provider data in CSV format</p>
      </div>

      {importStatus === "success" && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Import Successful!</p>
            <p className="text-sm text-green-800">{validRows.length} provider(s) have been imported successfully.</p>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Download className="w-5 h-5" />Export Providers
            </h2>
            <p className="text-gray-600 mb-4">Download all provider data as a CSV file. This file can be edited and re-imported.</p>
            <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4 mr-2" />Export to CSV
            </Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-w-sm">
            <p className="font-semibold mb-2">Export includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All provider information</li>
              <li>Verification status</li>
              <li>Contact details</li>
              <li>Service information</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Import */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5" />Import Providers
        </h2>
        <p className="text-gray-600 mb-4">Upload a CSV file to add or update multiple providers at once.</p>

        {importStatus === "idle" && (
          <div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload">
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                <span><Upload className="w-4 h-4 mr-2" />Select CSV File</span>
              </Button>
            </label>
          </div>
        )}

        {importStatus === "preview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-5 h-5 text-green-600" /><p className="font-semibold text-green-900">Valid Rows</p></div>
                <p className="text-2xl font-bold text-green-700">{validRows.length}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-5 h-5 text-red-600" /><p className="font-semibold text-red-900">Errors</p></div>
                <p className="text-2xl font-bold text-red-700">{errorRows.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-5 h-5 text-yellow-600" /><p className="font-semibold text-yellow-900">Duplicates</p></div>
                <p className="text-2xl font-bold text-yellow-700">{duplicateRows.length}</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Row</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Provider Name</TableHead>
                    <TableHead className="font-semibold text-gray-900">Service Type</TableHead>
                    <TableHead className="font-semibold text-gray-900">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900">Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((row) => {
                    const hasErrors = row.errors.length > 0;
                    const hasDuplicate = row.isDuplicate;
                    return (
                      <TableRow key={row.rowNumber} className={hasErrors ? "bg-red-50" : hasDuplicate ? "bg-yellow-50" : "bg-green-50"}>
                        <TableCell className="font-medium">{row.rowNumber}</TableCell>
                        <TableCell>
                          {hasErrors ? (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
                          ) : hasDuplicate ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />Duplicate</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>
                          )}
                        </TableCell>
                        <TableCell>{row.data.name || "—"}</TableCell>
                        <TableCell className="capitalize">{row.data.serviceType || "—"}</TableCell>
                        <TableCell className="text-sm">{row.data.email || "—"}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 && <ul className="text-sm text-red-700 list-disc list-inside">{row.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                          {row.warnings.length > 0 && <ul className="text-sm text-yellow-700 list-disc list-inside">{row.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
                          {row.errors.length === 0 && row.warnings.length === 0 && <span className="text-sm text-gray-500">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}><X className="w-4 h-4 mr-2" />Cancel</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0 || isImporting} className="bg-green-600 hover:bg-green-700 text-white">
                <Upload className="w-4 h-4 mr-2" />{isImporting ? "Importing..." : `Import ${validRows.length} Valid Row(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">CSV Format Guidelines</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Required columns:</strong> Name, Service Type, Location, ZIP, Phone, Email, Cost, Languages</p>
          <p><strong>Optional columns:</strong> Organization, Website, Populations Served, Insurance, License Number, Specializations</p>
          <p><strong>Service types:</strong> evaluator, tutor, advocate, therapist</p>
          <p><strong>Multi-value fields:</strong> Separate multiple values with semicolons (;)</p>
          <p><strong>Duplicates:</strong> Providers with matching name and email will be flagged as duplicates</p>
          <p className="pt-2 font-semibold">Tip: Export existing data to see the correct format, then modify and re-import.</p>
        </div>
      </div>
    </div>
  );
}
