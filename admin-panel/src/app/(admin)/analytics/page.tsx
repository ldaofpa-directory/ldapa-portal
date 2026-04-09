"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, MessageSquare, Users, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { getDashboardStats, getChatVolume, getProviders } from "@/lib/api";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("week");
  const [stats, setStats] = useState<{
    total_providers: number;
    verified: number;
    unverified: number;
    archived: number;
    chat_sessions: number;
    avg_feedback: number;
    top_themes: string[];
  } | null>(null);
  const [chatVolume, setChatVolume] = useState<{ date: string; count: number }[]>([]);
  const [professionBreakdown, setProfessionBreakdown] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsData, volumeData] = await Promise.all([
          getDashboardStats(timeRange),
          getChatVolume(timeRange),
        ]);
        setStats(statsData);
        setChatVolume(volumeData.data || []);

        // Fetch profession breakdown
        const professions = ["Tutor", "Health_Professional", "Lawyer", "School", "Advocate"];
        const counts = await Promise.all(
          professions.map(async (p) => {
            try {
              const data = await getProviders({ profession: p, per_page: 1 });
              return { name: p.replace("_", " "), count: data.total };
            } catch {
              return { name: p.replace("_", " "), count: 0 };
            }
          })
        );
        setProfessionBreakdown(counts.filter((c) => c.count > 0));
      } catch (e) {
        console.error("Failed to fetch analytics:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [timeRange]);

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-lg">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />Analytics
            </h1>
            <p className="text-gray-600 mt-2">Provider directory and chat engagement metrics</p>
          </div>
          <div className="w-48">
            <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="time-range"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Providers", value: stats.total_providers.toLocaleString(), sub: `${stats.verified} verified`, color: "bg-blue-100 text-blue-600", Icon: Users },
          { label: "Chat Sessions", value: stats.chat_sessions.toLocaleString(), sub: `${timeRange === "all" ? "All time" : `Last ${timeRange === "today" ? "24h" : timeRange === "week" ? "7 days" : "30 days"}`}`, color: "bg-green-100 text-green-600", Icon: MessageSquare },
          { label: "Avg Feedback", value: `${stats.avg_feedback}/5`, sub: "User satisfaction", color: "bg-purple-100 text-purple-600", Icon: ThumbsUp },
          { label: "Unverified", value: stats.unverified.toLocaleString(), sub: "Awaiting review", color: "bg-orange-100 text-orange-600", Icon: TrendingUp },
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Volume</h3>
          {chatVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chatVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No chat data for this period
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Providers by Type</h3>
          {professionBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={professionBreakdown} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }: { name: string; percent?: number }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100} fill="#8884d8" dataKey="count">
                  {professionBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No provider data
            </div>
          )}
        </div>
      </div>

      {/* Provider Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { name: "Verified", count: stats.verified },
            { name: "Unverified", count: stats.unverified },
            { name: "Archived", count: stats.archived },
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" name="Providers" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Themes */}
      {stats.top_themes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Chat Themes</h3>
          <div className="flex flex-wrap gap-3">
            {stats.top_themes.map((theme, i) => (
              <Badge key={i} variant="outline" className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border-blue-200">
                #{i + 1} {theme}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>About Analytics:</strong> These metrics are derived from real chat sessions and provider directory data. Chat volume tracks active conversations, and feedback reflects user satisfaction ratings.
        </p>
      </div>
    </div>
  );
}
