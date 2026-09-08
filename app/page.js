"use client";

import { useRef, useState } from "react";

import AboutYouPopup from "./components/AboutYou";
import SkillGapPopup from "./components/SkillGapPopup";
import RoadmapPopup from "./components/RoadmapPopup";
import RoadmapSidebar from "./components/RoadmapSidebar";
import MainSidebar from "./components/MainSidebar";
import Main from "./components/Main";
import initialRoadmapData from "../data/roadmaps.json";


const initialMessage = {
  id: "welcome",
  role: "ai",
  text: "Hi! I'm CareerAI. I can help you discover career paths, identify skill gaps, build learning roadmaps, prepare for interviews, and improve your resume.",
};

const suggestions = [
  {
    title: "Find my career path",
    description: "Discover careers that match your skills and interests.",
  },
  {
    title: "Analyze my skill gap",
    description: "See what skills you need for your target career.",
  },
  {
    title: "Build a learning roadmap",
    description: "Create a personalized step-by-step learning plan.",
  },
  {
    title: "Start a mock interview",
    description: "Practice interviews and get instant feedback.",
  },
];

export default function Home() {
  // ==================================================
  // CHAT
  // ==================================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
const [roadmaps, setRoadmaps] = useState(initialRoadmapData.roadmaps);
const [targetCareer, setTargetCareer] = useState({
  id: "fr",
  name: "Backend Developer",
});



  const [careerPathOptions, setCareerPathOptions] = useState([]);

const [aboutYou, setAboutYou] = useState({
  name: "Rahul Sharma",

  age: 22,

  interests:
    "Web development, UI design, building websites, and learning new technologies",

  currentSkills:
    "Basic HTML, CSS, beginner JavaScript, and basic Git",

  background:
    "BTech Computer Science student with a strong interest in web development. I have built a few small websites and want to improve my practical development skills.",

  targetCareer: "",

  targetCareerId: "jqul",

  selectedRoadmap: "",
});
  // ==================================================
  // RESUME
  // ==================================================

  const [resume, setResume] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

const [selectedRoadmapId, setSelectedRoadmapId] = useState(
  targetCareer.id
);

  // ==================================================
  // PROFILE POPUP
  // ==================================================

  const [showProfilePopup, setShowProfilePopup] = useState(false);



  const handleTargetCareerChange = (career) => {
    setTargetCareer(career);

    setAboutYou((prev) => ({
      ...prev,
      targetCareer: career,
    }));
  };

  

  // ==================================================
  // SKILL GAP POPUP
  // ==================================================

  const handleRoadmapSelect = (roadmapId) => {
    setSelectedRoadmapId(roadmapId);
  };

  const [showSkillGapPopup, setShowSkillGapPopup] = useState(false);
  const [isSkillGapPopupClosing, setIsSkillGapPopupClosing] = useState(false);

  const [skillGapData, setSkillGapData] = useState({
    targetRole: "",
    currentSkills: "",
    background: "",
  });

  const [skillGapResume, setSkillGapResume] = useState(null);
  const skillGapFileInputRef = useRef(null);

  // ==================================================
  // ROADMAP POPUP
  // ==================================================

  const [showRoadmapPopup, setShowRoadmapPopup] = useState(false);
  const [isRoadmapPopupClosing, setIsRoadmapPopupClosing] = useState(false);

  const [roadmapText, setRoadmapText] = useState("");

  // ==================================================
  // MOCK INTERVIEW
  // ==================================================

  const [isMockInterview, setIsMockInterview] = useState(false);

  // ==================================================
  // SIDEBAR
  // ==================================================

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ==================================================
  // HANDLE AI RESPONSE
  // ==================================================

  const handleAIResponse = (responseText) => {
    const trigger = "UK41Z_LAUNCH_PROFILE_INPUT";

    if (responseText.includes(trigger)) {
      setShowProfilePopup(true);

      return responseText.replace(trigger, "").trim();
    }

    return responseText;
  };

  // ==================================================
  // START MOCK INTERVIEW
  // ==================================================

  const startMockInterview = async () => {
    if (isLoading || isAnalyzingResume) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: "Start a mock interview",
    };

    const previousMessages = messages;

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Start a mock interview",
          history: previousMessages.map((msg) => ({
            role: msg.role,
            text: msg.text,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const rawResponse = await response.text();

        console.error("Mock interview returned non-JSON response:");
        console.error(rawResponse);

        throw new Error(
          `Mock interview API returned ${response.status} ${response.statusText}. Check your API route.`,
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to start mock interview.",
        );
      }

      // Current stage is not completed
      if (data.response === "STUDY_CURRENT_STAGE") {
        setIsMockInterview(false);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            text:
              data.message ||
              "Please complete your current roadmap stage before starting the mock interview.",
          },
        ]);

        return;
      }


    

      // No roadmap
      if (data.response === "NO_SELECTED_ROADMAP") {
        setIsMockInterview(false);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            text:
              data.message ||
              "Please select a career roadmap before starting a mock interview.",
          },
        ]);

        return;
      }

      // Normal interview
      setIsMockInterview(true);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: data.response || "I couldn't start the mock interview.",
        },
      ]);
    } catch (error) {
      console.error("Mock interview error:", error);

      setIsMockInterview(false);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: error.message || "Sorry, I couldn't start the mock interview.",
        },
      ]);
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // ==================================================
  // SEND MOCK INTERVIEW ANSWER
  // ==================================================

  const openProfilePopup = () => {
    setShowProfilePopup(true);
  };

  
 

  const sendMockInterviewMessage = async (messageText) => {
    if (!messageText || isLoading || isAnalyzingResume) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: messageText,
    };

    const previousMessages = messages;

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          history: previousMessages.map((msg) => ({
            role: msg.role,
            text: msg.text,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const rawResponse = await response.text();

        console.error(rawResponse);

        throw new Error(
          `Mock interview API returned ${response.status} ${response.statusText}. Check your API route.`,
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Mock interview request failed.",
        );
      }

      // Stage problem
      if (data.response === "STUDY_CURRENT_STAGE") {
        setIsMockInterview(false);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            text:
              data.message ||
              "Please complete your current roadmap stage before continuing.",
          },
        ]);

        return;
      }

      // No roadmap
      if (data.response === "NO_SELECTED_ROADMAP") {
        setIsMockInterview(false);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            text:
              data.message ||
              "Please select a career roadmap before starting a mock interview.",
          },
        ]);

        return;
      }

      // AI response
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text:
            data.response || "I couldn't generate the next interview question.",
        },
      ]);
    } catch (error) {
      console.error("Mock interview answer error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text:
            error.message || "Sorry, I couldn't process your interview answer.",
        },
      ]);
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // ==================================================
  // BUILD LEARNING ROADMAP
  // ==================================================

    const handleSaveProfile = (profileData) => {
  setAboutYou({
    name: profileData.name || "",
    age: profileData.age || "",
    interests: profileData.interests || "",
    currentSkills: profileData.currentSkills || "",
    background: profileData.background || "",
    targetCareer: profileData.targetCareer || "",
    selectedRoadmap: profileData.selectedRoadmap || "1",
  });

  setTargetCareer(profileData.targetCareer || "");
};

