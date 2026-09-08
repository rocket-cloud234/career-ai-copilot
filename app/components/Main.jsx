"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";

export default function Main({
  messages,
  isLoading,
  isAnalyzingResume,
  suggestions,
  buildLearningRoadmap,
  startMockInterview,
  openSkillGapPopup,
  openRoadmapPopup,
  sendMessage,
  setTargetCareer,
  handleTargetCareerChange,

  // Career path state comes from parent
  careerPathOptions,
  setCareerPathOptions,
  findCareerPath,

  resume,
  removeResume,
  targetRole,
  setTargetRole,
  analyzeResume,

  fileInputRef,
  handleResumeSelect,

  message,
  setMessage,
  inputRef,
}) {
  // =========================================================
  // AUTO SCROLL
  // =========================================================

  const messagesEndRef = useRef(null);

  // =========================================================
  // CAREER PATH STATE
  // =========================================================

  const [selectedCareerPath, setSelectedCareerPath] = useState(null);

  // After clicking "Set Target Career"
  const [careerPathSubmitted, setCareerPathSubmitted] = useState(false);

  // Loading state for preprocessing
  const [isLoadingCareerPaths, setIsLoadingCareerPaths] = useState(false);

  // Store which career-path messages have already been processed
  const [processedCareerPathMessages, setProcessedCareerPathMessages] =
    useState(new Set());

  // =========================================================
  // AUTO SCROLL TO LAST MESSAGE
  // =========================================================

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    };

    // Small delay allows newly rendered content to exist first
    const timer = setTimeout(scrollToBottom, 50);

    return () => clearTimeout(timer);
  }, [messages, isLoading, isAnalyzingResume]);

  // =========================================================
  // CAREER PATH MARKER
  // =========================================================

  const CAREER_PATH_MARKER = "UK41Z_CAREER_PATH_INPUT";

  const isCareerPathInput = (text = "") =>
    text.includes(CAREER_PATH_MARKER);

  const cleanMessageText = (text = "") =>
    text.replace(CAREER_PATH_MARKER, "").trim();

  // =========================================================
  // PROCESS CAREER PATH THROUGH NEXT.JS API
  // =========================================================

  useEffect(() => {
    const processCareerPath = async () => {
      // Find the newest AI message containing the marker
      const careerPathMessage = [...messages]
        .reverse()
        .find(
          (msg) =>
            msg.role === "ai" &&
            isCareerPathInput(msg.text) &&
            !processedCareerPathMessages.has(msg.id)
        );

      if (!careerPathMessage) return;

      // Mark this message as processed immediately
      setProcessedCareerPathMessages((previous) => {
        const updated = new Set(previous);
        updated.add(careerPathMessage.id);
        return updated;
      });

      setIsLoadingCareerPaths(true);

      // Reset UI for a new career path question
      setSelectedCareerPath(null);
      setCareerPathSubmitted(false);

      try {
        const response = await fetch("/api/preprocess-career-path", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: careerPathMessage.text,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Career path preprocessing failed: ${response.status}`
          );
        }

        const data = await response.json();

        console.log("Career path preprocessing result:", data);

        // =====================================================
        // ADD NEW OPTIONS TO EXISTING OPTIONS
        // =====================================================

        if (
          Array.isArray(data?.careerPathOptions) &&
          data.careerPathOptions.length > 0
        ) {
          setCareerPathOptions((previous) => [
            ...previous,
            ...data.careerPathOptions,
          ]);
        } else {
          console.error(
            "Preprocessing API did not return careerPathOptions."
          );
        }
      } catch (error) {
        console.error("Career path preprocessing error:", error);
      } finally {
        setIsLoadingCareerPaths(false);
      }
    };

    processCareerPath();
  }, [
    messages,
    processedCareerPathMessages,
    setCareerPathOptions,
  ]);

  // =========================================================
  // SELECT CAREER PATH
  // =========================================================

  const selectCareerPath = (id) => {
    if (isLoading) return;

    setSelectedCareerPath(id);
  };

  // =========================================================
  // SET TARGET CAREER
  // =========================================================

  const submitCareerPath = () => {
    if (!selectedCareerPath) return;

    const selectedOption = careerPathOptions.find(
      (item) => item.id === selectedCareerPath
    );

    if (!selectedOption) return;

    // =======================================================
    // STORE BOTH CAREER ID AND CAREER NAME
    // =======================================================

    setTargetCareer({
      id: selectedOption.id,
      name: selectedOption.title,
    });

    // Keep parent target-career handling
    handleTargetCareerChange(selectedOption.title);

    // =======================================================
    // CHANGE UI
    // =======================================================

    setCareerPathSubmitted(true);

    // Clear current selection
    setSelectedCareerPath(null);
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <main className="flex min-h-0 min-w-[500px] flex-1 flex-col overflow-hidden">
      {/* =====================================================
          CHAT
      ===================================================== */}

      <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-8 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            {/* =================================================
                MESSAGES
            ================================================= */}

            {messages.map((msg) => {
              // =================================================
              // CAREER PATH MESSAGE
              // =================================================

              const careerPathInput =
                msg.role === "ai" && isCareerPathInput(msg.text);

              // Remove marker from visible text
              const visibleText = cleanMessageText(msg.text);

              return (
                <div
                  key={msg.id}
                  className={
                    msg.role === "user"
                      ? "flex justify-end"
                      : "flex items-start gap-3.5"
                  }
                >
                  {/* =================================================
                      AI AVATAR
                  ================================================= */}

                  {msg.role === "ai" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-[#141417]">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                  )}

                  {/* =================================================
                      MESSAGE
                  ================================================= */}

                  <div
                    className={
                      msg.role === "user"
                        ? "max-w-lg whitespace-pre-wrap rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-6 text-black shadow-sm"
                        : "max-w-xl text-sm leading-7 text-zinc-300"
                    }
                  >
                    {/* =================================================
                        ROADMAP MESSAGE
                    ================================================= */}

                    {msg.type === "roadmap" ? (
                      <div>
                        <p className="mb-3 text-sm text-zinc-300">
                          {visibleText}
                        </p>

                        <button
                          type="button"
                          onClick={openRoadmapPopup}
                          className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                              strokeLinecap="round"
                            />

                            <path
                              d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                              strokeLinejoin="round"
                            />
                          </svg>

                          <span>Show Roadmap</span>

                          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                            →
                          </span>
                        </button>
                      </div>
                    ) : msg.role === "ai" ? (
                      /* =================================================
                         AI MARKDOWN
                      ================================================= */

                      <div>
                        {visibleText && (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // =================================================
                              // PARAGRAPH
                              // =================================================

                              p: ({ children }) => (
                                <p className="mb-3 whitespace-pre-wrap last:mb-0">
                                  {children}
                                </p>
                              ),

                              // =================================================
                              // BOLD
                              // =================================================

                              strong: ({ children }) => (
                                <strong className="font-semibold text-white">
                                  {children}
                                </strong>
                              ),

                              // =================================================
                              // ITALIC
                              // =================================================

                              em: ({ children }) => (
                                <em className="italic text-zinc-200">
                                  {children}
                                </em>
                              ),

                              // =================================================
                              // UNORDERED LIST
                              // =================================================

                              ul: ({ children }) => (
                                <ul className="mb-3 ml-5 list-disc space-y-1.5">
                                  {children}
                                </ul>
                              ),

                              // =================================================
                              // ORDERED LIST
                              // =================================================

                              ol: ({ children }) => (
                                <ol className="mb-3 ml-5 list-decimal space-y-1.5">
                                  {children}
                                </ol>
                              ),

                              // =================================================
                              // LIST ITEM
                              // =================================================

                              li: ({ children }) => (
                                <li className="pl-1">{children}</li>
                              ),

                              // =================================================
                              // INLINE CODE
                              // =================================================

                              code: ({ children }) => (
                                <code className="rounded-md border border-zinc-800 bg-[#18181b] px-1.5 py-0.5 text-[13px] text-zinc-200">
                                  {children}
                                </code>
                              ),

                              // =================================================
                              // H1
                              // =================================================

                              h1: ({ children }) => (
                                <h1 className="mb-3 text-lg font-semibold text-white">
                                  {children}
                                </h1>
                              ),

                              // =================================================
                              // H2
                              // =================================================

                              h2: ({ children }) => (
                                <h2 className="mb-2.5 text-base font-semibold text-white">
                                  {children}
                                </h2>
                              ),

                              // =================================================
                              // H3
                              // =================================================

                              h3: ({ children }) => (
                                <h3 className="mb-2 text-sm font-semibold text-white">
                                  {children}
                                </h3>
                              ),

                              // =================================================
                              // BLOCKQUOTE
                              // =================================================

                              blockquote: ({ children }) => (
                                <blockquote className="my-3 border-l-2 border-zinc-700 pl-4 text-zinc-400">
                                  {children}
                                </blockquote>
                              ),

                              // =================================================
                              // CLICKABLE LINKS
                              // =================================================

                              a: ({ href, children }) => {
                                if (!href) {
                                  return <span>{children}</span>;
                                }

                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="break-words text-zinc-100 underline decoration-zinc-600 underline-offset-2 transition hover:decoration-white"
                                  >
                                    {children}
                                  </a>
                                );
                              },

                              // =================================================
                              // HORIZONTAL LINE
                              // =================================================

                              hr: () => (
                                <hr className="my-4 border-zinc-800" />
                              ),
                            }}
                          >
                            {visibleText}
                          </ReactMarkdown>
                        )}

                        {/* =================================================
                            CAREER PATH SELECTION
                        ================================================= */}

                        {careerPathInput && !careerPathSubmitted && (
                          <div className="mt-5 space-y-3">
                            <p className="text-xs font-medium text-zinc-500">
                              Choose the career path that interests you most:
                            </p>

                            {/* =================================================
                                PREPROCESSING LOADING
                            ================================================= */}

                            {isLoadingCareerPaths && (
                              <div className="rounded-2xl border border-zinc-800 bg-[#111114] p-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:-0.3s]" />

                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:-0.15s]" />

                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600" />
                                  </div>

                                  <span className="text-xs text-zinc-500">
                                    Preparing career paths...
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* =================================================
                                CAREER OPTIONS
                            ================================================= */}

                            {!isLoadingCareerPaths &&
                              careerPathOptions.length > 0 && (
                                <div className="grid grid-cols-1 gap-2.5">
                                  {careerPathOptions.map((option) => {
                                    const selected =
                                      selectedCareerPath === option.id;

                                    return (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() =>
                                          selectCareerPath(option.id)
                                        }
                                        disabled={isLoading}
                                        className={`group flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                                          selected
                                            ? "border-white/40 bg-white/[0.07]"
                                            : "border-zinc-800 bg-[#111114] hover:border-zinc-700 hover:bg-[#151518]"
                                        } ${
                                          isLoading
                                            ? "cursor-not-allowed opacity-50"
                                            : ""
                                        }`}
                                      >
                                        {/* RADIO */}

                                        <div
                                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                            selected
                                              ? "border-white"
                                              : "border-zinc-700 group-hover:border-zinc-500"
                                          }`}
                                        >
                                          {selected && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-white" />
                                          )}
                                        </div>

                                        {/* TEXT */}

                                        <div className="min-w-0">
                                          <p
                                            className={`text-sm font-medium transition ${
                                              selected
                                                ? "text-white"
                                                : "text-zinc-200"
                                            }`}
                                          >
                                            {option.title}
                                          </p>

                                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                                            {option.description}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                            {/* =================================================
                                SET TARGET CAREER
                            ================================================= */}

                            {careerPathOptions.length > 0 &&
                              !isLoadingCareerPaths && (
                                <button
                                  type="button"
                                  onClick={submitCareerPath}
                                  disabled={!selectedCareerPath || isLoading}
                                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                  <span>Set Target Career</span>
                                  <span>→</span>
                                </button>
                              )}
                          </div>
                        )}

                        {/* =================================================
                            GENERATE LEARNING ROADMAP
                        ================================================= */}

                        {careerPathInput && careerPathSubmitted && (
                          <div className="mt-5">
                            <button
                              type="button"
                              onClick={buildLearningRoadmap}
                              disabled={isLoading}
                              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                                  strokeLinejoin="round"
                                />
                              </svg>

                              <span>Generate Learning Roadmap</span>

                              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                →
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      visibleText
                    )}
                  </div>
                </div>
              );
            })}

            {/* =====================================================
                LOADING
            ===================================================== */}

            {(isLoading || isAnalyzingResume) && (
              <div className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-[#141417]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                      fill="white"
                    />
                  </svg>
                </div>

                <div className="pt-1">
                  {isAnalyzingResume && (
                    <p className="mb-3 text-sm text-zinc-400">
                      Analyzing your resume and comparing it with the target
                      role...
                    </p>
                  )}

                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:-0.3s]" />

                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:-0.15s]" />

                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600" />
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                AUTO SCROLL TARGET
            ===================================================== */}

            <div ref={messagesEndRef} />
          </div>

          {/* =====================================================
              SUGGESTIONS
          ===================================================== */}

          {messages.length === 1 &&
            !isLoading &&
            !isAnalyzingResume && (
              <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestions.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      if (item.title === "Analyze my skill gap") {
                        openSkillGapPopup();
                      } else if (
                        item.title === "Build a learning roadmap"
                      ) {
                        buildLearningRoadmap();
                      } else if (item.title === "Find my career path") {
                        findCareerPath();
                      } else if (item.title === "Start a mock interview") {
                        startMockInterview();
                      } else {
                        sendMessage(item.title);
                      }
                    }}
                    className="group rounded-2xl border border-zinc-800/80 bg-[#101013] p-4.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-[#141417]"
                  >
                    <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-[#18181b] text-zinc-400 transition group-hover:border-zinc-700 group-hover:text-white">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="M12 3v18M3 12h18"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <p className="text-sm font-medium text-zinc-200">
                      {item.title}
                    </p>

                    <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-[11px] text-zinc-600 transition group-hover:text-zinc-400">
                      Ask CareerAI

                      <span className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* =========================================================
          INPUT SECTION
      ========================================================= */}

      <div className="shrink-0 border-t border-zinc-800/70 bg-[#0b0b0d] px-5 py-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          {/* =================================================
              RESUME CARD
          ================================================= */}

          {resume && (
            <div className="mb-3 rounded-2xl border border-zinc-800 bg-[#111114] p-4">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]">
                    <svg
                      width="17"
                      height="17"
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
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {resume.name}
                    </p>

                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {(resume.size / 1024 / 1024).toFixed(2)} MB · PDF
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeResume}
                  disabled={isAnalyzingResume}
                  className="text-xs text-zinc-500 transition hover:text-red-400 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Target career / job role
                </label>

                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isAnalyzingResume}
                  placeholder="e.g. AI/ML Engineer"
                  className="w-full rounded-xl border border-zinc-800 bg-[#0c0c0f] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
                />
              </div>

              <button
                type="button"
                onClick={analyzeResume}
                disabled={!targetRole.trim() || isAnalyzingResume}
                className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isAnalyzingResume
                  ? "Analyzing resume..."
                  : "Analyze Skill Gap →"}
              </button>
            </div>
          )}

          {/* =================================================
              CHAT INPUT
          ================================================= */}

          <div className="flex items-center rounded-2xl border border-zinc-800 bg-[#111114] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition focus-within:border-zinc-600">
            {/* UPLOAD */}

            <div className="group relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isAnalyzingResume}
                aria-label="Upload resume"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"
              >
                <img
                  src="/paperclip.svg"
                  alt=""
                  className="h-[17px] w-[17px]"
                />
              </button>

              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                Upload your resume
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeSelect}
              className="hidden"
            />

            {/* INPUT */}

            <input
              ref={inputRef}
              value={message}
              disabled={isLoading || isAnalyzingResume}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask CareerAI anything..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />

            {/* SEND */}

            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={
                !message.trim() || isLoading || isAnalyzingResume
              }
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-20"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 19V5M6 11l6-6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* FOOTER */}

          <p className="mt-2.5 text-center text-[10px] text-zinc-600">
            CareerAI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </main>
  );
}

