import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    // ==========================================
    // API KEY
    // ==========================================

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error: "GEMINI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // GET REQUEST DATA
    // ==========================================

    const body = await request.json();

    const message = body?.message || "";

    const history = Array.isArray(body?.history)
      ? body.history
      : [];

    const aboutYou = body?.aboutYou || {};

    // ==========================================
    // USER DATA
    // ==========================================

    const name = String(
      aboutYou.name || ""
    ).trim();

    const age = aboutYou.age || "";

    const interests = String(
      aboutYou.interests || ""
    ).trim();

    const currentSkills = String(
      aboutYou.currentSkills || ""
    ).trim();

    const background = String(
      aboutYou.background || ""
    ).trim();

    // ==========================================
    // TARGET CAREER
    // ==========================================

    const targetCareer = String(
      aboutYou.targetCareer || ""
    ).trim();

    const targetCareerId = String(
      aboutYou.targetCareerId || ""
    ).trim();

    // ==========================================
    // TARGET CAREER CHECK
    // ==========================================

    if (!targetCareer || !targetCareerId) {
      return Response.json({
        response: "UK41Z_LAUNCH_TARGET_CAREER",
      });
    }

    // ==========================================
    // HISTORY
    // ==========================================

    const previousConversation = history
      .map((msg) => {
        const role =
          msg?.role === "user"
            ? "User"
            : "CareerAI";

        return `${role}: ${msg?.text || ""}`;
      })
      .join("\n");

    // ==========================================
    // ROADMAP PROMPT
    // ==========================================

    const prompt = `
You are CareerAI.

Your task is to create a practical, personalized learning roadmap for the user's target career.

TARGET CAREER:
${targetCareer}

TARGET CAREER ID:
${targetCareerId}

USER PROFILE:

Name:
${name || "Not provided"}

Age:
${age || "Not provided"}

Interests:
${interests || "Not provided"}

Current Skills:
${currentSkills || "Not provided"}

Background:
${background || "Not provided"}

========================================
ROADMAP GOAL
========================================

Create a complete learning roadmap that helps this user progress from their current skill level toward becoming job-ready for:

${targetCareer}

The roadmap must be personalized using:

- Current skills
- Interests
- Background
- Target career

Do not unnecessarily teach skills the user already knows.

If the user is a beginner, include the necessary fundamentals.

If the user already has strong skills, move toward intermediate and advanced topics faster.

========================================
ROADMAP STRUCTURE
========================================

Return exactly this JSON structure:

{
  "id": "${targetCareerId}",
  "topic": "${targetCareer} Roadmap",
  "completed": false,
  "stages": [
    {
      "id": 1,
      "title": "Stage title",
      "completed": false,
      "topics": [
        {
          "name": "Topic name",
          "completed": false
        }
      ]
    }
  ]
}

========================================
JSON RULES
========================================

Return ONLY valid JSON.

Do NOT return:

- Markdown
- \`\`\`json
- \`\`\`
- Explanations
- Introduction
- Conclusion
- Comments
- Extra text outside the JSON object

The first character must be "{".

The last character must be "}".

========================================
ID RULES
========================================

The roadmap "id" MUST be exactly:

${targetCareerId}

Do not modify, generate, or replace this ID.

The roadmap "topic" MUST be exactly:

${targetCareer} Roadmap

Each stage must have a numeric ID.

Each topic must have this structure:

{
  "name": "Topic name",
  "completed": false
}

========================================
COMPLETION RULES
========================================

For a newly generated roadmap:

- roadmap.completed must be false
- every stage.completed must be false
- every topic.completed must be false

Never mark anything completed.

Even if a skill appears in the user's current skills, its completed value must still be false.

The frontend will manage completion state.

========================================
ROADMAP ORDER
========================================

Arrange stages in the order the user should actually learn them.

Generally prefer:

Fundamentals
→ Core Skills
→ Tools
→ Frameworks
→ Specialization
→ Advanced Skills
→ Projects
→ Portfolio
→ Interview Preparation
→ Job Readiness

However, do not blindly follow this structure.

The correct order depends on:

- Target career
- Current skills
- Background
- Industry requirements

========================================
CAREER SPECIFICITY
========================================

The roadmap must be specifically designed for:

${targetCareer}

Do not create a generic computer science roadmap.

Only include skills relevant to the target career.

========================================
STAGES
========================================

Each stage should represent a meaningful learning area.

Choose stages appropriate for:

${targetCareer}

Do not create a separate stage for every tiny concept.

========================================
TOPICS
========================================

Each stage should contain approximately 3-8 topics.

Topics should be:

- Concise
- Practical
- Clearly related to the stage
- Useful for the target career

Avoid duplicate topics.

BAD:

Stage: JavaScript Variables
Stage: JavaScript Functions
Stage: JavaScript Arrays

GOOD:

Stage: JavaScript

Topics:

Variables
Functions
Arrays
Objects
DOM
Events
Async JavaScript

========================================
ROADMAP SIZE
========================================

Normally create approximately 10-18 stages.

The exact number can change depending on the career.

Do not make the roadmap unnecessarily large.

Do not create empty stages.

Focus on skills that are genuinely useful for:

${targetCareer}

========================================
PROJECTS
========================================

Include practical projects where appropriate.

Projects should gradually increase in difficulty:

Beginner
→ Intermediate
→ Advanced

Whenever reasonable, connect projects with the user's interests.

User interests:

${interests || "Not provided"}

Use the user's interests as project themes only when they make sense.

Do not force an interest into a project.

========================================
PRACTICALITY
========================================

Do not add technologies simply because they are popular.

Only include technologies, concepts, and skills that are genuinely useful for:

${targetCareer}

Prefer:

Important skills
→ Practical knowledge
→ Real projects
→ Industry tools

over unnecessary technologies.

========================================
CURRENT SKILL LEVEL
========================================

Use the user's current skills to determine where the roadmap should begin.

Current skills:

${currentSkills || "Not provided"}

Do not unnecessarily spend many stages teaching skills the user already understands.

However, all topics must still have:

"completed": false

========================================
PREVIOUS CONVERSATION
========================================

${previousConversation || "No previous conversation."}

========================================
LATEST USER MESSAGE
========================================

${message || "Create my roadmap."}

========================================
FINAL VALIDATION
========================================

Before returning the response, verify:

- The response is valid JSON.
- There is no Markdown.
- There is no text outside the JSON object.
- The roadmap ID is exactly "${targetCareerId}".
- The roadmap topic is exactly "${targetCareer} Roadmap".
- roadmap.completed is false.
- stages is an array.
- Every stage has:
  - id
  - title
  - completed
  - topics
- Every stage.completed is false.
- Every topic has:
  - name
  - completed
- Every topic.completed is false.
- There are no empty stages.
- The roadmap is specific to ${targetCareer}.
- The roadmap is personalized to the user.
- The learning order makes sense.
- Technologies are relevant.
- Projects are practical.

Return ONLY the JSON object.
`;

    // ==========================================
    // GENERATE ROADMAP
    // ==========================================

    console.log(
      "Generating roadmap for:",
      targetCareer
    );

    console.log(
      "Roadmap ID:",
      targetCareerId
    );

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    // ==========================================
    // GET AI RESPONSE
    // ==========================================

    let text = response.text?.trim() || "";

    if (!text) {
      throw new Error(
        "Gemini returned an empty roadmap."
      );
    }

    // ==========================================
    // CLEAN MARKDOWN
    // ==========================================

    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // ==========================================
    // PARSE JSON
    // ==========================================

    let roadmap;

    try {
      roadmap = JSON.parse(text);
    } catch (error) {
      console.error(
        "Gemini returned invalid JSON:"
      );

      console.error(text);

      return Response.json(
        {
          error:
            "The AI generated an invalid roadmap format. Please try again.",
          rawResponse: text,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // VALIDATE ROADMAP
    // ==========================================

    if (
      !roadmap ||
      typeof roadmap !== "object" ||
      Array.isArray(roadmap)
    ) {
      throw new Error(
        "Generated roadmap is not a valid object."
      );
    }

    if (!Array.isArray(roadmap.stages)) {
      throw new Error(
        "Generated roadmap does not contain valid stages."
      );
    }

    // ==========================================
    // NORMALIZE ROADMAP
    // ==========================================

    roadmap.id = targetCareerId;

    roadmap.topic =
      `${targetCareer} Roadmap`;

    // Always false for newly generated roadmaps
    roadmap.completed = false;

    roadmap.stages = roadmap.stages
      .map((stage, stageIndex) => ({
        id:
          typeof stage?.id === "number"
            ? stage.id
            : stageIndex + 1,

        title: String(
          stage?.title ||
            `Stage ${stageIndex + 1}`
        ).trim(),

        completed: false,

        topics: Array.isArray(stage?.topics)
          ? stage.topics
              .map((topic) => ({
                name: String(
                  topic?.name || ""
                ).trim(),

                completed: false,
              }))
              .filter(
                (topic) => topic.name
              )
          : [],
      }))
      .filter(
        (stage) =>
          stage.title &&
          stage.topics.length > 0
      );

    // ==========================================
    // FINAL VALIDATION
    // ==========================================

    if (roadmap.stages.length === 0) {
      throw new Error(
        "Generated roadmap contains no valid stages."
      );
    }

    // ==========================================
    // RETURN JSON
    // ==========================================

    return Response.json({
      roadmap,

      targetCareer: {
        id: targetCareerId,
        name: targetCareer,
      },
    });
  } catch (error) {
    console.error(
      "========== ROADMAP ERROR =========="
    );

    console.error(error);

    console.error(
      "==================================="
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Failed to generate roadmap.",
      },
      {
        status: 500,
      }
    );
  }
}