"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send, RotateCcw, Phone, BookOpen, GraduationCap,
  Users, FileText, Briefcase, ArrowLeft, MapPin, Info,
} from "lucide-react";
import { sendChatMessage, submitFeedback, type ChatMessage, type ProviderCard } from "@/lib/api";
import { ProviderModal } from "./ProviderModal";
import { NoMatchState } from "./NoMatchState";
import { RecentTopics } from "./RecentTopics";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  providers?: ProviderCard[];
  escalate?: boolean;
  feedback?: "up" | "down" | null;
  noMatch?: boolean;
  followUps?: string[];
}

interface ProviderModalType {
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

const ROLE_LABEL: Record<string, string> = {
  myself: "yourself",
  child: "your child",
  other: "someone else",
};

const FOLLOW_UPS: Record<string, string[]> = {
  tutor: [
    "What's the typical cost for a tutor?",
    "Are there online tutoring options?",
    "How do I know if a tutor is right for us?",
  ],
  evaluation: [
    "How long does an evaluation take?",
    "Does insurance cover evaluations?",
    "What happens after the evaluation?",
  ],
  iep: [
    "What's the difference between an IEP and a 504 Plan?",
    "Can I request an IEP meeting anytime?",
    "What rights do I have in the IEP process?",
  ],
  reading: [
    "What is the Orton-Gillingham method?",
    "How early should I get help for reading issues?",
    "Are there apps that can help with reading?",
  ],
  workplace: [
    "How do I request accommodations at work?",
    "Does my employer have to keep this confidential?",
    "What accommodations are most common for LD?",
  ],
  default: [
    "Can you help me find a local provider?",
    "What services does LDA of PA offer?",
    "How do I get started?",
  ],
};

function getFollowUps(message: string): string[] {
  const lower = message.toLowerCase();
  if (lower.includes("tutor")) return FOLLOW_UPS.tutor;
  if (lower.includes("eval") || lower.includes("assess")) return FOLLOW_UPS.evaluation;
  if (lower.includes("iep") || lower.includes("504")) return FOLLOW_UPS.iep;
  if (lower.includes("read") || lower.includes("dyslexia")) return FOLLOW_UPS.reading;
  if (lower.includes("work") || lower.includes("job") || lower.includes("college")) return FOLLOW_UPS.workplace;
  return FOLLOW_UPS.default;
}

export function ChatView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get("userType") || "other";
  const roleLabel = ROLE_LABEL[userType] || "someone";

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderModalType | null>(null);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    if (!recentTopics.includes(text)) {
      setRecentTopics((prev) => [text, ...prev.slice(0, 4)]);
    }

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(text, history, sessionId || undefined);
      setSessionId(response.session_id);

      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.response,
        providers: response.providers,
        escalate: response.escalate,
        feedback: null,
        followUps: getFollowUps(text),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again or contact LDA of PA directly at info@ldapa.org.",
        feedback: null,
        followUps: FOLLOW_UPS.default,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, sessionId]);

  // Leading question builder for quick action buttons
  const buildLeadingMessage = (actionLabel: string): string => {
    const lower = actionLabel.toLowerCase();
    const role = roleLabel;

    if (lower.includes("tutor")) {
      return `I'm looking for a tutor for ${role}. Before you suggest options, could you ask me a few questions to help find the right match? For example, location, age, subject area, and budget.`;
    }
    if (lower.includes("evaluation")) {
      return `I'd like to get an evaluation for ${role}. Could you ask me some questions first to understand the situation better — like age, specific concerns, and location?`;
    }
    if (lower.includes("iep") || lower.includes("504")) {
      return `I need help with an IEP or 504 Plan for ${role}. Could you ask me a few questions to understand where we are in the process and what kind of help we need?`;
    }
    if (lower.includes("reading") || lower.includes("dyslexia")) {
      return `I'm looking for reading support for ${role}. Before suggesting resources, could you ask me about the specific challenges, age, and location?`;
    }
    if (lower.includes("workplace") || lower.includes("college") || lower.includes("accommodation")) {
      return `I need help with workplace or college accommodations for ${role}. Could you ask me a few questions first — like the type of environment, specific challenges, and what accommodations have been tried?`;
    }
    if (lower.includes("provider")) {
      return `I'm looking for a service provider for ${role}. Could you ask me a few questions to narrow it down — like location, type of service needed, age, and budget?`;
    }
    // fallback
    return `I'm looking for help for ${role} regarding: ${actionLabel}. Could you ask me a few questions to better understand the situation before suggesting resources?`;
  };

  const handleFeedback = async (messageId: string, rating: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
    );
    if (sessionId) {
      try {
        await submitFeedback(messageId, sessionId, rating);
      } catch {}
    }
  };

  const getQuickActions = () => {
    if (userType === "myself") {
      return [
        { label: "Help with reading", icon: BookOpen },
        { label: "Find a tutor", icon: GraduationCap },
        { label: "Get an evaluation", icon: Users },
        { label: "Workplace accommodations", icon: Briefcase },
        { label: "College support", icon: FileText },
      ];
    } else if (userType === "child") {
      return [
        { label: "Help my child with reading", icon: BookOpen },
        { label: "Find a tutor for my child", icon: GraduationCap },
        { label: "Get an evaluation for my child", icon: Users },
        { label: "IEP or 504 Plan help", icon: FileText },
        { label: "School accommodations", icon: Briefcase },
      ];
    } else {
      return [
        { label: "Help with reading", icon: BookOpen },
        { label: "Find a tutor", icon: GraduationCap },
        { label: "Get an evaluation", icon: Users },
        { label: "IEP or 504 Plan help", icon: FileText },
        { label: "Workplace accommodations", icon: Briefcase },
      ];
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">

      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LDA of PA</h1>
              <p className="text-xs text-gray-400 leading-none">Resource Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-semibold rounded-lg px-4 py-2 flex items-center gap-2 transition">
              <ArrowLeft className="w-4 h-4" />
              Change Role
            </button>
            <button
              onClick={() => { setMessages([]); setSessionId(null); }}
              className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-semibold rounded-lg px-4 py-2 flex items-center gap-2 transition">
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-blue-100 p-6 overflow-y-auto">
          <RecentTopics topics={recentTopics} />
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">

          {/* Disclaimer */}
          <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-3 flex-shrink-0">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-base text-blue-900">
                <span className="font-semibold">Notice:</span> Responses are based on verified LDA of PA directory data. For urgent needs, please contact a specialist.
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome to LDA of PA Chat
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Ask me anything about learning disabilities, evaluations, IEPs, or finding support providers.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-blue-400 text-white rounded-2xl rounded-tr-sm px-6 py-4 max-w-2xl shadow-sm">
                        <p className="text-lg leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ) : message.noMatch ? (
                    <NoMatchState />
                  ) : (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-6 py-5 max-w-2xl shadow-md border border-gray-100">
                        <p className="text-lg text-gray-800 leading-relaxed mb-4">{message.content}</p>

                        {message.escalate && (
                          <div className="my-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">⚠️</span>
                              <div>
                                <h4 className="font-semibold text-amber-900">Contact LDA of PA Directly</h4>
                                <p className="mt-1 text-sm text-amber-800">This is best handled by a person.</p>
                                <div className="mt-3 space-y-1 text-sm">
                                  <p><span className="font-medium">Phone:</span> (484) 487-0300</p>
                                  <p><span className="font-medium">Email:</span>{" "}
                                    <a href="mailto:info@ldapa.org" className="text-blue-600 hover:underline">info@ldapa.org</a>
                                  </p>
                                  <p><span className="font-medium">Hours:</span> Mon-Fri 9am-5pm ET</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {message.providers && message.providers.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Recommended Providers</h3>
                            <div className="space-y-3">
                              {message.providers.map((provider) => (
                                <div key={provider.id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900">{provider.name}</h4>
                                    <div className="flex items-center gap-1 bg-green-100 border border-green-400 rounded-full px-3 py-1 flex-shrink-0">
                                      <span className="text-sm font-semibold text-green-700">✓ Verified</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1 mb-3 text-base text-gray-700">
                                    <p><span className="font-semibold">Location:</span> {provider.city}</p>
                                    <p><span className="font-semibold">Cost:</span> {provider.cost_tier}</p>
                                  </div>
                                  <button
                                    onClick={() => setSelectedProvider({
                                      id: provider.id,
                                      name: provider.name,
                                      organization: provider.organization || "",
                                      serviceType: provider.service_types?.join(", ") || "",
                                      location: provider.city,
                                      cost: provider.cost_tier,
                                      phone: provider.phone || "",
                                      website: provider.website || "",
                                      verified: true,
                                      verifiedDate: "2026",
                                    })}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 py-2 font-semibold transition">
                                    Learn More
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        {sessionId && (
                          <div className="mt-3 flex items-center gap-1">
                            <button
                              onClick={() => handleFeedback(message.id, "up")}
                              className={`rounded p-1 text-sm transition ${message.feedback === "up" ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-gray-100"}`}>
                              👍
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, "down")}
                              className={`rounded p-1 text-sm transition ${message.feedback === "down" ? "bg-red-100 text-red-700" : "text-gray-400 hover:bg-gray-100"}`}>
                              👎
                            </button>
                          </div>
                        )}

                        {/* Follow-up suggestion chips */}
                        {message.followUps && message.followUps.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {message.followUps.map((followUp, i) => (
                              <button
                                key={i}
                                onClick={() => handleSendMessage(followUp)}
                                className="text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-4 py-1.5 hover:bg-blue-100 hover:border-blue-400 transition">
                                💬 {followUp}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-blue-100 bg-white px-6 py-4 flex-shrink-0">
            <p className="text-base font-semibold text-gray-700 mb-3">Quick Actions</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {getQuickActions().map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(buildLeadingMessage(action.label))}
                    className="rounded-full border-2 border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-400 px-5 py-2 flex items-center gap-2 whitespace-nowrap font-medium text-gray-800 flex-shrink-0 transition">
                    <Icon className="w-4 h-4 text-blue-500" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t border-blue-100 bg-white px-6 py-5 flex-shrink-0">
            <div className="flex gap-3 mb-4">
              {["Find a Provider", "General Info", "Legal & Eval Info"].map((label) => (
                <button
                  key={label}
                  onClick={() => handleSendMessage(buildLeadingMessage(label))}
                  className="rounded-full border-2 border-blue-400 bg-white hover:bg-blue-50 px-5 py-2 font-semibold text-blue-600 flex-shrink-0 transition">
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-end">
              <div className="w-48">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Location (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="City or ZIP"
                    className="w-full text-base pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-400 focus:outline-none h-14"/>
                </div>
              </div>

              <div className="flex-1">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputValue); }}}
                  placeholder="Ask a question…"
                  className="w-full text-lg p-4 rounded-xl border-2 border-gray-300 focus:border-blue-400 focus:outline-none h-14"/>
              </div>

              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 h-14 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition">
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => handleSendMessage("I need to speak with a person at LDA of PA")}
                className="border-2 border-blue-400 text-blue-600 hover:bg-blue-50 rounded-lg px-6 py-2 font-semibold flex items-center gap-2 mx-auto transition">
                <Phone className="w-4 h-4" />
                Contact LDA of PA
              </button>
            </div>
          </div>

        </main>
      </div>

      {selectedProvider && (
        <ProviderModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
      )}
    </div>
  );
}