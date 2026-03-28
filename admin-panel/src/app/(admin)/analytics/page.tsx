"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Eye, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { mockProviders } from "@/lib/mockData";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30");

  const totalViews = mockProviders.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalReferrals = mockProviders.reduce((sum, p) => sum + (p.referrals || 0), 0);
  const avgViews = Math.round(totalViews / mockProviders.length);
  const avgReferrals = Math.round(totalReferrals / mockProviders.length);

  const topProviders = [...mockProviders]
    .sort((a, b) => (b.referrals || 0) - (a.referrals || 0))
    .slice(0, 5)
    .map((p) => ({ name: p.name, referrals: p.referrals || 0, views: p.views || 0 }));

  const byLocation = mockProviders.reduce((acc, p) => {
    const location = p.location.split(",")[0].trim();
    if (!acc[location]) acc[location] = { location, views: 0, referrals: 0, providers: 0 };
    acc[location].views += p.views || 0;
    acc[location].referrals += p.referrals || 0;
    acc[location].providers += 1;
    return acc;
  }, {} as Record<string, { location: string; views: number; referrals: number; providers: number }>);

  const locationData = Object.values(byLocation);

  const byServiceType = mockProviders.reduce((acc, p) => {
    const type = p.serviceType;
    if (!acc[type]) acc[type] = { name: type, views: 0, referrals: 0, providers: 0 };
    acc[type].views += p.views || 0;
    acc[type].referrals += p.referrals || 0;
    acc[type].providers += 1;
    return acc;
  }, {} as Record<string, { name: string; views: number; referrals: number; providers: number }>);

  const serviceTypeData = Object.values(byServiceType).map((item) => ({
    ...item,
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
  }));

  const trendData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${30 - i}`,
    views: Math.floor(Math.random() * 50) + 20,
    referrals: Math.floor(Math.random() * 20) + 5,
  })).reverse();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />Provider Analytics
            </h1>
            <p className="text-gray-600 mt-2">Track provider visibility and engagement through the LLM chat interface</p>
          </div>
          <div className="w-48">
            <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="time-range"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Views", value: totalViews.toLocaleString(), sub: "Across all providers", color: "bg-blue-100 text-blue-600", Icon: Eye },
          { label: "Total Referrals", value: totalReferrals.toLocaleString(), sub: "LLM recommendations", color: "bg-green-100 text-green-600", Icon: TrendingUp },
          { label: "Avg. Views per Provider", value: avgViews, sub: `Based on ${mockProviders.length} providers`, color: "bg-purple-100 text-purple-600", Icon: Eye },
          { label: "Avg. Referrals per Provider", value: avgReferrals, sub: `Conversion rate: ${Math.round((avgReferrals / avgViews) * 100)}%`, color: "bg-orange-100 text-orange-600", Icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.Icon className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-semibold text-gray-900 mb-2">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Views & Referrals Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} name="Views" />
              <Line type="monotone" dataKey="referrals" stroke="#10B981" strokeWidth={2} name="Referrals" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referrals by Service Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={serviceTypeData} cx="50%" cy="50%" labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100} fill="#8884d8" dataKey="referrals">
                {serviceTypeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Bar Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />Provider Activity by Location
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="location" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" fill="#3B82F6" name="Views" />
            <Bar dataKey="referrals" fill="#10B981" name="Referrals" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Providers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />Top Performing Providers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Provider Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Views</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Referrals</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {topProviders.map((provider, index) => (
                <tr key={provider.name} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">#{index + 1}</Badge></td>
                  <td className="py-3 px-4 font-medium text-gray-900">{provider.name}</td>
                  <td className="py-3 px-4 text-gray-600">{provider.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{provider.referrals.toLocaleString()}</td>
                  <td className="py-3 px-4"><span className="text-green-700 font-medium">{provider.views > 0 ? Math.round((provider.referrals / provider.views) * 100) : 0}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Location Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {locationData.map((loc) => (
            <div key={loc.location} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{loc.location}</h4>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">{loc.providers} {loc.providers === 1 ? "provider" : "providers"}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Views:</span><span className="font-medium text-gray-900">{loc.views.toLocaleString()}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Referrals:</span><span className="font-medium text-gray-900">{loc.referrals.toLocaleString()}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Avg per provider:</span><span className="font-medium text-gray-900">{Math.round(loc.referrals / loc.providers)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>About Analytics:</strong> These metrics track how often providers are viewed and referred through the LLM chat interface. Use this data to identify high-demand areas and popular services.
        </p>
      </div>
    </div>
  );
}
