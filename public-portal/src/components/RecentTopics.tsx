"use client";

export function RecentTopics({ topics }: { topics: string[] }) {
  if (topics.length === 0) return (
    <div>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
        Recent Topics
      </h3>
      <p className="text-sm text-gray-400">Your recent questions will appear here.</p>
    </div>
  );

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
        Recent Topics
      </h3>
      <ul className="space-y-2">
        {topics.map((topic, index) => (
          <li key={index} className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2 truncate">
            {topic}
          </li>
        ))}
      </ul>
    </div>
  );
}
