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

const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmapId, setSelectedRoadmapId] =
    useState("");

  const [careerPathOptions, setCareerPathOptions] = useState([]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);

  const [aboutYou, setAboutYou] = useState({});


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
      throw new Error(
        meData.error || "Failed to load user."
      );
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
      console.error(
        mapData.error || "Failed to load roadmap data."
      );

      setRoadmaps([]);
      setSelectedRoadmapId("");

      setAboutYou((prev) => ({
        ...prev,

        name: user.name || "",
        age: user.age || "",
        interests: user.interests || "",
        currentSkills: user.currentSkills || "",
        background: user.background || "",
        targetCareer: user.targetCareer || "",
        targetCareerId: user.targetCareerId || "",
        selectedRoadmap: "",
      }));

      return;
    }

    const loadedRoadmaps = Array.isArray(mapData.mapData)
      ? mapData.mapData
      : [];

    setRoadmaps(loadedRoadmaps);

    // ==========================================
    // FIND USER'S SAVED ROADMAP
    // ==========================================

    const userCareer = String(
      user.targetCareer || ""
    ).trim();

    const userCareerId = String(
      user.targetCareerId || ""
    ).trim();

    let selectedRoadmap = null;

    // Match by career ID
    if (userCareerId) {
      selectedRoadmap = loadedRoadmaps.find(
        (roadmap) =>
          String(
            roadmap.targetCareerId ||
              roadmap.careerId ||
              ""
          ).trim() === userCareerId
      );

      // Some roadmaps use their own ID
      if (!selectedRoadmap) {
        selectedRoadmap = loadedRoadmaps.find(
          (roadmap) =>
            String(roadmap.id || "").trim() ===
            userCareerId
        );
      }
    }

    // Match by career name
    if (!selectedRoadmap && userCareer) {
      selectedRoadmap = loadedRoadmaps.find(
        (roadmap) =>
          String(
            roadmap.targetCareer ||
              roadmap.career ||
              roadmap.title ||
              roadmap.name ||
              ""
          )
            .trim()
            .toLowerCase() ===
          userCareer.toLowerCase()
      );
    }

    // ==========================================
    // IMPORTANT
    // NEVER FALL BACK TO FIRST ROADMAP
    // ==========================================

    if (selectedRoadmap) {
      setSelectedRoadmapId(
        selectedRoadmap.id || ""
      );
    } else {
      setSelectedRoadmapId("");
    }

    // ==========================================
    // UPDATE PROFILE
    // ==========================================

    setAboutYou({
      name: user.name || "",
      age: user.age || "",

      interests: user.interests || "",
      currentSkills: user.currentSkills || "",
      background: user.background || "",

      targetCareer:
        selectedRoadmap?.targetCareer ||
        user.targetCareer ||
        "",

      targetCareerId:
        user.targetCareerId || "",

      selectedRoadmap:
        selectedRoadmap?.id || "",
    });

    console.log("USER RELOADED:", user);
    console.log(
      "ROADMAPS RELOADED:",
      loadedRoadmaps
    );
    console.log(
      "SELECTED ROADMAP:",
      selectedRoadmap
    );

    return {
      user,
      roadmaps: loadedRoadmaps,
      selectedRoadmap,
    };
  } catch (error) {
    console.error(
      "Failed to reload user/map data:",
      error
    );

    throw error;
  }
};

useEffect(() => {
  loadUserData().catch((error) => {
    console.error(
      "Initial data load failed:",
      error
    );
  });
}, []);
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
   * Convert any career value into a consistent object.
   */
  const normalizeCareer = (career, fallbackId = "") => {
    if (!career) {
      return {
        id: fallbackId,
        name: "",
      };
    }

    if (typeof career === "object") {
      return {
        id: career.id || career.targetCareerId || fallbackId,
        name: career.name || career.title || career.targetCareer || "",
      };
    }

    return {
      id: fallbackId,
      name: String(career),
    };
  };

  /**
   * Find a roadmap by ID.
   */
  const getRoadmapById = (roadmapId) => {
    return roadmaps.find((roadmap) => roadmap.id === roadmapId);
  };

  // ==================================================
  // ROADMAP SELECT
  // ==================================================

const handleRoadmapSelect = (roadmapId) => {
  const roadmap = getRoadmapById(roadmapId);

  if (!roadmap) return;

  setSelectedRoadmapId(roadmap.id);

  setAboutYou((prev) => ({
    ...prev,

    targetCareer:
      roadmap.targetCareer || "",

    targetCareerId:
      roadmap.targetCareerId ||
      roadmap.careerId ||
      roadmap.id,

    selectedRoadmap:
      roadmap.id,
  }));
};



  // ==================================================
// CAREER PATH SUBMITTED FROM CHAT
// ==================================================

