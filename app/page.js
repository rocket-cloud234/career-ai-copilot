"use client";

import { useRef, useState, useEffect } from "react";

import AboutYouPopup from "./components/AboutYou";
import ProfilePopup from "./components/ProfilePopup";
import SkillGapPopup from "./components/SkillGapPopup";
import RoadmapPopup from "./components/RoadmapPopup";
import RoadmapSidebar from "./components/RoadmapSidebar";
import MainSidebar from "./components/MainSidebar";
import Main from "./components/Main";
import initialMessage from "../data/initialMessage";
import suggestions from "../data/suggestions";

export default function Home() {
  // ==================================================
  // ROADMAP STATE
  // ==================================================

  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(
    "",
  );

  const [careerPathOptions, setCareerPathOptions] = useState([]);

  // ==================================================
  // CHAT STATE
  // ==================================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);

  // ==================================================
  // USER PROFILE
  // ==================================================

  const [aboutYou, setAboutYou] = useState({});

  // ==================================================
  // RESUME
  // ==================================================

  const [resume, setResume] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const skillGapFileInputRef = useRef(null);

  // ==================================================
  // POPUPS
  // ==================================================

  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const [showAboutYouPopup, setShowAboutYOUPopup] = useState(false);

  const [showSkillGapPopup, setShowSkillGapPopup] = useState(false);

  const [isSkillGapPopupClosing, setIsSkillGapPopupClosing] = useState(false);

  const [showRoadmapPopup, setShowRoadmapPopup] = useState(false);

  const [isRoadmapPopupClosing, setIsRoadmapPopupClosing] = useState(false);

  // ==================================================
  // SKILL GAP
  // ==================================================

  const [skillGapData, setSkillGapData] = useState({
    targetRole: "",
    currentSkills: "",
    background: "",
  });

  const [skillGapResume, setSkillGapResume] = useState(null);

  // ==================================================
  // ROADMAP
  // ==================================================

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
  // HELPERS
  // ==================================================

  /**
   * Safely convert a value into a displayable string.
   *
   * Supports:
   *
   * "Software Engineer"
   *
   * {
   *   id: "123",
   *   name: "Software Engineer"
   * }
   */
  const getDisplayName = (value, fallback = "") => {
    if (value === null || value === undefined) {
      return fallback;
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (typeof value === "object") {
      if (typeof value.name === "string" && value.name.trim()) {
        return value.name.trim();
      }

      if (typeof value.title === "string" && value.title.trim()) {
        return value.title.trim();
      }

      if (typeof value.targetCareer === "string" && value.targetCareer.trim()) {
        return value.targetCareer.trim();
      }

      if (typeof value.career === "string" && value.career.trim()) {
        return value.career.trim();
      }

      if (typeof value.label === "string" && value.label.trim()) {
        return value.label.trim();
      }

      return fallback;
    }

    return fallback;
  };

  /**
   * Safely extract an ID from:
   *
   * "123"
   *
   * or:
   *
   * {
   *   id: "123",
   *   name: "Software Engineer"
   * }
   */
  const getCareerId = (value, fallback = "") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (typeof value === "object") {
      return String(
        value.id || value.targetCareerId || value.careerId || fallback || "",
      ).trim();
    }

    return String(value).trim();
  };

  /**
   * Normalize career into:
   *
   * {
   *   id: "...",
   *   name: "..."
   * }
   */
  const normalizeCareer = (career, fallbackId = "") => {
    return {
      id: getCareerId(career, fallbackId),

      name: getDisplayName(career, ""),
    };
  };

  /**
   * Safely get roadmap ID.
   *
   * Supports:
   *
   * roadmap.id
   *
   * roadmap._id
   *
   * roadmap.roadmapId
   */
  const getRoadmapId = (roadmap) => {
    if (!roadmap) return "";

    return String(roadmap.id || roadmap._id || roadmap.roadmapId || "").trim();
  };

  /**
   * Get the career information from a roadmap.
   *
   * Supports:
   *
   * targetCareer: "Software Engineer"
   *
   * targetCareer: {
   *   id: "123",
   *   name: "Software Engineer"
   * }
   */
  const getRoadmapCareer = (roadmap) => {
    if (!roadmap) {
      return {
        id: "",
        name: "",
      };
    }

    const roadmapId = getRoadmapId(roadmap);

    const careerValue =
      roadmap.targetCareer ??
      roadmap.career ??
      roadmap.title ??
      roadmap.name ??
      "";

    const careerId =
      roadmap.targetCareerId ||
      roadmap.careerId ||
      getCareerId(careerValue) ||
      roadmapId;

    const career = normalizeCareer(careerValue, careerId);

    return {
      id: career.id || careerId || roadmapId,

      name: career.name || "",
    };
  };

  /**
   * Find roadmap by ID.
   */
  const getRoadmapById = (roadmapId) => {
    const id = String(roadmapId || "").trim();

    return roadmaps.find((roadmap) => getRoadmapId(roadmap) === id);
  };

  // ==================================================
  // LOAD USER + ROADMAP DATA
  // ==================================================

  const loadUserData = async () => {
    try {
      // ==========================================
      // LOAD USER
      // ==========================================

      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const meData = await meResponse.json();

      if (!meResponse.ok || !meData.success) {
        throw new Error(meData.error || "Failed to load user.");
      }

      const user = meData.user || {};

      // ==========================================
      // LOAD ROADMAPS
      // ==========================================

      const mapResponse = await fetch("/api/map", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const mapData = await mapResponse.json();

      if (!mapResponse.ok || !mapData.success) {
        console.error(mapData.error || "Failed to load roadmap data.");

        setRoadmaps([]);
        setSelectedRoadmapId("");

        const userCareer = normalizeCareer(
          user.targetCareer,
          user.targetCareerId,
        );

        setAboutYou({
          name: user.name || "",
          age: user.age || "",
          interests: user.interests || "",
          currentSkills: user.currentSkills || "",
          background: user.background || "",

          targetCareer: userCareer.name,

          targetCareerId: userCareer.id,

          selectedRoadmap: "",
        });

        return;
      }

      const loadedRoadmaps = Array.isArray(mapData.mapData)
        ? mapData.mapData
        : [];

      setRoadmaps(loadedRoadmaps);

      // ==========================================
      // USER CAREER
      // ==========================================

      const userCareer = normalizeCareer(
        user.targetCareer,
        user.targetCareerId,
      );

      const userCareerName = userCareer.name.trim().toLowerCase();

      const userCareerId = userCareer.id.trim();

      // ==========================================
      // FIND USER'S SAVED ROADMAP
      // ==========================================

      let selectedRoadmap = null;

      // ==========================================
      // MATCH BY CAREER ID
      // ==========================================

      if (userCareerId) {
        selectedRoadmap = loadedRoadmaps.find((roadmap) => {
          const roadmapId = getRoadmapId(roadmap);

          const roadmapCareer = getRoadmapCareer(roadmap);

          return (
            roadmapCareer.id === userCareerId || roadmapId === userCareerId
          );
        });
      }

      // ==========================================
      // MATCH BY CAREER NAME
      // ==========================================

      if (!selectedRoadmap && userCareerName) {
        selectedRoadmap = loadedRoadmaps.find((roadmap) => {
          const roadmapCareer = getRoadmapCareer(roadmap);

          return roadmapCareer.name.trim().toLowerCase() === userCareerName;
        });
      }

      // ==========================================
      // NEVER FALL BACK TO FIRST ROADMAP
      // ==========================================

      if (selectedRoadmap) {
        const roadmapId = getRoadmapId(selectedRoadmap);

        setSelectedRoadmapId(roadmapId);
      } else {
        setSelectedRoadmapId("");
      }

      // ==========================================
      // NORMALIZE SELECTED CAREER
      // ==========================================

      const selectedCareer = selectedRoadmap
        ? getRoadmapCareer(selectedRoadmap)
        : userCareer;

      const selectedRoadmapIdValue = selectedRoadmap
        ? getRoadmapId(selectedRoadmap)
        : "";

      // ==========================================
      // UPDATE PROFILE
      // ==========================================

      setAboutYou({
        name: user.name || "",
        age: user.age || "",

        interests: user.interests || "",

        currentSkills: user.currentSkills || "",

        background: user.background || "",

        // IMPORTANT:
        // Always store a STRING here.
        targetCareer: selectedCareer.name || "",

        targetCareerId: selectedCareer.id || "",

        selectedRoadmap: selectedRoadmapIdValue,
      });

      console.log("USER RELOADED:", user);

      console.log("ROADMAPS RELOADED:", loadedRoadmaps);

      console.log("SELECTED ROADMAP:", selectedRoadmap);

      console.log("SELECTED CAREER:", selectedCareer);

      return {
        user,
        roadmaps: loadedRoadmaps,
        selectedRoadmap,
      };
    } catch (error) {
      console.error("Failed to reload user/map data:", error);

      throw error;
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadUserData().catch((error) => {
      console.error("Initial data load failed:", error);
    });
  }, []);

  // ==================================================
  // ROADMAP SELECT
  // ==================================================

  const handleRoadmapSelect = (roadmapId) => {
    const roadmap = getRoadmapById(roadmapId);

    if (!roadmap) {
      return;
    }

    const actualRoadmapId = getRoadmapId(roadmap);

    const career = getRoadmapCareer(roadmap);

    setSelectedRoadmapId(actualRoadmapId);

    setAboutYou((prev) => ({
      ...prev,

      targetCareer: career.name || "",

      targetCareerId: career.id || actualRoadmapId,

      selectedRoadmap: actualRoadmapId,
    }));

    console.log("ROADMAP SELECTED:", roadmap);

    console.log("CAREER SELECTED:", career);
  };

  // ==================================================
  // CAREER PATH SUBMITTED FROM CHAT
  // ==================================================

  const handleCareerPathSubmitted = async ({
    targetCareer,
    targetCareerId,
  }) => {
    try {
      const career = normalizeCareer(targetCareer, targetCareerId);

      // ==========================================
      // UPDATE UI IMMEDIATELY
      // ==========================================

      setAboutYou((prev) => ({
        ...prev,

        targetCareer: career.name,

        targetCareerId: career.id,

        selectedRoadmap: career.id,
      }));

      setSelectedRoadmapId(career.id);

      // ==========================================
      // FETCH SERVER DATA
      // ==========================================

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error(data?.error || "Failed to refresh user career data.");

        return;
      }

      const user = data.user || {};

      const serverCareer = normalizeCareer(
        user.targetCareer,
        user.targetCareerId,
      );

      const finalCareerName = serverCareer.name || career.name || "";

      const finalCareerId = serverCareer.id || career.id || "";

      // ==========================================
      // SERVER = SOURCE OF TRUTH
      // ==========================================

      setAboutYou((prev) => ({
        ...prev,

        targetCareer: finalCareerName,

        targetCareerId: finalCareerId,

        selectedRoadmap: finalCareerId,
      }));

      setSelectedRoadmapId(finalCareerId);

      console.log("Career path refreshed:", {
        targetCareer: finalCareerName,

        targetCareerId: finalCareerId,
      });
    } catch (error) {
      console.error("Failed to refresh career path:", error);
    }
  };

  // ==================================================
  // TARGET CAREER CHANGE
  // ==================================================

  const handleTargetCareerChange = (careerValue) => {
    const career = normalizeCareer(careerValue);

    setAboutYou((prev) => ({
      ...prev,

      targetCareer: career.name,

      targetCareerId: career.id,
    }));

    // ==========================================
    // FIND MATCHING ROADMAP
    // ==========================================

    if (career.id) {
      const matchingRoadmap = roadmaps.find((roadmap) => {
        const roadmapId = getRoadmapId(roadmap);

        const roadmapCareer = getRoadmapCareer(roadmap);

        return roadmapId === career.id || roadmapCareer.id === career.id;
      });

      if (matchingRoadmap) {
        const roadmapId = getRoadmapId(matchingRoadmap);

        setSelectedRoadmapId(roadmapId);

        setAboutYou((prev) => ({
          ...prev,

          targetCareer: career.name,

          targetCareerId: career.id,

          selectedRoadmap: roadmapId,
        }));
      }
    }
  };

  // ==================================================
  // AI RESPONSE
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
  // ABOUT YOU POPUP
  // ==================================================

  const openAboutYouPopup = () => {
    setShowAboutYOUPopup(true);
  };

  // ==================================================
  // SAVE USER PROFILE TO DATABASE
  // ==================================================

  const saveUserProfileToDatabase = async (profileData) => {
    try {
      // ==========================================
      // GET LOGGED-IN USER
      // ==========================================

      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const meData = await meResponse.json();

      console.log("AUTH ME RESPONSE:", meData);

      if (!meResponse.ok || !meData.success) {
        throw new Error(meData.error || "Unable to identify logged-in user.");
      }

      // ==========================================
      // GET USER ID
      // ==========================================

      const userId = meData.user?._id || meData.user?.id || meData.user?.userId;

      console.log("USER ID:", userId);

      if (!userId) {
        throw new Error("User ID was not found.");
      }

      // ==========================================
      // NORMALIZE CAREER
      // ==========================================

      const career = normalizeCareer(
        profileData.targetCareer,
        profileData.targetCareerId,
      );

      // ==========================================
      // SAVE PROFILE
      // ==========================================

      const response = await fetch("/api/auth/profile", {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: String(userId),

          name: profileData.name || "",

          age:
            profileData.age !== undefined && profileData.age !== null
              ? profileData.age
              : "",

          interests: profileData.interests || "",

          currentSkills: profileData.currentSkills || "",

          background: profileData.background || "",

          targetCareer: career.name || "",
        }),
      });

      const data = await response.json();

      console.log("PROFILE SAVE RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save profile.");
      }

      return data;
    } catch (error) {
      console.error("Save profile error:", error);

      throw error;
    }
  };

  // ==================================================
  // SAVE PROFILE
  // ==================================================

  const handleSaveProfile = async (profileData) => {
    try {
      const career = normalizeCareer(
        profileData.targetCareer,
        profileData.targetCareerId,
      );

      const roadmapId =
        profileData.selectedRoadmap ||
        profileData.targetCareerId ||
        career.id ||
        "";

      const newProfile = {
        name: profileData.name || "",

        age: profileData.age || "",

        interests: profileData.interests || "",

        currentSkills: profileData.currentSkills || "",

        background: profileData.background || "",

        targetCareer: career.name,

        targetCareerId: career.id,

        selectedRoadmap: roadmapId,
      };

      // ==========================================
      // SAVE TO MONGODB
      // ==========================================

      await saveUserProfileToDatabase(newProfile);

      // ==========================================
      // CLOSE POPUP
      // ==========================================

      setShowAboutYOUPopup(false);

      // ==========================================
      // RELOAD EVERYTHING
      // ==========================================

      await loadUserData();

      console.log("Profile saved and data reloaded.");
    } catch (error) {
      console.error("Profile save error:", error);

      alert(error.message || "Unable to save your profile. Please try again.");
    }
  };

  // ==================================================
  // SAVE PROFILE + REGENERATE CAREER
  // ==================================================

  const handleNewSaveProfile = async (profileData) => {
    try {
      const career = normalizeCareer(
        profileData.targetCareer,
        profileData.targetCareerId,
      );

      const roadmapId =
        profileData.selectedRoadmap ||
        profileData.targetCareerId ||
        career.id ||
        "";

      const newProfile = {
        name: profileData.name || "",

        age: profileData.age || "",

        interests: profileData.interests || "",

        currentSkills: profileData.currentSkills || "",

        background: profileData.background || "",

        targetCareer: career.name,

        targetCareerId: career.id,

        selectedRoadmap: roadmapId,
      };

      // ==========================================
      // SAVE PROFILE
      // ==========================================

      await saveUserProfileToDatabase(newProfile);

      // ==========================================
      // CLOSE PROFILE POPUP
      // ==========================================

      setShowProfilePopup(false);

      // ==========================================
      // RELOAD USER + ROADMAPS
      // ==========================================

      await loadUserData();

      // ==========================================
      // RESET CHAT
      // ==========================================

      setMessages([initialMessage]);

      setMessage("");
      setRoadmapText("");
      setIsMockInterview(false);

      // ==========================================
      // REGENERATE CAREER PATH
      // ==========================================

      await regenerateCareerPath(newProfile);

      console.log("Profile saved, data reloaded, and career path regenerated.");
    } catch (error) {
      console.error("New profile save error:", error);

      alert(error.message || "Unable to save your profile. Please try again.");
    }
  };

  // ==================================================
  // FIND CAREER PATH
  // ==================================================

  const findCareerPath = async () => {
    if (isLoading || isAnalyzingResume) {
      return;
    }

    const hasRequiredData =
      aboutYou.interests?.trim() &&
      aboutYou.currentSkills?.trim() &&
      aboutYou.background?.trim();

    if (!hasRequiredData) {
      setShowProfilePopup(true);

      return;
    }

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
          data.error || "Something went wrong while finding your career path.",
        );
      }

      const aiResponse = handleAIResponse(
        data.response || "I couldn't find a suitable career path.",
      );

      setMessages((prev) => [
        ...prev,

        {
          id: crypto.randomUUID(),

          role: "ai",

          type: "career-path",

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

          text: error?.message || "Sorry, I couldn't find your career path.",
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
  // REGENERATE CAREER PATH
  // ==================================================

  const regenerateCareerPath = async (profileData) => {
    if (isLoading || isAnalyzingResume) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/career-path", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: "Find my career path",

          history: messages.map((msg) => ({
            role: msg.role,

            text: msg.text,
          })),

          aboutYou: profileData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Something went wrong while regenerating your career path.",
        );
      }

      const aiResponse = handleAIResponse(
        data.response || "I couldn't find a suitable career path.",
      );

      setMessages((prev) => [
        ...prev,

        {
          id: crypto.randomUUID(),

          role: "ai",

          type: "career-path",

          text: aiResponse,
        },
      ]);
    } catch (error) {
      console.error("Regenerate career path error:", error);

      setMessages((prev) => [
        ...prev,

        {
          id: crypto.randomUUID(),

          role: "ai",

          text:
            error?.message || "Sorry, I couldn't regenerate your career path.",
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

  const buildLearningRoadmap = async () => {
    if (isLoading || isAnalyzingResume) {
      return;
    }

    // ==========================================
    // CURRENT CAREER
    // ==========================================

    const career = normalizeCareer(
      aboutYou.targetCareer,
      aboutYou.targetCareerId,
    );

    if (!career.name) {
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

    const currentCareerName = career.name.trim().toLowerCase();

    const currentCareerId = String(career.id || "").trim();

    // ==========================================
    // CHECK EXISTING ROADMAP
    // ==========================================

    const existingRoadmap = roadmaps.find((roadmap) => {
      const roadmapId = getRoadmapId(roadmap);

      const roadmapCareer = getRoadmapCareer(roadmap);

      const roadmapCareerId = String(roadmapCareer.id || "").trim();

      const roadmapCareerName = String(roadmapCareer.name || "")
        .trim()
        .toLowerCase();

      // Match career ID
      if (
        currentCareerId &&
        roadmapCareerId &&
        roadmapCareerId === currentCareerId
      ) {
        return true;
      }

      // Match roadmap ID
      if (currentCareerId && roadmapId && roadmapId === currentCareerId) {
        return true;
      }

      // Match career name
      if (
        currentCareerName &&
        roadmapCareerName &&
        roadmapCareerName === currentCareerName
      ) {
        return true;
      }

      return false;
    });

    // ==========================================
    // EXISTING ROADMAP FOUND
    // ==========================================

    if (existingRoadmap) {
      console.log(
        "Existing roadmap found. Skipping generation:",
        existingRoadmap,
      );

      const existingRoadmapId = getRoadmapId(existingRoadmap);

      const existingCareer = getRoadmapCareer(existingRoadmap);

      const existingCareerName = existingCareer.name || career.name;

      const existingCareerId = existingCareer.id || career.id;

      // ========================================
      // SELECT EXISTING ROADMAP
      // ========================================

      setSelectedRoadmapId(existingRoadmapId);

      // ========================================
      // UPDATE PROFILE
      // ========================================

      setAboutYou((prev) => ({
        ...prev,

        targetCareer: existingCareerName,

        targetCareerId: existingCareerId,

        selectedRoadmap: existingRoadmapId,
      }));

      // ========================================
      // SYNC ROADMAP TEXT
      // ========================================

      setRoadmapText(JSON.stringify(existingRoadmap, null, 2));

      // ========================================
      // MESSAGE ONLY
      // ========================================

      setMessages((prev) => [
        ...prev,

        {
          id: crypto.randomUUID(),

          role: "ai",

          text: `You already have a learning roadmap for ${existingCareerName}. I've selected your existing roadmap.`,
        },
      ]);

      return;
    }

    // ==========================================
    // NO EXISTING ROADMAP
    // GENERATE NEW ONE
    // ==========================================

    const userMessage = {
      id: crypto.randomUUID(),

      role: "user",

      text: "Build a learning roadmap",
    };

    const previousMessages = messages;

    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      // ========================================
      // CALL ROADMAP API
      // ========================================

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

            targetCareer: career.name,

            targetCareerId: career.id,

            selectedRoadmap: selectedRoadmapId,
          },
        }),
      });

      // ========================================
      // CHECK RESPONSE TYPE
      // ========================================

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const rawResponse = await response.text();

        console.error("Roadmap API returned non-JSON:", rawResponse);

        throw new Error(
          `Roadmap API returned ${response.status} ${response.statusText}.`,
        );
      }

      const data = await response.json();

      // ========================================
      // HANDLE ERROR
      // ========================================

      if (!response.ok) {
        throw new Error(data.error || "Failed to build your learning roadmap.");
      }

      // ========================================
      // TARGET CAREER REQUIRED
      // ========================================

      if (data.response === "UK41Z_LAUNCH_TARGET_CAREER") {
        throw new Error("Please select a target career first.");
      }

      // ========================================
      // GET GENERATED ROADMAP
      // ========================================

      const roadmap = data?.roadmap;

      if (!roadmap || typeof roadmap !== "object") {
        throw new Error("The AI did not return a valid roadmap.");
      }

      // ========================================
      // VALIDATE ROADMAP
      // ========================================

      if (!roadmap.id || !Array.isArray(roadmap.stages)) {
        throw new Error("The generated roadmap has an invalid structure.");
      }

      // ========================================
      // NORMALIZE CAREER FROM RESPONSE
      // ========================================

      const generatedCareer = normalizeCareer(
        data?.targetCareer ||
          roadmap.targetCareer ||
          roadmap.career ||
          roadmap.title ||
          roadmap.name ||
          career.name,

        data?.targetCareerId ||
          roadmap.targetCareerId ||
          roadmap.careerId ||
          career.id ||
          roadmap.id,
      );

      // ========================================
      // CREATE FINAL ROADMAP
      // ========================================

      const roadmapWithCareer = {
        ...roadmap,

        targetCareer: generatedCareer.name,

        targetCareerId: generatedCareer.id || roadmap.id,
      };

      // ========================================
      // UPDATE ROADMAP LIST
      // ========================================

      setRoadmaps((prevRoadmaps) => {
        const existingIndex = prevRoadmaps.findIndex(
          (item) => getRoadmapId(item) === getRoadmapId(roadmapWithCareer),
        );

        if (existingIndex !== -1) {
          const updatedRoadmaps = [...prevRoadmaps];

          updatedRoadmaps[existingIndex] = roadmapWithCareer;

          return updatedRoadmaps;
        }

        return [...prevRoadmaps, roadmapWithCareer];
      });

      // ========================================
      // FINAL CAREER
      // ========================================

      const finalCareer = normalizeCareer(
        roadmapWithCareer.targetCareer,
        roadmapWithCareer.targetCareerId || roadmapWithCareer.id,
      );

      // ========================================
      // NEW ROADMAP ID
      // ========================================

      const newRoadmapId = getRoadmapId(roadmapWithCareer);

      // ========================================
      // SELECT NEW ROADMAP
      // ========================================

      setSelectedRoadmapId(newRoadmapId);

      // ========================================
      // UPDATE ABOUT YOU
      // ========================================

      setAboutYou((prev) => ({
        ...prev,

        targetCareer: finalCareer.name,

        targetCareerId: finalCareer.id,

        selectedRoadmap: newRoadmapId,
      }));

      // ========================================
      // SAVE ROADMAP TEXT
      // ========================================

      setRoadmapText(JSON.stringify(roadmapWithCareer, null, 2));

      // ========================================
      // SUCCESS MESSAGE
      // ========================================

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
            error?.message || "Sorry, I couldn't build your learning roadmap.",
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

  const selectedRoadmapId212 = roadmaps.find(
    (roadmap) =>
      getRoadmapId(roadmap) === String(selectedRoadmapId || "").trim(),
  );

  const targetCareerId = selectedRoadmapId212?.targetCareerId || null;

  // ==================================================
  // MOCK INTERVIEW
  // ==================================================

  const startMockInterview = async () => {
    if (isLoading || isAnalyzingResume) {
      return;
    }

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
          selectedRoadmapId: targetCareerId,
          history: previousMessages.map((msg) => ({
            role: msg.role,

            text: msg.text,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
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
  // MOCK INTERVIEW MESSAGE
  // ==================================================

  const sendMockInterviewMessage = async (messageText) => {
    if (!messageText || isLoading || isAnalyzingResume) {
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),

      role: "user",
    selectedRoadmapId: targetCareerId,
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
    selectedRoadmapId: targetCareerId,
          history: previousMessages.map((msg) => ({
            role: msg.role,

            text: msg.text,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Mock interview API returned ${response.status} ${response.statusText}.`,
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Mock interview request failed.",
        );
      }

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

      if (data.response === "NO_SELECTED_ROADMAP") {
        setIsMockInterview(false);

        setMessages((prev) => [
          ...prev,

          {
            id: crypto.randomUUID(),

            role: "ai",

            text:
              data.message ||
              "Please select a career roadmap before continuing.",
          },
        ]);

        return;
      }

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
  // SEND MESSAGE
  // ==================================================

  const sendMessage = async (text) => {
    const messageText = (text || message).trim();

    if (!messageText || isLoading || isAnalyzingResume) {
      return;
    }

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

    if (isAnalyzingResume) {
      return;
    }

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

    setShowAboutYOUPopup(false);

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
    setSkillGapData({
      targetRole: getDisplayName(aboutYou.targetCareer, ""),

      currentSkills: aboutYou.currentSkills || "",

      background: aboutYou.background || "",
    });

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

            aboutYou,
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

  // ==================================================
  // ROADMAPS CHANGE
  // ==================================================

  const handleRoadmapsChange = (updatedRoadmaps) => {
    setRoadmaps(Array.isArray(updatedRoadmaps) ? updatedRoadmaps : []);

    const safeRoadmaps = Array.isArray(updatedRoadmaps) ? updatedRoadmaps : [];

    const selectedRoadmap = safeRoadmaps.find(
      (roadmap) =>
        getRoadmapId(roadmap) === String(selectedRoadmapId || "").trim(),
    );

    if (!selectedRoadmap) {
      return;
    }

    const roadmapId = getRoadmapId(selectedRoadmap);

    const career = getRoadmapCareer(selectedRoadmap);

    setAboutYou((prev) => ({
      ...prev,

      targetCareer: career.name || "",

      targetCareerId: career.id || roadmapId,

      selectedRoadmap: roadmapId,
    }));
  };

  // ==================================================
  // UI
  // ==================================================

  const selectedRoadmap = roadmaps.find(
    (roadmap) =>
      getRoadmapId(roadmap) === String(selectedRoadmapId || "").trim(),
  );

  return (
    <div className="h-screen min-h-0 overflow-hidden bg-[#070707] text-zinc-100">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] overflow-hidden border-x border-zinc-800/60 bg-[#0b0b0c]">
        {/* ==================================================
            LEFT SIDEBAR
        ================================================== */}

        <MainSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          roadmaps={roadmaps}
          selectedRoadmapId={selectedRoadmapId}
          onRoadmapSelect={handleRoadmapSelect}
          onNewChat={newChat}
          profile={aboutYou}
          setProfile={setAboutYou}
          onOpenProfile={openAboutYouPopup}
          setShowProfilePopup={setShowAboutYOUPopup}
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
            setCareerPathOptions={setCareerPathOptions}
            buildLearningRoadmap={buildLearningRoadmap}
            startMockInterview={startMockInterview}
            openSkillGapPopup={openSkillGapPopup}
            openRoadmapPopup={openRoadmapPopup}
            sendMessage={sendMessage}
            resume={resume}
            profile={aboutYou}
            removeResume={removeResume}
            onCareerPathSubmitted={handleCareerPathSubmitted}
            targetRole={targetRole}
            setTargetRole={setTargetRole}
            analyzeResume={analyzeResume}
            fileInputRef={fileInputRef}
            handleResumeSelect={handleResumeSelect}
            message={message}
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
          selectedRoadmap={selectedRoadmap}
          onRoadmapSelect={handleRoadmapSelect}
          profile={aboutYou}
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
          ABOUT YOU POPUP
      ================================================== */}

      <AboutYouPopup
        show={showAboutYouPopup}
        profile={aboutYou}
        setProfile={setAboutYou}
        setShowProfilePopup={setShowAboutYOUPopup}
        onSave={handleSaveProfile}
      />

      {/* ==================================================
          PROFILE POPUP
      ================================================== */}

      <ProfilePopup
        show={showProfilePopup}
        profile={aboutYou}
        setProfile={setAboutYou}
        onNewChat={newChat}
        setShowProfilePopup={setShowProfilePopup}
        onSave={handleNewSaveProfile}
      />
    </div>
  );
}
