"use client";

import { CheckCircle2 } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  organization: string;
  serviceType: string;
  location: string;
  cost: string;
  phone: string;
  website: string;
  verified: boolean;
  verifiedDate: string;
}

export function ProviderModal({
  provider,
  onClose,
}: {
  provider: Provider;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{provider.name}</h2>
            <p className="text-gray-600">{provider.organization}</p>
          </div>
          {provider.verified && (
            <div className="flex items-center gap-1 bg-green-100 border border-green-400 rounded-full px-3 py-1">
              <CheckCircle2 className="w-4 h-4 text-green-700" />
              <span className="text-sm font-semibold text-green-700">Verified</span>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-gray-700"><span className="font-semibold">Service:</span> {provider.serviceType}</p>
          <p className="text-gray-700"><span className="font-semibold">Location:</span> {provider.location}</p>
          <p className="text-gray-700"><span className="font-semibold">Cost:</span> {provider.cost}</p>
          {provider.phone && (
            <p className="text-gray-700">
              <span className="font-semibold">Phone:</span>{" "}
              <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline">
                {provider.phone}
              </a>
            </p>
          )}
          {provider.website && (
            <p className="text-gray-700">
              <span className="font-semibold">Website:</span>{" "}
              <a href={`https://${provider.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {provider.website}
              </a>
            </p>
          )}
          {provider.verified && (
            <p className="text-sm text-gray-400">Verified: {provider.verifiedDate}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-semibold transition">
          Close
        </button>
      </div>
    </div>
  );
}
