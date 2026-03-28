"use client";

import { useState } from "react";
import { Save, Bell, Database, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Settings saved successfully!");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your LDA of PA Provider Directory preferences</p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-600">Manage how you receive updates</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <Label htmlFor="email-notifications" className="text-sm font-medium text-gray-900">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive email alerts for new providers and updates</p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="pt-2">
                <Label htmlFor="notification-email" className="text-sm font-medium text-gray-700 mb-1 block">Notification Email</Label>
                <Input id="notification-email" type="email" defaultValue="admin@ldaofpa.org" className="max-w-md" />
              </div>
            </div>
          </div>

          {/* Directory Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Directory Settings</h2>
                <p className="text-sm text-gray-600">Configure directory behavior</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <Label htmlFor="auto-sync" className="text-sm font-medium text-gray-900">Auto-Sync with Chat Interface</Label>
                  <p className="text-sm text-gray-600">Automatically sync provider data with the LLM chat interface</p>
                </div>
                <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <Label htmlFor="require-approval" className="text-sm font-medium text-gray-900">Require Approval for New Providers</Label>
                  <p className="text-sm text-gray-600">New providers must be verified before appearing in chat interface</p>
                </div>
                <Switch id="require-approval" checked={requireApproval} onCheckedChange={setRequireApproval} />
              </div>
              <div className="pt-2">
                <Label htmlFor="sync-interval" className="text-sm font-medium text-gray-700 mb-1 block">Sync Interval (minutes)</Label>
                <Input id="sync-interval" type="number" defaultValue="15" min="5" max="120" className="max-w-xs" />
                <p className="text-sm text-gray-500 mt-1">How often to sync data with chat interface</p>
              </div>
              <div className="pt-2">
                <Label htmlFor="verification-interval" className="text-sm font-medium text-gray-700 mb-1 block">Re-Verification Interval (months)</Label>
                <Select defaultValue="6">
                  <SelectTrigger id="verification-interval" className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Every 3 months</SelectItem>
                    <SelectItem value="6">Every 6 months</SelectItem>
                    <SelectItem value="12">Every 12 months</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">How often providers need to be re-verified.</p>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-600">Manage staff access</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="organization-name" className="text-sm font-medium text-gray-700 mb-1 block">Organization Name</Label>
                <Input id="organization-name" type="text" defaultValue="LDA of PA" className="max-w-md" />
              </div>
              <div>
                <Label htmlFor="welcome-message" className="text-sm font-medium text-gray-700 mb-1 block">Staff Welcome Message</Label>
                <Textarea id="welcome-message" rows={3} defaultValue="Welcome to the LDA of PA Provider Directory admin panel. Please verify all provider information before approval." className="max-w-2xl" />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                <p className="text-sm text-gray-600">Security and access settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-timeout" className="text-sm font-medium text-gray-700 mb-1 block">Session Timeout (hours)</Label>
                <Input id="session-timeout" type="number" defaultValue="8" min="1" max="24" className="max-w-xs" />
                <p className="text-sm text-gray-500 mt-1">Automatically log out staff after this period of inactivity</p>
              </div>
              <Button variant="outline" type="button">Change Password</Button>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
