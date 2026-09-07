"use client";

import { useState } from "react";

export default function RoadmapSidebar({
  roadmaps = [],
  selectedRoadmapId = null,
  onRoadmapSelect,
  onRoadmapsChange,
  onTopicSelect,
}) {
  const [openStage, setOpenStage] = useState(null);

  // ==========================================
  // FIND SELECTED ROADMAP
  // ==========================================

  const roadmap = roadmaps.find(
    (item) => item.id === selectedRoadmapId
  );

  // ==========================================
  // TOGGLE STAGE
  // ==========================================

  const toggleStage = (stageId) => {
    setOpenStage((prev) =>
      prev === stageId ? null : stageId
    );
  };

  // ==========================================
  // TOGGLE TOPIC COMPLETION
  // ==========================================

  const toggleTopic = (stageId, topicName) => {
    const updatedRoadmaps = roadmaps.map((item) => {
      if (item.id !== selectedRoadmapId) {
        return item;
      }

      const updatedStages = (item.stages || []).map(
        (stage) => {
          if (stage.id !== stageId) {
            return stage;
          }

          const updatedTopics = (
            stage.topics || []
          ).map((topic) => {
            if (topic.name !== topicName) {
              return topic;
            }

            return {
              ...topic,
              completed: !topic.completed,
            };
          });

          const stageCompleted =
            updatedTopics.length > 0 &&
            updatedTopics.every(
              (topic) => topic.completed
            );

          return {
            ...stage,
            topics: updatedTopics,
            completed: stageCompleted,
          };
        }
      );

      return {
        ...item,
        stages: updatedStages,
      };
    });

    onRoadmapsChange?.(updatedRoadmaps);
  };

  // ==========================================
  // SEND TOPIC AS MESSAGE
  // ==========================================

  const handleTopicClick = (topicName) => {
    if (!topicName) return;

    onTopicSelect?.(topicName);
  };

  // ==========================================
  // ROADMAP DATA
  // ==========================================

  const stages = roadmap?.stages || [];

  const totalTopics = stages.reduce(
    (total, stage) =>
      total + (stage.topics?.length || 0),
    0
  );

  const completedTopics = stages.reduce(
    (total, stage) =>
      total +
      (stage.topics || []).filter(
        (topic) => topic.completed
      ).length,
    0
  );

  const progress =
    totalTopics > 0
      ? Math.round(
          (completedTopics / totalTopics) * 100
        )
      : 0;

  // ==========================================
  // NO ROADMAP
  // ==========================================

  if (!roadmap) {
    return (
      <aside className="flex h-full w-[270px] shrink-0 flex-col border-r border-zinc-800/70 bg-[#09090a]">
        <div className="flex h-[64px] items-center border-b border-zinc-800/60 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-black"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 4v5c0 1.1.9 2 2 2h10c1.1 0 2 .9 2 2v7" />
                <circle
                  cx="5"
                  cy="4"
                  r="1.5"
                  fill="currentColor"
                />
                <circle
                  cx="17"
                  cy="11"
                  r="1.5"
                  fill="currentColor"
                />
                <circle
                  cx="19"
                  cy="20"
                  r="1.5"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-white">
                Roadmap
              </p>

              <p className="text-[11px] text-zinc-500">
                No roadmap selected
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-zinc-600">
            No roadmap selected
          </p>
        </div>
      </aside>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <aside className="flex h-full w-[270px] shrink-0 flex-col border-r border-zinc-800/70 bg-[#09090a]">

      {/* HEADER */}

      <div className="flex h-[64px] items-center border-b border-zinc-800/60 px-4">
        <div className="flex items-center gap-3">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 4v5c0 1.1.9 2 2 2h10c1.1 0 2 .9 2 2v7" />

              <circle
                cx="5"
                cy="4"
                r="1.5"
                fill="currentColor"
              />

              <circle
                cx="17"
                cy="11"
                r="1.5"
                fill="currentColor"
              />

              <circle
                cx="19"
                cy="20"
                r="1.5"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-white">
              Roadmap
            </p>

            <p className="truncate text-[11px] text-zinc-500">
              {roadmap.topic || roadmap.title}
            </p>
          </div>

        </div>
      </div>

      {/* CONTENT */}

      <div className="sidebar-scrollbar flex-1 overflow-y-auto px-3 py-4">

        {/* SECTION TITLE */}

        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            Your Roadmap
          </p>

          <span className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-500">
            {stages.length} Stages
          </span>
        </div>

        {/* OVERALL PROGRESS */}

        <div className="mb-4 rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3">

          <div className="mb-2 flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-zinc-200">
                Overall Progress
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-500">
                {completedTopics} of {totalTopics} topics completed
              </p>
            </div>

            <span className="text-[11px] font-semibold text-zinc-400">
              {progress}%
            </span>

          </div>

          <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

        </div>

        {/* STAGES */}

        <div className="space-y-1">

          {stages.map((stage) => {
            const isOpen =
              openStage === stage.id;

            const topics = stage.topics || [];

            const completedCount =
              topics.filter(
                (topic) => topic.completed
              ).length;

            const stageProgress =
              topics.length > 0
                ? Math.round(
                    (completedCount /
                      topics.length) *
                      100
                  )
                : 0;

            return (
              <div
                key={stage.id}
                className={`overflow-hidden rounded-xl border transition-all ${
                  isOpen
                    ? "border-zinc-700 bg-zinc-900/60"
                    : "border-zinc-800/40 bg-transparent hover:bg-zinc-900/40"
                }`}
              >

                {/* STAGE BUTTON */}

                <button
                  type="button"
                  onClick={() => {
                    if (!isOpen) {
                      setOpenStage(stage.id);
                    }
                  }}
                  onDoubleClick={() => {
                    setOpenStage(null);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >

                  {/* STAGE NUMBER / CHECK */}

                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold ${
                      stage.completed
                        ? "border-white bg-white text-black"
                        : isOpen
                        ? "border-zinc-600 bg-zinc-800 text-white"
                        : "border-zinc-800 bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    {stage.completed ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    ) : (
                      String(stage.id).padStart(2, "0")
                    )}
                  </div>

                  {/* STAGE INFO */}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs font-medium ${
                        isOpen
                          ? "text-white"
                          : "text-zinc-400"
                      }`}
                    >
                      {stage.title}
                    </p>

                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      {completedCount} / {topics.length} completed
                    </p>
                  </div>

                  {/* ARROW */}

                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-200 ${
                      isOpen
                        ? "rotate-90 text-zinc-400"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>

                </button>

                {/* TOPICS */}

                {isOpen && (
                  <div className="border-t border-zinc-800/60 px-3 pb-3 pt-2">

                    {/* STAGE PROGRESS */}

                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-600">
                        Topics
                      </span>

                      <span className="text-[9px] text-zinc-600">
                        {stageProgress}%
                      </span>
                    </div>

                    <div className="mb-2 h-0.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-400 transition-all duration-300"
                        style={{
                          width: `${stageProgress}%`,
                        }}
                      />
                    </div>

                    {/* TOPIC LIST */}

                    <div className="space-y-0.5">

                      {topics.map((topic) => (
                        <div
                          key={topic.name}
                          className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-zinc-800/60"
                        >

                          {/* CHECKBOX */}

                          <button
                            type="button"
                            aria-label={`Mark ${
                              topic.name
                            } as ${
                              topic.completed
                                ? "incomplete"
                                : "complete"
                            }`}
                            onClick={() =>
                              toggleTopic(
                                stage.id,
                                topic.name
                              )
                            }
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                              topic.completed
                                ? "border-white bg-white"
                                : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                            }`}
                          >
                            {topic.completed && (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-2.5 w-2.5 text-black"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m5 12 4 4L19 6" />
                              </svg>
                            )}
                          </button>

                          {/* CLICKABLE TOPIC NAME */}

                          <button
                            type="button"
                            onClick={() =>
                              handleTopicClick(topic.name)
                            }
                            className={`min-w-0 flex-1 cursor-pointer text-left text-[11px] leading-tight transition-colors hover:text-white ${
                              topic.completed
                                ? "text-zinc-600 line-through hover:text-zinc-400"
                                : "text-zinc-400 group-hover:text-zinc-200"
                            }`}
                            title={`Ask about ${topic.name}`}
                          >
                            {topic.name}
                          </button>

                        </div>
                      ))}

                    </div>
                  </div>
                )}

              </div>
            );
          })}

        </div>
      </div>
    </aside>
  );
}

