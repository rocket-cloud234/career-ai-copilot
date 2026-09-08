"use client";

export default function MainSidebar({
  roadmaps = [],
  selectedRoadmapId = null,
  onRoadmapSelect,
  onNewChat,
  targetCareer,
  onOpenProfile,
  profile,
}) {
  return (
    <aside className="flex w-[270px] shrink-0 flex-col border-r border-zinc-800/70 bg-[#09090a]">
      {/* =========================================================
          SIDEBAR HEADER
      ========================================================= */}
      <div className="flex h-[64px] items-center justify-between border-b border-zinc-800/60 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-black"
              aria-hidden="true"
            >
              <path d="M12 2l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-2.8L12 2z" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              CareerAI
            </p>

            <p className="text-[11px] text-zinc-500">
              Career Assistant
            </p>
          </div>
        </div>

      
      </div>

      {/* =========================================================
          SIDEBAR CONTENT
      ========================================================= */}
      <div className="sidebar-scrollbar flex-1 overflow-y-auto px-3 py-4">

        {/* =======================================================
            NEW CHAT
        ======================================================= */}
        <button
          type="button"
          onClick={onNewChat}
          className="group mb-6 flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-3 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-lg text-zinc-300 transition group-hover:bg-zinc-700">
              +
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-200">
                New chat
              </p>

              <p className="text-[11px] text-zinc-500">
                Start something new
              </p>
            </div>
          </div>

          <span className="rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
            Ctrl K
          </span>
        </button>

        {/* =======================================================
            ROADMAPS
        ======================================================= */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Your Roadmaps
            </p>

           
          </div>

          <div className="space-y-1">
            {roadmaps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-center">
                <p className="text-xs text-zinc-600">
                  No roadmaps yet
                </p>
              </div>
            ) : (
              roadmaps.map((roadmap) => {
                const isActive =
                  roadmap.id === selectedRoadmapId;

                return (
                  <button
                    key={`roadmap-${roadmap.id}`}
                    type="button"
                    onClick={() =>
                      onRoadmapSelect?.(roadmap.id)
                    }
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      isActive
                        ? "border-zinc-800 bg-zinc-900"
                        : "border-transparent hover:bg-zinc-900/70"
                    }`}
                  >
                    {/* Roadmap Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${
                        isActive
                          ? "bg-white text-black"
                          : "bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300"
                      }`}
                    >
                      {isActive ? "✓" : "◆"}
                    </div>

                    {/* Roadmap Information */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          isActive
                            ? "font-medium text-zinc-100"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        }`}
                      >
                        {roadmap.topic}
                      </p>

                      {/* Status */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            roadmap.completed
                              ? "bg-emerald-400"
                              : isActive
                              ? "bg-emerald-400"
                              : "bg-zinc-700"
                          }`}
                        />

                        <span className="text-[10px] text-zinc-600">
                          {roadmap.completed
                            ? "Completed"
                            : isActive
                            ? "In progress"
                            : "Not started"}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <span
                      className={`text-sm text-zinc-600 transition ${
                        isActive
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      }`}
                    >
                      ›
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =======================================================
            PROFILE
        ======================================================= */}
        <div className="mb-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            Profile
          </p>

          <button
            type="button"
            onClick={onOpenProfile}
            className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-zinc-800 hover:bg-zinc-900/70"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-semibold text-zinc-200 ring-1 ring-zinc-700">
              VS
            </div>

            {/* Profile Information */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">
                About you
              </p>

              <p className="truncate text-[11px] text-zinc-600">
                Skills · Interests · Background
              </p>
            </div>

            {/* Arrow */}
            <span className="text-zinc-700 transition group-hover:text-zinc-400">
              ›
            </span>
          </button>
        </div>

        {/* =======================================================
            TARGET CAREER
        ======================================================= */}
        <button
          type="button"
          className="group mt-2 w-full rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Target Career
              </p>

              <p className="mt-1.5 truncate text-sm font-medium text-zinc-200">
                {profile.targetCareer || "Not set"}
              </p>

              <p className="mt-1 text-[11px] text-zinc-600">
                Your current career goal
              </p>
            </div>

            <div className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 transition group-hover:text-zinc-300">
              →
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">
                Progress
              </span>

              <span className="text-[10px] font-medium text-zinc-400">
                0%
              </span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-[0%] rounded-full bg-white" />
            </div>
          </div>
        </button>
      </div>

      {/* =========================================================
          SIDEBAR FOOTER
      ========================================================= */}
      <div className="border-t border-zinc-800/60 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-zinc-900">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
            V
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-300">
              {profile.name || ""}
            </p>

            <p className="text-[11px] text-zinc-600">
              CareerAI user
            </p>
          </div>

          <button
            type="button"
            aria-label="More options"
            className="rounded-lg px-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-white"
          >
            •••
          </button>
        </div>
      </div>
    </aside>
  );
}

