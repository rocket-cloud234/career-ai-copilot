"use client";

export default function ProfilePopup({
  show,
  isClosing,
  profile,
  setProfile,
  onClose,
  onSubmit,
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
          isClosing
            ? "animate-profile-popup-out"
            : "animate-profile-popup-in"
        }`}
      >
        {/* HEADER */}
        <div className="mb-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-[#18181b]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                fill="white"
              />
            </svg>
          </div>

          <h2 className="text-base font-semibold text-white">
            Tell me about yourself
          </h2>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Help CareerAI understand your interests, skills, and background.
          </p>
        </div>

        {/* NAME + AGE */}
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Name
            </label>

            <input
              type="text"
              value={profile.name || ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Your name"
              className="w-full rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>

          <div className="w-20">
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Age
            </label>

            <input
              type="number"
              value={profile.age || ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  age: e.target.value,
                }))
              }
              placeholder="Age"
              className="w-full rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
        </div>

        {/* INTERESTS */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
            Interests
          </label>

          <textarea
            value={profile.interests || ""}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                interests: e.target.value,
              }))
            }
            placeholder="e.g. gaming, drawing, websites..."
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </div>

        {/* CURRENT SKILLS */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
            Current Skills
          </label>

          <textarea
            value={profile.currentSkills || ""}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                currentSkills: e.target.value,
              }))
            }
            placeholder="e.g. Python, React, JavaScript..."
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </div>

        {/* BACKGROUND */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
            Background
          </label>

          <textarea
            value={profile.background || ""}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                background: e.target.value,
              }))
            }
            placeholder="e.g. CS student, web developer..."
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            Skip
          </button>

          <button
            onClick={onSubmit}
            disabled={
              !profile.interests?.trim() &&
              !profile.currentSkills?.trim() &&
              !profile.background?.trim() &&
              !profile.targetCareer?.trim()
            }
            className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Save →
          </button>
        </div>
      </div>
    </div>
  );
}