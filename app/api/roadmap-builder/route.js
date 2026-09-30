import OpenAI from "openai";
import clientPromise from "../../lib/mongodb";
import { getAuthUser } from "../../lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // ==========================================
    // API KEY
    // ==========================================

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          success: false,
          error: "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const authUser = await getAuthUser(request);

    if (!authUser) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized. Please log in.",
        },
        {
          status: 401,
        }
      );
    }

    const userId = String(
      authUser.userId || ""
    ).trim();

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "Invalid authenticated user.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // GET REQUEST DATA
    // ==========================================

    const body = await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const history = Array.isArray(body?.history)
      ? body.history
      : [];

    // ==========================================
    // MONGODB
    // ==========================================

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "careerai"
    );

    const users = db.collection("users");

    const roadmapsCollection =
      db.collection("roadmaps");

    // ==========================================
    // GET AUTHENTICATED USER
    // ==========================================

    const user = await users.findOne({
      userId,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "User account not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // USER PROFILE
    // ==========================================

    const name = String(
      user.name || ""
    ).trim();

    const interests = String(
      user.interests || ""
    ).trim();

    const currentSkills = String(
      user.currentSkills || ""
    ).trim();

    const background = String(
      user.background || ""
    ).trim();

    // ==========================================
    // CALCULATE AGE FROM DOB
    // ==========================================

    let age = "";

    if (user.dob) {
      const birthDate =
        new Date(user.dob);

      if (
        !Number.isNaN(
          birthDate.getTime()
        )
      ) {
        const today = new Date();

        let calculatedAge =
          today.getFullYear() -
          birthDate.getFullYear();

        const monthDifference =
          today.getMonth() -
          birthDate.getMonth();

        if (
          monthDifference < 0 ||
          (
            monthDifference === 0 &&
            today.getDate() <
              birthDate.getDate()
          )
        ) {
          calculatedAge--;
        }

        if (calculatedAge >= 0) {
          age = calculatedAge;
        }
      }
    }

    // ==========================================
    // TARGET CAREER
    // ==========================================
    //
    // The target career is taken from the
    // authenticated user's MongoDB profile.
    //
    // The frontend should NOT be trusted
    // to provide the user's identity.
    //
    // ==========================================

    const targetCareer = String(
      user.targetCareer || ""
    ).trim();

    const targetCareerId = String(
      user.targetCareerId || ""
    ).trim();

    // ==========================================
    // TARGET CAREER CHECK
    // ==========================================

    if (
      !targetCareer ||
      !targetCareerId
    ) {
      return Response.json(
        {
          success: false,

          response:
            "UK41Z_LAUNCH_TARGET_CAREER",

          error:
            "Please select a target career before generating a roadmap.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // HISTORY
    // ==========================================

    const previousConversation =
      history
        .map((msg) => {
          const role =
            msg?.role === "user"
              ? "User"
              : "CareerAI";

          const text =
            typeof msg?.text === "string"
              ? msg.text
              : "";

          return `${role}: ${text}`;
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
      "Generating roadmap with OpenAI"
    );

    console.log(
      "User ID:",
      userId
    );

    console.log(
      "Target career:",
      targetCareer
    );

    console.log(
      "Roadmap ID:",
      targetCareerId
    );

    const response =
      await openai.chat.completions.create({
        model: "gpt-5.4-mini",

        messages: [
          {
            role: "system",

            content:
              "You are CareerAI. Return only the requested JSON object. Never return Markdown or explanatory text.",
          },

          {
            role: "user",

            content: prompt,
          },
        ],

        response_format: {
          type: "json_object",
        },
      });

    // ==========================================
    // GET AI RESPONSE
    // ==========================================

    let text =
      response?.choices?.[0]
        ?.message?.content
        ?.trim() || "";

    if (!text) {
      throw new Error(
        "OpenAI returned an empty roadmap."
      );
    }

    // ==========================================
    // CLEAN MARKDOWN
    // ==========================================

    text = text
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

    // ==========================================
    // PARSE JSON
    // ==========================================

    let roadmap;

    try {
      roadmap = JSON.parse(text);
    } catch (error) {
      console.error(
        "OpenAI returned invalid JSON:"
      );

      console.error(text);

      return Response.json(
        {
          success: false,

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
    // VALIDATE ROADMAP OBJECT
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

    if (
      !Array.isArray(
        roadmap.stages
      )
    ) {
      throw new Error(
        "Generated roadmap does not contain valid stages."
      );
    }

    // ==========================================
    // NORMALIZE ROADMAP
    // ==========================================

    roadmap.id =
      targetCareerId;

    roadmap.topic =
      `${targetCareer} Roadmap`;

    roadmap.completed = false;

    roadmap.stages =
      roadmap.stages
        .map(
          (
            stage,
            stageIndex
          ) => ({
            id:
              typeof stage?.id ===
              "number"
                ? stage.id
                : stageIndex + 1,

            title: String(
              stage?.title ||
                `Stage ${
                  stageIndex + 1
                }`
            ).trim(),

            completed: false,

            topics:
              Array.isArray(
                stage?.topics
              )
                ? stage.topics
                    .map(
                      (topic) => ({
                        name: String(
                          topic?.name ||
                            ""
                        ).trim(),

                        completed:
                          false,
                      })
                    )
                    .filter(
                      (topic) =>
                        topic.name
                          .length > 0
                    )
                : [],
          })
        )
        .filter(
          (stage) =>
            stage.title &&
            stage.topics.length >
              0
        );

    // ==========================================
    // FINAL VALIDATION
    // ==========================================

    if (
      roadmap.stages.length ===
      0
    ) {
      throw new Error(
        "Generated roadmap contains no valid stages."
      );
    }

    // ==========================================
    // SAVE ROADMAP
    // ==========================================

    const now = new Date();

    // ==========================================
    // IMPORTANT
    // ==========================================
    //
    // userId + roadmap.id identify the roadmap.
    //
    // Example:
    //
    // User A + frontend
    //
    // User B + frontend
    //
    // These are TWO different documents.
    //
    // ==========================================

    const roadmapDocument = {
      userId,

      id: roadmap.id,

      roadmapId:
        roadmap.id,

      topic:
        roadmap.topic,

      targetCareer,

      targetCareerId,

      completed:
        roadmap.completed,

      stages:
        roadmap.stages,

      updatedAt:
        now,
    };

    // ==========================================
    // UPSERT ROADMAP
    // ==========================================

    await roadmapsCollection.updateOne(
      {
        userId,

        id: roadmap.id,
      },

      {
        // --------------------------------------
        // Updated every generation
        // --------------------------------------

        $set: {
          ...roadmapDocument,
        },

        // --------------------------------------
        // Created only once
        // --------------------------------------

        $setOnInsert: {
          createdAt: now,
        },
      },

      {
        upsert: true,
      }
    );

    console.log(
      "Roadmap saved successfully."
    );

    console.log(
      "User:",
      userId
    );

    console.log(
      "Roadmap:",
      roadmap.id
    );

    // ==========================================
    // GET SAVED ROADMAP
    // ==========================================

    const savedRoadmap =
      await roadmapsCollection.findOne(
        {
          userId,

          id: roadmap.id,
        }
      );

    if (!savedRoadmap) {
      throw new Error(
        "Roadmap was generated but could not be retrieved from MongoDB."
      );
    }

    // ==========================================
    // RETURN ROADMAP
    // ==========================================

    return Response.json(
      {
        success: true,

        message:
          "Roadmap generated and saved successfully.",

        roadmap: {
          ...savedRoadmap,

          _id:
            savedRoadmap._id
              ? savedRoadmap._id.toString()
              : undefined,
        },

        user: {
          userId,

          name:
            user.name || "",

          email:
            user.email || "",
        },

        targetCareer: {
          id:
            targetCareerId,

          name:
            targetCareer,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    // ==========================================
    // ERROR
    // ==========================================

    console.error(
      "========== ROADMAP ERROR =========="
    );

    console.error(error);

    console.error(
      "==================================="
    );

    return Response.json(
      {
        success: false,

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

