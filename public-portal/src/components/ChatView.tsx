"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send, RotateCcw, Phone, BookOpen, GraduationCap,
  Users, FileText, Briefcase, ArrowLeft, MapPin, Info, Mail,
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

// Role-specific quick actions 
const QUICK_ACTIONS: Record<string, { label: string; icon: any; message: string }[]> = {
  myself: [
    { label: "Reading & Dyslexia", icon: BookOpen, message: "I'm an adult with reading difficulties or dyslexia and I'm looking for support for myself. Can you ask me a few questions to help find the right resources?" },
    { label: "Find a Tutor", icon: GraduationCap, message: "I'm looking for a specialized tutor for myself. Can you ask me about my subject needs, location, and budget to find the best match?" },
    { label: "Get Evaluated", icon: Users, message: "I'd like to get a learning disability evaluation for myself. Can you ask me a few questions about my situation and location to help me find the right evaluator?" },
    { label: "Workplace Support", icon: Briefcase, message: "I need help understanding my rights and getting accommodations for a learning disability in my workplace. Can you guide me through the process?" },
    { label: "College Accommodations", icon: FileText, message: "I'm a college student with a learning disability and need help getting academic accommodations. What do I need to know and do?" },
  ],
  child: [
    { label: "IEP or 504 Plan", icon: FileText, message: "I'm a parent and I need help understanding and navigating the IEP or 504 Plan process for my child. Can you ask me some questions about my child's situation and school?" },
    { label: "Find a Tutor", icon: GraduationCap, message: "I'm looking for a specialized tutor for my child with a learning disability. Can you ask me about their age, subject needs, location, and our budget?" },
    { label: "Get My Child Evaluated", icon: Users, message: "I'd like to get my child evaluated for a learning disability. Can you ask me about their age, current challenges, and location to help find the right evaluator?" },
    { label: "Reading Help", icon: BookOpen, message: "My child is struggling with reading and may have dyslexia. Can you ask me about their age and situation and suggest the best resources?" },
    { label: "School Accommodations", icon: Briefcase, message: "I need help getting school accommodations for my child with a learning disability. What are my rights and how do I start the process?" },
  ],
  other: [
    { label: "Find a Provider", icon: Users, message: "I'm helping someone with a learning disability find support services. Can you ask me a few questions about their needs, age, and location to suggest the right providers?" },
    { label: "IEP or 504 Help", icon: FileText, message: "I'm helping navigate the IEP or 504 Plan process for someone I support. Can you walk me through the key steps and ask about their situation?" },
    { label: "Evaluation Resources", icon: GraduationCap, message: "I'm helping someone get evaluated for a learning disability. Can you ask me about their age and location to find the right evaluator?" },
    { label: "Reading Support", icon: BookOpen, message: "I'm helping someone who struggles with reading and may have dyslexia. Can you ask me about their situation and suggest appropriate support?" },
    { label: "Workplace Rights", icon: Briefcase, message: "I'm helping someone understand their rights and get accommodations for a learning disability at work. What should they know?" },
  ],
};

