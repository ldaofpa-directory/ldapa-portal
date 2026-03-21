"use client";

import { useRouter } from "next/navigation";
import { User, Baby, Users } from "lucide-react";

export default function UserTypeSelection() {
  const router = useRouter();

  const handleSelection = (userType: "myself" | "child" | "other") => {
    router.push(`/chat?userType=${userType}`);
  };

  const options = [
    {
      type: "myself" as const,
      icon: User,
      label: "Myself",
      description: "I'm looking for support for my own learning needs",
    },
    {
      type: "child" as const,
      icon: Baby,
      label: "My Child",
      description: "I'm a parent or caregiver seeking help for my child",
    },
    {
      type: "other" as const,
      icon: Users,
      label: "Someone Else",
      description: "I'm helping another family member or student",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">

      <header className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">L</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                LDA of PA Resource Assistant
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full">

          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome! Let's get started.
            </h2>
            <p className="text-2xl text-gray-700">I'm here for:</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => handleSelection(option.type)}
                  className="bg-white rounded-2xl border-2 border-blue-200 p-8 hover:bg-blue-50 hover:border-blue-400 hover:shadow-xl transition-all duration-200 text-center group">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {option.label}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600">
              Questions? Contact LDAPA directly at{" "}
              <a href="mailto:info@ldapa.org" className="text-blue-500 underline hover:text-blue-600">
                info@ldapa.org
              </a>
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}

// import Link from "next/link";
// import { useRouter } from "next/navigation";

// const quickStartCards = [
//   {
//     title: "My child is struggling in school",
//     description: "Get guidance on evaluations, IEPs, and support services for your child.",
//     icon: "📚",
//     prompt: "My child is struggling in school and I'm not sure what to do. Can you help?",
//   },
//   {
//     title: "I think I may have a learning disability",
//     description: "Learn about adult evaluations and workplace accommodations.",
//     icon: "🧠",
//     prompt: "I think I may have a learning disability. Where do I start?",
//   },
//   {
//     title: "I'm a teacher looking for resources",
//     description: "Find tools and providers to support students with learning differences.",
//     icon: "🎓",
//     prompt: "I'm a teacher looking for resources to help students with learning disabilities.",
//   },
//   {
//     title: "I need an affordable evaluation",
//     description: "Discover free and low-cost evaluation options in Pennsylvania.",
//     icon: "💰",
//     prompt: "I need an affordable evaluation for a learning disability. What are my options?",
//   },
// ];

// const howItWorks = [
//   {
//     step: "1",
//     title: "Tell us what you need",
//     description: "Start a conversation or pick a quick-start topic. No jargon required.",
//   },
//   {
//     step: "2",
//     title: "Get personalized guidance",
//     description: "Our AI guide explains your options in plain language and answers your questions.",
//   },
//   {
//     step: "3",
//     title: "Find the right provider",
//     description: "Get matched with verified providers in Pennsylvania based on your needs and location.",
//   },
// ];

// export default function LandingPage() {
//   const router = useRouter();

//   const handleQuickStart = (prompt: string) => {
//     const encoded = encodeURIComponent(prompt);
//     router.push(`/chat?prompt=${encoded}`);
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Navbar */}
//       <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
//         <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
//           <div className="flex items-center gap-2">
//             <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
//               L
//             </div>
//             <span className="text-xl font-bold text-gray-900">LDAPA</span>
//           </div>
//           <Link
//             href="/chat"
//             className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
//           >
//             Start Chat
//           </Link>
//         </div>
//       </nav>

//       {/* Hero */}
//       <section className="bg-gradient-to-b from-blue-50 to-white px-4 py-20 text-center">
//         <div className="mx-auto max-w-3xl">
//           <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
//             Find Learning Disability Support in Pennsylvania
//           </h1>
//           <p className="mb-8 text-lg text-gray-600">
//             LDAPA&apos;s intelligent guide helps you understand learning
//             disabilities, navigate the system, and connect with verified
//             providers — all in plain language.
//           </p>
//           <Link
//             href="/chat"
//             className="inline-block rounded-lg bg-blue-600 px-8 py-3.5 text-base font-medium text-white transition hover:bg-blue-700"
//           >
//             Start a Conversation
//           </Link>
//         </div>
//       </section>

//       {/* Quick Start Cards */}
//       <section className="px-4 py-16">
//         <div className="mx-auto max-w-6xl">
//           <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
//             How can we help?
//           </h2>
//           <p className="mb-10 text-center text-gray-600">
//             Choose a topic to get started, or start a free-form conversation.
//           </p>
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             {quickStartCards.map((card) => (
//               <button
//                 key={card.title}
//                 onClick={() => handleQuickStart(card.prompt)}
//                 className="group rounded-xl border border-gray-200 p-6 text-left transition hover:border-blue-300 hover:shadow-md"
//               >
//                 <div className="mb-3 text-3xl">{card.icon}</div>
//                 <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-blue-600">
//                   {card.title}
//                 </h3>
//                 <p className="text-sm text-gray-500">{card.description}</p>
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* How It Works */}
//       <section className="bg-gray-50 px-4 py-16">
//         <div className="mx-auto max-w-4xl">
//           <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">
//             How it works
//           </h2>
//           <div className="grid gap-8 sm:grid-cols-3">
//             {howItWorks.map((item) => (
//               <div key={item.step} className="text-center">
//                 <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
//                   {item.step}
//                 </div>
//                 <h3 className="mb-2 font-semibold text-gray-900">
//                   {item.title}
//                 </h3>
//                 <p className="text-sm text-gray-600">{item.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* About Section */}
//       <section className="px-4 py-16">
//         <div className="mx-auto max-w-3xl text-center">
//           <h2 className="mb-4 text-2xl font-bold text-gray-900">
//             About LDAPA
//           </h2>
//           <p className="mb-4 text-gray-600">
//             The Learning Disabilities Association of Pennsylvania (LDAPA) is
//             dedicated to helping individuals with learning disabilities and
//             their families. We provide resources, advocacy, and support to
//             ensure everyone has access to the help they need.
//           </p>
//           <p className="text-gray-600">
//             This portal is designed to make it easier for families, adults,
//             educators, and caregivers to find verified providers and understand
//             the options available to them — all in one place.
//           </p>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="border-t border-gray-200 bg-gray-50 px-4 py-8">
//         <div className="mx-auto max-w-6xl">
//           <div className="mb-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
//             <div className="flex items-center gap-2">
//               <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
//                 L
//               </div>
//               <span className="font-semibold text-gray-900">LDAPA</span>
//             </div>
//             <div className="text-sm text-gray-500">
//               Contact:{" "}
//               <a href="mailto:info@ldapa.org" className="text-blue-600 hover:underline">
//                 info@ldapa.org
//               </a>
//             </div>
//           </div>
//           <p className="text-center text-xs text-gray-400">
//             This tool provides general information only. It does not diagnose
//             conditions or provide legal or medical advice. Please consult a
//             qualified professional for specific guidance.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }
