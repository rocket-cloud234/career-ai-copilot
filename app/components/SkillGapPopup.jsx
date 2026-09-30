"use client";

export default function SkillGapPopup({
  show,
  isClosing,
  skillGapData,
  setSkillGapData,
  skillGapResume,
  onResumeSelect,
  onRemoveResume,
  fileInputRef,
  onClose,
  onAnalyze,
}) {
  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm ${
        isClosing
          ? "animate-profile-backdrop-out"
          : "animate-profile-backdrop-in"
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-xl border border-zinc-800 bg-[#111114] p-4 shadow-2xl ${
          isClosing ? "animate-profile-popup-out" : "animate-profile-popup-in"
        }`}
      >
        {/* HEADER */}{" "}
        <div className="mb-4">
          {" "}
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-[#18181b]">
            {" "}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              {" "}
              <path
                d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                fill="white"
              />{" "}
            </svg>{" "}
          </div>
          <h2 className="text-base font-semibold text-white">
            Analyze your skill gap
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Tell me where you want to go and what you know. I&apos;ll identify
            the skills you need to reach your goal.
          </p>
        </div>
        {/* TARGET ROLE */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
            Target career / job role
          </label>

          <input
            value={skillGapData.targetRole}
            onChange={(e) =>
              setSkillGapData((prev) => ({
                ...prev,
                targetRole: e.target.value,
              }))
            }
            placeholder="e.g. AI/ML Engineer"
            className="w-full rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </div>
        {/* RESUME */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
            Resume
            <span className="ml-1 text-zinc-600">
              (optional if you enter skills)
            </span>
          </label>

          {!skillGapResume ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-[#0c0c0f] px-3 py-2.5 text-xs text-zinc-400 transition hover:border-zinc-500 hover:bg-[#111114] hover:text-white"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M12 16V4" />
                  <path d="M7 9l5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
                Upload your resume
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={onResumeSelect}
                className="hidden"
              />
            </>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-[#0c0c0f] p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-[#18181b]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-200">
                      {skillGapResume.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {(skillGapResume.size / 1024 / 1024).toFixed(2)} MB · PDF
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onRemoveResume}
                  className="text-[11px] text-zinc-500 transition hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
        {/* CURRENT SKILLS */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
            Current skills
          </label>

          <textarea
            value={skillGapData.currentSkills}
            onChange={(e) =>
              setSkillGapData((prev) => ({
                ...prev,
                currentSkills: e.target.value,
              }))
            }
            placeholder="e.g. I know Python, basic ML and some React..."
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </div>
        {/* BACKGROUND */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
            Background
            <span className="ml-1 text-zinc-600">(optional)</span>
          </label>

          <textarea
            value={skillGapData.background}
            onChange={(e) =>
              setSkillGapData((prev) => ({
                ...prev,
                background: e.target.value,
              }))
            }
            placeholder="e.g. I'm a 3rd year computer science student..."
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-zinc-600"
          />
        </div>
        {/* BUTTONS */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={onAnalyze}
            disabled={
              !skillGapData.targetRole.trim() ||
              (!skillGapResume && !skillGapData.currentSkills.trim())
            }
            className="flex-1 rounded-lg bg-white px-3 py-2.5 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Analyze Skill Gap →
          </button>
        </div>
      </div>
    </div>
  );
}
