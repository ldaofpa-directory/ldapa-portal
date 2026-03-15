"use client";

export function NoMatchState() {
  return (
    <div className="flex justify-start">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl px-6 py-5 max-w-2xl shadow-md">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="text-lg font-bold text-yellow-900 mb-1">
              No matches found
            </h4>
            <p className="text-base text-yellow-800">
              I couldn't find specific resources matching your request. This might be outside the scope of learning disability support services. Try rephrasing or browse the directory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