const handleCareerPathSubmitted = async ({
  targetCareer,
  targetCareerId,
}) => {
  try {
    // ------------------------------------------------
    // Update UI immediately
    // ------------------------------------------------

    setAboutYou((prev) => ({
      ...prev,
      targetCareer: targetCareer || "",
      targetCareerId: targetCareerId || "",
      selectedRoadmap: targetCareerId || "",
    }));

    setSelectedRoadmapId(targetCareerId || "");

    // ------------------------------------------------
    // Fetch latest user data from server
    // This makes the UI match MongoDB immediately.
    // ------------------------------------------------

    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(
        data?.error || "Failed to refresh user career data."
      );

      return;
    }

    const user = data.user || {};

    // ------------------------------------------------
    // Use server values as final source of truth
    // ------------------------------------------------

    setAboutYou((prev) => ({
      ...prev,

      targetCareer:
        user.targetCareer || targetCareer || "",

      targetCareerId:
        user.targetCareerId || targetCareerId || "",

      selectedRoadmap:
        user.targetCareerId || targetCareerId || "",
    }));

    setSelectedRoadmapId(
      user.targetCareerId || targetCareerId || ""
    );

    console.log("Career path refreshed:", {
      targetCareer:
        user.targetCareer || targetCareer || "",

      targetCareerId:
        user.targetCareerId || targetCareerId || "",
    });
  } catch (error) {
    console.error(
      "Failed to refresh career path:",
      error
    );
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

    /*
     * If this career already has a roadmap,
     * automatically select that roadmap.
     */
    if (career.id) {
      const matchingRoadmap = roadmaps.find(
        (roadmap) =>
          roadmap.id === career.id || roadmap.targetCareerId === career.id,
      );

      if (matchingRoadmap) {
        setSelectedRoadmapId(matchingRoadmap.id);

        setAboutYou((prev) => ({
          ...prev,
          targetCareer: career.name,
          targetCareerId: career.id,
          selectedRoadmap: matchingRoadmap.id,
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
  // PROFILE SAVE
  // ==================================================

const saveUserProfileToDatabase = async (profileData) => {
  try {
    // Get logged-in user
    const meResponse = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const meData = await meResponse.json();

    console.log("AUTH ME RESPONSE:", meData);

    if (!meResponse.ok || !meData.success) {
      throw new Error(
        meData.error || "Unable to identify logged-in user."
      );
    }

    // Get MongoDB user ID
    const userId =
      meData.user?._id ||
      meData.user?.id ||
      meData.user?.userId;

    console.log("USER ID:", userId);

    if (!userId) {
      throw new Error("User ID was not found.");
    }

    // Save profile
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
          profileData.age !== undefined &&
          profileData.age !== null
            ? profileData.age
            : "",

        interests: profileData.interests || "",
        currentSkills: profileData.currentSkills || "",
        background: profileData.background || "",
        targetCareer: profileData.targetCareer || "",
      }),
    });

    const data = await response.json();

    console.log("PROFILE SAVE RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Failed to save profile."
      );
    }

    return data;
  } catch (error) {
    console.error("Save profile error:", error);
    throw error;
  }
};

const handleSaveProfile = async (profileData) => {
  try {
    const career = normalizeCareer(
      profileData.targetCareer,
      profileData.targetCareerId
    );

    const roadmapId =
      profileData.selectedRoadmap ||
      profileData.targetCareerId ||
      career.id ||
      "";

    const newProfile = {
      name: profileData.name || "",
      age: profileData.age || "",

      interests:
        profileData.interests || "",

      currentSkills:
        profileData.currentSkills || "",

      background:
        profileData.background || "",

      targetCareer:
        career.name,

      targetCareerId:
        career.id,

      selectedRoadmap:
        roadmapId,
    };

    // ==========================================
    // SAVE TO MONGODB
    // ==========================================

    await saveUserProfileToDatabase(
      newProfile
    );

    // ==========================================
    // CLOSE POPUP
    // ==========================================

    setShowAboutYOUPopup(false);

    // ==========================================
    // RELOAD EVERYTHING FROM SERVER
    // ==========================================

    await loadUserData();

    console.log(
      "Profile saved and data reloaded."
    );
  } catch (error) {
    console.error(
      "Profile save error:",
      error
    );

    alert(
      error.message ||
        "Unable to save your profile. Please try again."
    );
  }
};

  // ==================================================
  // SAVE PROFILE + REGENERATE CAREER
  // ==================================================

const handleNewSaveProfile = async (profileData) => {
  try {
    const career = normalizeCareer(
      profileData.targetCareer,
      profileData.targetCareerId
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

    // SAVE PROFILE
    await saveUserProfileToDatabase(newProfile);

    // CLOSE PROFILE POPUP
    setShowProfilePopup(false);

    // RELOAD USER + ROADMAPS
    await loadUserData();

    // RESET CHAT
    setMessages([initialMessage]);
    setMessage("");
    setRoadmapText("");
    setIsMockInterview(false);

    // CALL CAREER PATH API
    await regenerateCareerPath(newProfile);

    console.log(
      "Profile saved, data reloaded, and career path regenerated."
    );
  } catch (error) {
    console.error("New profile save error:", error);

    alert(
      error.message ||
        "Unable to save your profile. Please try again."
    );
  }
};
  // ==================================================
  // FIND CAREER PATH
  // ==================================================

  const findCareerPath = async () => {
    if (isLoading || isAnalyzingResume) return;

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
    if (isLoading || isAnalyzingResume) return;

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
  if (isLoading || isAnalyzingResume) return;

  // =========================================================
  // GET CURRENT TARGET CAREER
  // =========================================================

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

  const currentCareerName = String(career.name || "")
    .trim()
    .toLowerCase();

  const currentCareerId = String(career.id || "").trim();

  // =========================================================
  // CHECK IF ROADMAP ALREADY EXISTS
  // =========================================================

  const existingRoadmap = roadmaps.find((roadmap) => {
    const roadmapId = String(roadmap.id || "").trim();

    const roadmapCareerId = String(
      roadmap.targetCareerId ||
        roadmap.careerId ||
        "",
    ).trim();

    const roadmapCareerName = String(
      roadmap.targetCareer ||
        roadmap.career ||
        roadmap.title ||
        roadmap.name ||
        "",
    )
      .trim()
      .toLowerCase();

    // Match by targetCareerId
    if (
      currentCareerId &&
      roadmapCareerId &&
      roadmapCareerId === currentCareerId
    ) {
      return true;
    }

    // Match roadmap ID with career ID
    if (
      currentCareerId &&
      roadmapId &&
      roadmapId === currentCareerId
    ) {
      return true;
    }

    // Match by career name
    if (
      currentCareerName &&
      roadmapCareerName &&
      roadmapCareerName === currentCareerName
    ) {
      return true;
    }

    return false;
  });

  // =========================================================
  // EXISTING ROADMAP FOUND
  // DO NOT GENERATE ANOTHER ONE
  // DO NOT USE type: "roadmap"
  // =========================================================

  if (existingRoadmap) {
    console.log(
      "Existing roadmap found. Skipping generation:",
      existingRoadmap,
    );

    const existingCareerName =
      existingRoadmap.targetCareer ||
      existingRoadmap.career ||
      existingRoadmap.title ||
      existingRoadmap.name ||
      career.name;

    const existingCareerId =
      existingRoadmap.targetCareerId ||
      existingRoadmap.careerId ||
      existingRoadmap.id ||
      career.id;

    // Select existing roadmap
    setSelectedRoadmapId(existingRoadmap.id);

    // Synchronize About You data
    setAboutYou((prev) => ({
      ...prev,
      targetCareer: existingCareerName,
      targetCareerId: existingCareerId,
      selectedRoadmap: existingRoadmap.id,
    }));

    // Keep roadmap text synchronized
    setRoadmapText(
      JSON.stringify(existingRoadmap, null, 2),
    );

    // IMPORTANT:
    // No `type: "roadmap"` here.
    // This means Main will NOT show the "Show Roadmap →" button.
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

  // =========================================================
  // NO EXISTING ROADMAP
  // GENERATE A NEW ONE
  // =========================================================

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: "Build a learning roadmap",
  };

  // Keep the messages before adding the new user message
  // for the API history.
  const previousMessages = messages;

  setMessages((prev) => [
    ...prev,
    userMessage,
  ]);

  setIsLoading(true);

  try {
    // =======================================================
    // CALL ROADMAP API
    // =======================================================

    const response = await fetch(
      "/api/roadmap-builder",
      {
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

            selectedRoadmap:
              selectedRoadmapId,
          },
        }),
      },
    );

    // =======================================================
    // CHECK RESPONSE TYPE
    // =======================================================

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const rawResponse = await response.text();

      console.error(
        "Roadmap API returned non-JSON:",
        rawResponse,
      );

      throw new Error(
        `Roadmap API returned ${response.status} ${response.statusText}.`,
      );
    }

    const data = await response.json();

    // =======================================================
    // HANDLE API ERROR
    // =======================================================

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to build your learning roadmap.",
      );
    }

    // =======================================================
    // TARGET CAREER REQUIRED
    // =======================================================

    if (
      data.response ===
      "UK41Z_LAUNCH_TARGET_CAREER"
    ) {
      throw new Error(
        "Please select a target career first.",
      );
    }

    // =======================================================
    // GET GENERATED ROADMAP
    // =======================================================

    const roadmap = data?.roadmap;

    if (
      !roadmap ||
      typeof roadmap !== "object"
    ) {
      throw new Error(
        "The AI did not return a valid roadmap.",
      );
    }

    // =======================================================
    // VALIDATE ROADMAP
    // =======================================================

    if (
      !roadmap.id ||
      !Array.isArray(roadmap.stages)
    ) {
      throw new Error(
        "The generated roadmap has an invalid structure.",
      );
    }

    // =======================================================
    // ADD CAREER INFORMATION TO ROADMAP
    // =======================================================

    const roadmapWithCareer = {
      ...roadmap,

      targetCareer:
        data?.targetCareer ||
        roadmap.targetCareer ||
        roadmap.career ||
        roadmap.title ||
        roadmap.name ||
        career.name,

      targetCareerId:
        data?.targetCareerId ||
        roadmap.targetCareerId ||
        roadmap.careerId ||
        career.id ||
        roadmap.id,
    };

    // =======================================================
    // UPDATE ROADMAP LIST
    // =======================================================

    setRoadmaps((prevRoadmaps) => {
      const existingIndex =
        prevRoadmaps.findIndex(
          (item) =>
            item.id === roadmapWithCareer.id,
        );

      // Update existing roadmap if same ID exists
      if (existingIndex !== -1) {
        const updatedRoadmaps = [
          ...prevRoadmaps,
        ];

        updatedRoadmaps[existingIndex] =
          roadmapWithCareer;

        return updatedRoadmaps;
      }

      // Otherwise add new roadmap
      return [
        ...prevRoadmaps,
        roadmapWithCareer,
      ];
    });

    // =======================================================
    // NORMALIZE GENERATED CAREER
    // =======================================================

    const generatedCareer =
      normalizeCareer(
        roadmapWithCareer.targetCareer,
        roadmapWithCareer.targetCareerId ||
          roadmapWithCareer.id,
      );

    const finalCareer = {
      id:
        roadmapWithCareer.targetCareerId ||
        roadmapWithCareer.id,

      name:
        generatedCareer.name ||
        career.name,
    };

    // =======================================================
    // SELECT NEW ROADMAP
    // =======================================================

    setSelectedRoadmapId(
      roadmapWithCareer.id,
    );

    // =======================================================
    // UPDATE ABOUT YOU
    // =======================================================

    setAboutYou((prev) => ({
      ...prev,

      targetCareer:
        finalCareer.name,

      targetCareerId:
        finalCareer.id,

      selectedRoadmap:
        roadmapWithCareer.id,
    }));

    // =======================================================
    // SAVE ROADMAP TEXT
    // =======================================================

    setRoadmapText(
      JSON.stringify(
        roadmapWithCareer,
        null,
        2,
      ),
    );

    // =======================================================
    // SHOW SUCCESS MESSAGE
    // `type: "roadmap"` IS INTENTIONAL HERE
    // BECAUSE THIS IS A NEWLY GENERATED ROADMAP.
    // =======================================================

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        type: "roadmap",
        text:
          "Your personalized learning roadmap is ready.",
      },
    ]);
  } catch (error) {
    // =======================================================
    // ERROR HANDLING
    // =======================================================

    console.error(
      "Roadmap error:",
      error,
    );

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
    // =======================================================
    // FINISH LOADING
    // =======================================================

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
  // MOCK INTERVIEW
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
  // NEW RE-CHAT
  // ==================================================

  const newReChat = () => {
    const careerPathMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: "Find my career path",
    };

    setMessages([initialMessage, careerPathMessage]);

    setMessage("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // ==================================================
  // SEND MESSAGE
  // ==================================================

  const sendMessage = async (text) => {
    const messageText = (text || message).trim();

    if (!messageText || isLoading || isAnalyzingResume) return;

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
    targetRole: aboutYou.targetCareer || "",
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

            // FIX:
            // "profile" did not exist.
            // Use aboutYou instead.
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
    setRoadmaps(updatedRoadmaps);

    /*
     * If the currently selected roadmap
     * still exists, keep everything synchronized.
     */
    const selectedRoadmap = updatedRoadmaps.find(
      (roadmap) => roadmap.id === selectedRoadmapId,
    );

    if (!selectedRoadmap) {
      return;
    }

    const career = normalizeCareer(
      selectedRoadmap.targetCareer ||
        selectedRoadmap.career ||
        selectedRoadmap.title ||
        selectedRoadmap.name,
      selectedRoadmap.id,
    );

    setAboutYou((prev) => ({
      ...prev,
      targetCareer:
        career.name || selectedRoadmap.name || selectedRoadmap.title || "",
      targetCareerId: selectedRoadmap.id,
      selectedRoadmap: selectedRoadmap.id,
    }));
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