// ==================================================
// FIND MY CAREER PATH
// ==================================================

const findCareerPath = async () => {
  if (isLoading || isAnalyzingResume) return;

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: "Find my career path",
  };

  const previousMessages = messages;

  setMessages((prev) => [...prev, userMessage]);
  setIsLoading(true);

  try {
    const response = await fetch("/api/career-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Find my career path",

        history: previousMessages.map((msg) => ({
          role: msg.role,
          text: msg.text,
        })),

        aboutYou,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Something went wrong while finding your career path."
      );
    }

    const aiResponse = handleAIResponse(
      data.response ||
        "I couldn't find a suitable career path."
    );

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        text: aiResponse,
      },
    ]);
  } catch (error) {
    console.error("Career path error:", error);

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        text:
          error?.message ||
          "Sorry, I couldn't find your career path.",
      },
    ]);
  } finally {
    setIsLoading(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }
};



const buildLearningRoadmap = async () => {
  if (isLoading || isAnalyzingResume) return;

  // ==========================================
  // CHECK TARGET CAREER
  // ==========================================

  if (!aboutYou.targetCareer || !aboutYou.targetCareerId) {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        text: "Please select a target career before building a roadmap.",
      },
    ]);

    return;
  }

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: "Build a learning roadmap",
  };

  const previousMessages = messages;

  setMessages((prev) => [...prev, userMessage]);
  setIsLoading(true);

  try {
    // ==========================================
    // SEND REQUEST
    // ==========================================

    const response = await fetch("/api/roadmap-builder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Build a learning roadmap",

        history: previousMessages.map((msg) => ({
          role: msg.role,
          text: msg.text,
        })),

        aboutYou: {
          ...aboutYou,
        },
      }),
    });

    // ==========================================
    // CHECK RESPONSE TYPE
    // ==========================================

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const rawResponse = await response.text();

      console.error("Roadmap API returned non-JSON:");
      console.error(rawResponse);

      throw new Error(
        `Roadmap API returned ${response.status} ${response.statusText}.`
      );
    }

    // ==========================================
    // PARSE API JSON
    // ==========================================

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to build your learning roadmap."
      );
    }

    // ==========================================
    // SPECIAL TARGET CAREER RESPONSE
    // ==========================================

    if (data.response === "UK41Z_LAUNCH_TARGET_CAREER") {
      throw new Error(
        "Please select a target career first."
      );
    }

    // ==========================================
    // GET STRUCTURED ROADMAP
    // ==========================================

    const roadmap = data?.roadmap;

    if (!roadmap || typeof roadmap !== "object") {
      console.error("Invalid roadmap response:", data);

      throw new Error(
        "The AI did not return a valid roadmap."
      );
    }

    if (!roadmap.id || !Array.isArray(roadmap.stages)) {
      console.error(
        "Invalid roadmap structure:",
        roadmap
      );

      throw new Error(
        "The generated roadmap has an invalid structure."
      );
    }

    // ==========================================
    // STORE ROADMAP IN STATE
    // ==========================================

    setRoadmaps((prevRoadmaps) => {
      const existingIndex = prevRoadmaps.findIndex(
        (item) => item.id === roadmap.id
      );

      // Replace existing roadmap
      if (existingIndex !== -1) {
        const updatedRoadmaps = [...prevRoadmaps];

        updatedRoadmaps[existingIndex] = roadmap;

        return updatedRoadmaps;
      }

      // Add new generated roadmap
      return [...prevRoadmaps, roadmap];
    });

    // ==========================================
    // SELECT GENERATED ROADMAP
    // ==========================================

    setSelectedRoadmapId(roadmap.id);

    // ==========================================
    // UPDATE PROFILE
    // ==========================================

    setAboutYou((prev) => ({
      ...prev,
      targetCareer:
        data?.targetCareer?.name ||
        prev.targetCareer,

      targetCareerId: roadmap.id,

      selectedRoadmap: roadmap.id,
    }));

    // ==========================================
    // KEEP POPUP DATA
    // ==========================================

    setRoadmapText(
      JSON.stringify(
        roadmap,
        null,
        2
      )
    );

    // ==========================================
    // SUCCESS MESSAGE
    // ==========================================

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        type: "roadmap",
        text: "Your personalized learning roadmap is ready.",
      },
    ]);
  } catch (error) {
    console.error("Roadmap error:", error);

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        text:
          error?.message ||
          "Sorry, I couldn't build your learning roadmap.",
      },
    ]);
  } finally {
    setIsLoading(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }
};
  // ==================================================
  // ROADMAP POPUP
  // ==================================================

  const openRoadmapPopup = () => {
    setIsRoadmapPopupClosing(false);
    setShowRoadmapPopup(true);
  };

  const closeRoadmapPopup = () => {
    setIsRoadmapPopupClosing(true);

    setTimeout(() => {
      setShowRoadmapPopup(false);
      setIsRoadmapPopupClosing(false);
    }, 220);
  };

  // ==================================================
  // SEND MESSAGE
  // ==================================================

  const sendMessage = async (text) => {
    const messageText = (text || message).trim();

    if (!messageText || isLoading || isAnalyzingResume) return;

    // Mock interview mode
    if (isMockInterview) {
      await sendMockInterviewMessage(messageText);
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: messageText,
    };

    const previousMessages = messages;

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,

          history: previousMessages.map((msg) => ({
            role: msg.role,
            text: msg.text,
          })),

          aboutYou,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Something went wrong while connecting to CareerAI.",
        );
      }

      const aiResponse = handleAIResponse(
        data.response || "I couldn't generate a response.",
      );

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: aiResponse,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text:
            error.message || "Sorry, I couldn't connect to CareerAI right now.",
        },
      ]);
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // ==================================================
  // RESUME SELECT
  // ==================================================

  const handleResumeSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload your resume as a PDF.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Resume must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setResume(file);
  };

  // ==================================================
  // REMOVE RESUME
  // ==================================================

  const removeResume = () => {
    setResume(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==================================================
  // ANALYZE RESUME
  // ==================================================

  const analyzeResume = async () => {
    if (!resume) {
      alert("Please upload your resume first.");
      return;
    }

    if (!targetRole.trim()) {
      alert("Please enter your target career or job role.");
      return;
    }

    if (isAnalyzingResume) return;

    setIsAnalyzingResume(true);

    try {
      const formData = new FormData();

      formData.append("resume", resume);
      formData.append("targetRole", targetRole.trim());

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resume analysis failed.");
      }

      const aiResponse = handleAIResponse(
        data.response || "I couldn't generate the resume analysis.",
      );

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: `Analyze my resume for the role: ${targetRole.trim()}`,
        },
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: aiResponse,
        },
      ]);

      setResume(null);
      setTargetRole("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Resume analysis error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: error.message || "Sorry, I couldn't analyze your resume.",
        },
      ]);
    } finally {
      setIsAnalyzingResume(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };


  // ==================================================
  // NEW CHAT
  // ==================================================

const newChat = () => {
  setMessages([initialMessage]);
  setMessage("");

  setResume(null);
  setTargetRole("");

  setSkillGapData({
    targetRole: "",
    currentSkills: "",
    background: "",
  });

  setSkillGapResume(null);

  setRoadmapText("");
  setIsMockInterview(false);

  setShowProfilePopup(false);
  setShowSkillGapPopup(false);
  setShowRoadmapPopup(false);

  setIsSkillGapPopupClosing(false);
  setIsRoadmapPopupClosing(false);

  setIsLoading(false);
  setIsAnalyzingResume(false);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }

  if (skillGapFileInputRef.current) {
    skillGapFileInputRef.current.value = "";
  }

  setTimeout(() => {
    inputRef.current?.focus();
  }, 100);
};
  // ==================================================
  // SKILL GAP POPUP
  // ==================================================

  const openSkillGapPopup = () => {
    setIsSkillGapPopupClosing(false);
    setShowSkillGapPopup(true);
  };

  const closeSkillGapPopup = () => {
    setIsSkillGapPopupClosing(true);

    setTimeout(() => {
      setShowSkillGapPopup(false);
      setIsSkillGapPopupClosing(false);
    }, 220);
  };

  // ==================================================
  // SKILL GAP RESUME
  // ==================================================

  const handleSkillGapResumeSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload your resume as a PDF.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Resume must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setSkillGapResume(file);
  };

  const removeSkillGapResume = () => {
    setSkillGapResume(null);

    if (skillGapFileInputRef.current) {
      skillGapFileInputRef.current.value = "";
    }
  };

  // ==================================================
  // ANALYZE SKILL GAP
  // ==================================================

  const analyzeSkillGap = async () => {
    const { targetRole, currentSkills, background } = skillGapData;

    if (!targetRole.trim()) {
      alert("Please enter your target career or job role.");
      return;
    }

    if (!skillGapResume && !currentSkills.trim()) {
      alert("Please upload your resume or enter your current skills.");
      return;
    }

    setIsAnalyzingResume(true);
    closeSkillGapPopup();

    try {
      let response;

      // Resume analysis
      if (skillGapResume) {
        const formData = new FormData();

        formData.append("resume", skillGapResume);
        formData.append("targetRole", targetRole.trim());

        if (currentSkills.trim()) {
          formData.append("currentSkills", currentSkills.trim());
        }

        if (background.trim()) {
          formData.append("background", background.trim());
        }

        response = await fetch("/api/analyze-resume", {
          method: "POST",
          body: formData,
        });
      } else {
        // Normal chat analysis
        response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Analyze my current skill gap for the target career: ${targetRole.trim()}.

Current Skills:
${currentSkills || "Not provided"}

Background:
${background || "Not provided"}

Please identify:
1. Skills I already have
2. Important skills I am missing
3. Priority of each missing skill
4. What I should learn first
5. A practical learning roadmap`,

            history: messages.map((msg) => ({
              role: msg.role,
              text: msg.text,
            })),

            profile,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Skill gap analysis failed.");
      }

      const aiResponse = handleAIResponse(
        data.response || "I couldn't generate your skill gap analysis.",
      );

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: `Analyze my skill gap for: ${targetRole.trim()}`,
        },
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: aiResponse,
        },
      ]);

      setSkillGapData({
        targetRole: "",
        currentSkills: "",
        background: "",
      });

      setSkillGapResume(null);

      if (skillGapFileInputRef.current) {
        skillGapFileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Skill gap analysis error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: error.message || "Sorry, I couldn't analyze your skill gap.",
        },
      ]);
    } finally {
      setIsAnalyzingResume(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleRoadmapsChange = (updatedRoadmaps) => {
  setRoadmaps(updatedRoadmaps);
};

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="h-screen min-h-0 overflow-hidden bg-[#070707] text-zinc-100">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] overflow-hidden border-x border-zinc-800/60 bg-[#0b0b0c]">
        {/* ==================================================
            LEFT SIDEBAR
        ================================================== */}

        <MainSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          targetCareer={targetCareer}
        roadmaps={roadmaps}
          selectedRoadmapId={selectedRoadmapId}
          onRoadmapSelect={handleRoadmapSelect}
          onNewChat={newChat}
          profile={aboutYou}
          onOpenProfile={openProfilePopup}
          setShowProfilePopup={setShowProfilePopup}
        />

        {/* ==================================================
            MAIN CHAT
        ================================================== */}

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <Main
            messages={messages}
            isLoading={isLoading}
            isAnalyzingResume={isAnalyzingResume}
            suggestions={suggestions}
              findCareerPath={findCareerPath}
             careerPathOptions={careerPathOptions}
            setCareerPathOptions = {setCareerPathOptions}
            buildLearningRoadmap={buildLearningRoadmap}
            startMockInterview={startMockInterview}
            openSkillGapPopup={openSkillGapPopup}
            openRoadmapPopup={openRoadmapPopup}
            sendMessage={sendMessage}
            resume={resume}
            removeResume={removeResume}
            targetRole={targetRole}
            setTargetRole={setTargetRole}
            analyzeResume={analyzeResume}
            fileInputRef={fileInputRef}
            handleResumeSelect={handleResumeSelect}
            message={message}
            setTargetCareer={setTargetCareer}
            handleTargetCareerChange={handleTargetCareerChange}
            setMessage={setMessage}
            inputRef={inputRef}
            isMockInterview={isMockInterview}
          />
        </div>

        {/* ==================================================
            RIGHT ROADMAP SIDEBAR
        ================================================== */}

<RoadmapSidebar
  roadmaps={roadmaps}
  selectedRoadmapId={selectedRoadmapId}
  onRoadmapSelect={handleRoadmapSelect}
  onRoadmapsChange={handleRoadmapsChange}
  onTopicSelect={(topicName) => {
    sendMessage(topicName);
  }}
/>
      </div>

      {/* ==================================================
          ROADMAP POPUP
      ================================================== */}

      <RoadmapPopup
        show={showRoadmapPopup}
        isClosing={isRoadmapPopupClosing}
        roadmapText={roadmapText}
        onClose={closeRoadmapPopup}
      />

      {/* ==================================================
          SKILL GAP POPUP
      ================================================== */}

      <SkillGapPopup
        show={showSkillGapPopup}
        isClosing={isSkillGapPopupClosing}
        skillGapData={skillGapData}
        setSkillGapData={setSkillGapData}
        skillGapResume={skillGapResume}
        onResumeSelect={handleSkillGapResumeSelect}
        onRemoveResume={removeSkillGapResume}
        fileInputRef={skillGapFileInputRef}
        onClose={closeSkillGapPopup}
        onAnalyze={analyzeSkillGap}
      />

      {/* ==================================================
          PROFILE POPUP
      ================================================== */}
      <AboutYouPopup
        show={showProfilePopup}
        profile={aboutYou}
        setProfile={setAboutYou}
        setShowProfilePopup={setShowProfilePopup}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
