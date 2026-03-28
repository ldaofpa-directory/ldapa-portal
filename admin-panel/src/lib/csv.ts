import { Provider } from "../types";

export function exportToCSV(providers: Provider[]): string {
  const headers = [
    "ID",
    "Name",
    "Organization",
    "Service Type",
    "Location",
    "ZIP",
    "Phone",
    "Email",
    "Website",
    "Cost",
    "Languages",
    "Populations Served",
    "Insurance",
    "License Number",
    "Specializations",
    "Status",
    "Last Verified",
    "Next Verification Due",
    "Verified By",
    "Visible to LLM",
  ];

  const rows = providers.map((p) => [
    p.id,
    p.name,
    p.organization || "",
    p.serviceType,
    p.location,
    p.zip,
    p.phone,
    p.email,
    p.website || "",
    p.cost,
    p.languages.join("; "),
    p.populationsServed?.join("; ") || "",
    p.insurance?.join("; ") || "",
    p.licenseNumber || "",
    p.specializations?.join("; ") || "",
    p.status,
    p.lastVerified,
    p.nextVerificationDue,
    p.verifiedBy || "",
    p.visibleToLLM ? "Yes" : "No",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export type CSVImportRow = {
  rowNumber: number;
  data: Partial<Provider>;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
};

export function parseCSV(csvText: string, existingProviders: Provider[]): CSVImportRow[] {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  const results: CSVImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVImportRow = {
      rowNumber: i + 1,
      data: {},
      errors: [],
      warnings: [],
      isDuplicate: false,
    };

    // Parse data
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || "";
      switch (header.toLowerCase()) {
        case "name":
          row.data.name = value;
          break;
        case "organization":
          row.data.organization = value;
          break;
        case "service type":
          row.data.serviceType = value.toLowerCase();
          break;
        case "location":
          row.data.location = value;
          break;
        case "zip":
          row.data.zip = value;
          break;
        case "phone":
          row.data.phone = value;
          break;
        case "email":
          row.data.email = value;
          break;
        case "website":
          row.data.website = value;
          break;
        case "cost":
          row.data.cost = value;
          break;
        case "languages":
          row.data.languages = value.split(";").map((l) => l.trim()).filter(Boolean);
          break;
        case "populations served":
          row.data.populationsServed = value.split(";").map((p) => p.trim()).filter(Boolean);
          break;
        case "insurance":
          row.data.insurance = value.split(";").map((i) => i.trim()).filter(Boolean);
          break;
        case "license number":
          row.data.licenseNumber = value;
          break;
        case "specializations":
          row.data.specializations = value.split(";").map((s) => s.trim()).filter(Boolean);
          break;
      }
    });

    // Validate required fields
    if (!row.data.name) {
      row.errors.push("Name is required");
    }
    if (!row.data.serviceType) {
      row.errors.push("Service Type is required");
    } else if (!["evaluator", "tutor", "advocate", "therapist"].includes(row.data.serviceType)) {
      row.errors.push("Invalid service type");
    }
    if (!row.data.email) {
      row.errors.push("Email is required");
    } else if (!isValidEmail(row.data.email)) {
      row.errors.push("Invalid email format");
    }
    if (!row.data.phone) {
      row.errors.push("Phone is required");
    }
    if (!row.data.location) {
      row.errors.push("Location is required");
    }
    if (!row.data.zip) {
      row.errors.push("ZIP code is required");
    }

    // Check for duplicates
    const isDuplicate = existingProviders.some(
      (p) =>
        p.name.toLowerCase() === row.data.name?.toLowerCase() &&
        p.email.toLowerCase() === row.data.email?.toLowerCase()
    );
    if (isDuplicate) {
      row.isDuplicate = true;
      row.warnings.push("Provider with same name and email already exists");
    }

    results.push(row);
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
