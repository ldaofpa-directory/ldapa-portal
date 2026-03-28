"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Clock,
  Settings as SettingsIcon,
  User,
  FileText,
  Upload,
  BarChart3,
} from "lucide-react";
import Image from "next/image";

const navItems = [
  //{ path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/overview", label: "Dashboard", icon: Home },
  { path: "/providers", label: "Provider Directory", icon: Users },
  { path: "/pending-reviews", label: "Pending Reviews", icon: Clock },
  { path: "/audit-log", label: "Audit Log", icon: FileText },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/import-export", label: "Import/Export", icon: Upload },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <aside className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex flex-col items-center bg-white rounded-xl p-4 shadow-lg">
            {/* Replace src with your actual logo path */}
            <img
              src="/lda-logo.png"
              alt="LDA of PA - Learning Disabilities Association of Pennsylvania - Provider Directory Admin"
              className="w-full h-auto object-contain"
              onError={(e) => {
                // Fallback if logo not present
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />

          </div>
        </div>

        <nav className="flex-1 p-4" aria-label="Main navigation">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-[#17789C] to-[#2d7a9e] text-white shadow-lg"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700/50">
            <div className="w-9 h-9 bg-gradient-to-br from-[#17789C] to-[#2d7a9e] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <User className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Staff Admin</p>
              <p className="text-xs text-slate-400">admin@ldaofpa.org</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
