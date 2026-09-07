
"use client";

import { useState } from "react";

export default function RoadmapPopup({
  show,
  isClosing,
  roadmapText,
  onClose,
}) {
  const [openSections, setOpenSections] = useState({});
  const [showJson, setShowJson] = useState(false);

  if (!show) return null;

  // ------------------------------------------
  // GET ROADMAP DATA
  // ------------------------------------------

  let roadmap = roadmapText;

  // If roadmapText is a JSON string, parse it
  if (typeof roadmapText === "string") {
    try {
      roadmap = JSON.parse(roadmapText);
    } catch {
      // Keep original value if it isn't JSON
    }
  }

  // ------------------------------------------
  // SUPPORT API RESPONSE:
  //
  // {
  //   roadmap: {...},
  //   targetCareer: {...}
  // }
  // ------------------------------------------

  if (
    roadmap &&
    typeof roadmap === "object" &&
    roadmap.roadmap
  ) {
    roadmap = roadmap.roadmap;
  }

  // ------------------------------------------
  // SAFETY CHECK
  // ------------------------------------------

  if (
    !roadmap ||
    typeof roadmap !== "object" ||
    !Array.isArray(roadmap.stages)
  ) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ${
          isClosing
            ? "animate-fade-out"
            : "animate-fade-in"
        }`}
      >
        <div
          className={`w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0d0d10] p-6 text-center shadow-2xl ${
            isClosing
              ? "animate-modal-out"
              : "animate-modal-in"
          }`}
        >
          <h2 className="text-lg font-semibold text-white">
            Roadmap unavailable
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            No valid roadmap data was provided.
          </p>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // TOGGLE SECTION
  // ------------------------------------------

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // ------------------------------------------
  // OPEN ALL
  // ------------------------------------------

  const openAll = () => {
    const allOpen = {};

    roadmap.stages.forEach((_, index) => {
      allOpen[index] = true;
    });

    setOpenSections(allOpen);
  };

  // ------------------------------------------
  // CLOSE ALL
  // ------------------------------------------

  const closeAll = () => {
    setOpenSections({});
  };

  // ------------------------------------------
  // JSON DATA
  // ------------------------------------------

  const formattedJson = JSON.stringify(
    roadmap,
    null,
    2
  );

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ${
        isClosing
          ? "animate-fade-out"
          : "animate-fade-in"
      }`}
    >
      {/* MODAL */}
      <div
        className={`flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d10] shadow-2xl ${
          isClosing
            ? "animate-modal-out"
            : "animate-modal-in"
        }`}
      >
        {/* ======================================
            HEADER
        ====================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/70 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Your Learning Roadmap
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Personalized step-by-step career learning plan
            </p>
          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Close roadmap"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ======================================
            CONTENT
        ====================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          {showJson ? (
            /* ==================================
               JSON VIEW
            ================================== */

            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    Roadmap JSON
                  </h1>

                  <p className="mt-1 text-xs text-zinc-500">
                    Raw roadmap data returned by the API
                  </p>
                </div>

                <button
                  onClick={() => setShowJson(false)}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                >
                  Hide JSON
                </button>
              </div>

              <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#08080b] p-4 text-xs leading-6 text-zinc-300">
                {formattedJson}
              </pre>
            </div>
          ) : (
            /* ==================================
               ROADMAP VIEW
            ================================== */

            <>
              {/* TITLE */}

              <h1 className="text-center text-2xl font-bold tracking-tight text-white">
                {roadmap.topic || "Learning Roadmap"}
              </h1>

              <p className="mt-2 text-center text-xs text-zinc-500">
                {roadmap.stages.length} learning stages
              </p>

              {/* ==================================
                  CONTROLS
              ================================== */}

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  onClick={openAll}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                >
                  Expand all
                </button>

                <button
                  onClick={closeAll}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                >
                  Collapse all
                </button>

                {/* SHOW JSON */}
                <button
                  onClick={() => setShowJson(true)}
                  className="rounded-lg border border-yellow-400/40 bg-yellow-400/5 px-3 py-1.5 text-xs text-yellow-300 transition hover:border-yellow-400 hover:bg-yellow-400/10"
                >
                  Show JSON
                </button>
              </div>

              {/* ==================================
                  STAGES
              ================================== */}

              <div className="mt-6 space-y-0">
                {roadmap.stages.map(
                  (stage, index) => {
                    const isOpen = Boolean(
                      openSections[index]
                    );

                    return (
                      <div
                        key={
                          stage.id ?? index
                        }
                      >
                        {/* STAGE */}

                        <button
                          onClick={() =>
                            toggleSection(index)
                          }
                          className="group flex w-full items-center justify-between rounded-xl border border-yellow-400 bg-yellow-400/5 px-4 py-3.5 text-left transition duration-200 hover:bg-yellow-400/10"
                        >
                          <div className="flex items-center gap-3">
                            {/* STAGE NUMBER */}

                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-xs font-bold text-black">
                              {stage.id ??
                                index + 1}
                            </div>

                            {/* STAGE TITLE */}

                            <span className="text-sm font-semibold text-yellow-300">
                              {stage.title}
                            </span>
                          </div>

                          {/* ARROW */}

                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`shrink-0 text-yellow-400 transition-transform duration-200 ${
                              isOpen
                                ? "rotate-180"
                                : ""
                            }`}
                          >
                            <path
                              d="m6 9 6 6 6-6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {/* TOPICS */}

                        {isOpen &&
                          Array.isArray(
                            stage.topics
                          ) &&
                          stage.topics.length >
                            0 && (
                            <div className="mt-2 space-y-2 pl-4">
                              {stage.topics.map(
                                (
                                  topic,
                                  topicIndex
                                ) => (
                                  <div
                                    key={
                                      topicIndex
                                    }
                                    className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-[#111116] px-4 py-3 transition duration-200 hover:border-zinc-500"
                                  >
                                    {/* TOPIC DOT */}

                                    <div className="h-2 w-2 shrink-0 rounded-full bg-zinc-400" />

                                    {/* TOPIC NAME */}

                                    <span className="text-sm leading-6 text-zinc-300">
                                      {
                                        topic.name
                                      }
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                        {/* CONNECTOR */}

                        {index <
                          roadmap.stages
                            .length -
                            1 && (
                          <div className="flex h-12 flex-col items-center justify-center">
                            <div className="h-5 w-px bg-zinc-600" />

                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-yellow-400"
                            >
                              <path
                                d="M12 5v14"
                                strokeLinecap="round"
                              />

                              <path
                                d="m7 14 5 5 5-5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>

        {/* ======================================
            FOOTER
        ====================================== */}

        <div className="shrink-0 border-t border-zinc-800/70 px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