// Draft email modal
function ContactModal({ userType, onClose }: { userType: string; onClose: () => void }) {
  const roleContext = ROLE_LABEL[userType] || "someone";
  const subject = encodeURIComponent("Inquiry about LDA of PA Support Services");
  const body = encodeURIComponent(
    `Dear LDA of PA Team,\n\nI hope this message finds you well. I am reaching out to inquire about support services and resources available through LDA of PA.\n\nI am seeking help for ${roleContext} regarding learning disability support. I would appreciate guidance on the following:\n\n- Available services and how to access them\n- Next steps for getting an evaluation or finding a provider\n- Any upcoming events or programs that may be relevant\n\nPlease feel free to reach out at your earliest convenience. Thank you for the incredible work you do supporting individuals and families affected by learning disabilities.\n\nBest regards,\n[Your Name]\n[Your Phone Number]`
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Contact LDA of PA</h2>
        <p className="text-gray-600 text-sm mb-4">
          A draft email has been prepared for you. Click the button below to open it in your email app, or copy the details to send manually.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-gray-700 space-y-2">
          <p><span className="font-semibold">To:</span> info@ldapa.org</p>
          <p><span className="font-semibold">Subject:</span> Inquiry about LDA of PA Support Services</p>
          <p><span className="font-semibold">Phone:</span> (484) 487-0300</p>
          <p><span className="font-semibold">Hours:</span> Mon–Fri, 9am–5pm ET</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`mailto:info@ldapa.org?subject=${subject}&body=${body}`}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-semibold text-center flex items-center justify-center gap-2 transition">
            <Mail className="w-4 h-4" />
            Open in Email App
          </a>
          <button
            onClick={onClose}
            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl py-3 font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
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
  const [showContactModal, setShowContactModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Role context
    const contextualText = `[User is seeking help for: ${roleLabel}] ${text}`;

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

      // Send contextual text to backend
      const response = await sendChatMessage(contextualText, history, sessionId || undefined);
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
  }, [inputValue, isLoading, messages, sessionId, roleLabel]);

  const handleFeedback = async (messageId: string, rating: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
    );
    if (sessionId) {
      try { await submitFeedback(messageId, sessionId, rating); } catch {}
    }
  };

  const quickActions = QUICK_ACTIONS[userType] || QUICK_ACTIONS.other;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">

      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm flex-shrink-0">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LDA of PA</h1>
              <p className="text-xs text-gray-400 leading-none">Resource Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/")}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg px-3 sm:px-5 py-2 flex items-center gap-1 sm:gap-2 text-sm sm:text-base transition shadow-md">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Change Role</span>
            </button>
            <button
              onClick={() => { setMessages([]); setSessionId(null); }}
              className="bg-white border-2 border-white/80 text-gray-800 hover:bg-gray-100 font-semibold rounded-lg px-3 sm:px-5 py-2 flex items-center gap-1 sm:gap-2 text-sm sm:text-base transition shadow-md">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Start Over</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-blue-100 p-6 overflow-y-auto flex-shrink-0">
          <RecentTopics topics={recentTopics} />
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Disclaimer */}
          <div className="bg-blue-50 border-b-2 border-blue-200 px-4 sm:px-6 py-3 flex-shrink-0">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Notice:</span> Responses are based on verified LDA of PA directory data. For urgent needs, please contact a specialist.
              </p>
            </div>
          </div>

          {/* Messages — takes all available space */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Welcome to LDA of PA Chat
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto text-base">
                    Ask me anything about learning disabilities, evaluations, IEPs, or finding support providers in Pennsylvania.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[80%] shadow-sm">
                        <p className="text-base leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ) : message.noMatch ? (
                    <NoMatchState />
                  ) : (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-6 py-5 w-full max-w-[85%] shadow-md border border-gray-100">

                        {/* Response content formatted as cards */}
                        <div className="space-y-3">
                          {(() => {
                            const parts = message.content.split(" - ").map(p => p.trim()).filter(p => p.length > 0);
                            return parts.map((part, i) =>
                              i === 0 ? (
                                <p key={i} className="text-base text-gray-800 leading-relaxed">{part}</p>
                              ) : (
                                <div key={i} className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                                  <span className="text-blue-500 font-bold mt-0.5">→</span>
                                  <p className="text-sm text-gray-800 leading-relaxed">{part}</p>
                                </div>
                              )
                            );
                          })()}
                        </div>

                        {/* Escalation card */}
                        {message.escalate && (
                          <div className="mt-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
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
                                  <p><span className="font-medium">Hours:</span> Mon–Fri 9am–5pm ET</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Provider cards */}
                        {message.providers && message.providers.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-base font-bold text-gray-900 mb-3">Recommended Providers</h3>
                            <div className="space-y-3">
                              {message.providers.map((provider) => (
                                <div key={provider.id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <h4 className="text-base font-bold text-gray-900">{provider.name}</h4>
                                    <div className="flex items-center gap-1 bg-green-100 border border-green-400 rounded-full px-3 py-1 flex-shrink-0">
                                      <span className="text-xs font-semibold text-green-700">✓ Verified</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1 mb-3 text-sm text-gray-700">
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
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition">
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

                        {/* Follow-up chips */}
                        {message.followUps && message.followUps.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                              Suggested follow-ups:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.followUps.map((followUp, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSendMessage(followUp)}
                                  className="text-sm bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-full px-4 py-2 hover:bg-blue-100 hover:border-blue-500 font-medium transition">
                                  💬 {followUp}
                                </button>
                              ))}
                            </div>
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

          {/* Quick Actions — role-specific, no redundant bottom bar */}
          <div className="border-t border-blue-100 bg-white px-4 sm:px-6 py-3 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Actions</p>
            <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(action.message)}
                    className="rounded-full border-2 border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-400 px-4 py-3 min-h-[44px] flex items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-800 flex-shrink-0 transition">
                    <Icon className="w-4 h-4 text-blue-500" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Bar — no redundant shortcut buttons */}
          <div className="border-t border-blue-100 bg-white px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="flex flex-row gap-3 items-end max-w-5xl mx-auto">
              <div className="w-48 flex-shrink-0">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Location (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="City or ZIP"
                    className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-400 focus:outline-none h-12"/>
                </div>
              </div>

              <div className="flex-1">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputValue); }}}
                  placeholder="Ask a question…"
                  className="w-full text-base p-3 rounded-xl border-2 border-gray-300 focus:border-blue-400 focus:outline-none h-12"/>
              </div>

              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-5 h-12 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition flex-shrink-0">
                <Send className="w-5 h-5" />
              </button>

              {/* Contact button — opens draft email modal */}
              <button
                onClick={() => setShowContactModal(true)}
                className="border-2 border-blue-400 text-blue-600 hover:bg-blue-50 rounded-xl px-4 h-12 font-semibold flex items-center gap-2 flex-shrink-0 transition whitespace-nowrap">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Contact LDA of PA</span>
              </button>
            </div>
          </div>

        </main>
      </div>

      {selectedProvider && (
        <ProviderModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
      )}

      {showContactModal && (
        <ContactModal userType={userType} onClose={() => setShowContactModal(false)} />
      )}
    </div>
  );
}
