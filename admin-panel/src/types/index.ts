export type Provider = {
  id: string;
  name: string;
  organization?: string;
  serviceType: string;
  location: string;
  zip: string;
  cost: string;
  lastVerified: string;
  nextVerificationDue: string;
  status: "verified" | "pending" | "needs-update" | "archived";
  phone: string;
  email: string;
  website?: string;
  languages: string[];
  notes?: string;
  populationsServed?: string[];
  insurance?: string[];
  licenseNumber?: string;
  specializations?: string[];
  verifiedBy?: string;
  verificationNotes?: string;
  visibleToLLM: boolean;
  createdDate: string;
  modifiedDate: string;
  profileImage?: string;
  views?: number;
  referrals?: number;
};

export type VerificationRecord = {
  id: string;
  providerId: string;
  date: string;
  staffMember: string;
  action: string;
  notes?: string;
};

export type AuditLogEntry = {
  id: string;
  providerId: string;
  providerName: string;
  staffMember: string;
  action: "created" | "edited" | "verified" | "archived" | "restored" | "rejected" | "approved";
  timestamp: string;
  changes?: string;
  notes?: string;
};

export type PendingReview = {
  id: string;
  providerId: string;
  provider: Provider;
  previousVersion?: Partial<Provider>;
  submittedDate: string;
  priority: "high" | "medium" | "low";
  reason: string;
  changedFields?: string[];
};

export type ValidationError = {
  field: string;
  message: string;
};
