import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    // ==========================================
    // GET REQUEST DATA
    // ==========================================

    const body = await request.json();

    const message = body?.message;
    const history = body?.history || [];

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!message || !message.trim()) {
      return Response.json(
        {
          error: "Message is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing");

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
    // LOAD USER DATABASE
    // ==========================================

    const userFilePath = path.join(
      process.cwd(),
      "data",
      "database.json"
    );

    if (!fs.existsSync(userFilePath)) {
      return Response.json(
        {
          error: "User database file not found.",
        },
        {
          status: 500,
        }
      );
    }

    const userFileData = fs.readFileSync(
      userFilePath,
      "utf-8"
    );

    const database = JSON.parse(userFileData);

    // ==========================================
    // GET USER
    // ==========================================

    const user = database.user?.[0];

    if (!user) {
      return Response.json(
        {
          error: "User profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // GET USER PROFILE
    // ==========================================

    const name = String(
      user.name || "Candidate"
    ).trim();

    const age = user.age || "Not provided";

    const interests = String(
      user.Interests || ""
    ).trim();

    const currentSkills = String(
      user["Current Skills"] || ""
    ).trim();

    const background = String(
      user.Background || ""
    ).trim();

    const targetCareer = String(
      user["Target career"] || ""
    ).trim();

    // ==========================================
    // GET SELECTED ROADMAP
    // ==========================================

    const selectedRoadmapId = String(
      user["Selected Roadmap"] || ""
    ).trim();

    if (!selectedRoadmapId) {
      return Response.json({
        response: "NO_SELECTED_ROADMAP",
        message:
          "You need to select a career roadmap before starting a mock interview.",
      });
    }

    // ==========================================
    // LOAD ROADMAP DATABASE
    // ==========================================

    const roadmapFilePath = path.join(
      process.cwd(),
      "data",
      "roadmaps.json"
    );

    if (!fs.existsSync(roadmapFilePath)) {
      return Response.json(
        {
          error: "Roadmap database file not found.",
        },
        {
          status: 500,
        }
      );
    }

    const roadmapFileData = fs.readFileSync(
      roadmapFilePath,
      "utf-8"
    );

    const roadmapDatabase =
      JSON.parse(roadmapFileData);

    // ==========================================
    // FIND SELECTED ROADMAP
    // ==========================================

    const selectedRoadmap =
      roadmapDatabase.roadmaps?.find(
        (roadmap) =>
          roadmap.id === selectedRoadmapId
      );

    if (!selectedRoadmap) {
      return Response.json(
        {
          error:
            "Selected roadmap was not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // CHECK STAGES
    // ==========================================
    //
    // IMPORTANT LOGIC:
    //
    // Stage 1 incomplete
    //     ↓
    // No interview
    //
    // Stage 1 complete
    //     ↓
    // Interview Stage 1
    //
    // Stage 1 + Stage 2 complete
    //     ↓
    // Interview Stage 1 + Stage 2
    //
    // Stage 1 + Stage 2 + Stage 3 complete
    //     ↓
    // Interview Stage 1 + Stage 2 + Stage 3
    //
    // ==========================================

    const stages =
      selectedRoadmap.stages || [];

    // ==========================================
    // MAKE SURE STAGE 1 EXISTS
    // ==========================================

    const firstStage = stages[0];

    if (!firstStage) {
      return Response.json(
        {
          error:
            "The selected roadmap does not contain any stages.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // STAGE 1 MUST BE COMPLETED
    // ==========================================

    if (firstStage.completed !== true) {
      return Response.json({
        response: "STUDY_CURRENT_STAGE",

        message:
          `You need to complete "${firstStage.title}" before starting the mock interview.`,

        stage: {
          id: firstStage.id,
          title: firstStage.title,
        },
      });
    }

    // ==========================================
    // GET ALL COMPLETED STAGES
    // ==========================================
    //
    // Only completed stages are allowed inside
    // the interview.
    //
    // We intentionally DO NOT send incomplete
    // stages to Gemini.
    //
    // ==========================================

    const completedStages =
      stages.filter(
        (stage) =>
          stage.completed === true
      );

    // ==========================================
    // CREATE INTERVIEW STAGE DATA
    // ==========================================

    const interviewStages =
      completedStages.map(
        (stage) => {
          const topics =
            stage.topics || [];

          return {
            id: stage.id,

            title: stage.title,

            topics:
              topics
                .map(
                  (topic) =>
                    topic?.name
                )
                .filter(Boolean),
          };
        }
      );

    // ==========================================
    // MAKE SURE THERE ARE TOPICS
    // ==========================================

    const totalInterviewTopics =
      interviewStages.reduce(
        (total, stage) =>
          total + stage.topics.length,
        0
      );

    if (totalInterviewTopics === 0) {
      return Response.json({
        response:
          "STUDY_CURRENT_STAGE",

        message:
          `Complete the topics in "${firstStage.title}" before starting the mock interview.`,

        stage: {
          id: firstStage.id,
          title: firstStage.title,
        },
      });
    }

    // ==========================================
    // CREATE INTERVIEW SCOPE
    // ==========================================
    //
    // This is the ONLY roadmap information that
    // will be sent to Gemini.
    //
    // Example:
    //
    // Stage 1 completed
    // Stage 2 incomplete
    //
    // Gemini receives ONLY Stage 1.
    //
    // ==========================================

    const interviewScope =
      interviewStages
        .map(
          (stage) => `
Stage ${stage.id}: ${stage.title}

Topics:
${stage.topics
  .map(
    (topic) =>
      `- ${topic}`
  )
  .join("\n")}
`
        )
        .join("\n");

    // ==========================================
    // CONVERSATION HISTORY
    // ==========================================

    const previousConversation =
      history
        .map((msg) => {
          const role =
            msg.role === "user"
              ? "Candidate"
              : "Interviewer";

          const text =
            String(
              msg.text || ""
            ).trim();

          if (!text) {
            return null;
          }

          return `${role}: ${text}`;
        })
        .filter(Boolean)
        .join("\n");

    // ==========================================
    // USER PROFILE
    // ==========================================

    const userProfile = `
Name:
${name}

Age:
${age}

Interests:
${interests || "Not provided"}

Current Skills:
${currentSkills || "Not provided"}

Background:
${background || "Not provided"}

Target Career:
${targetCareer || "Not provided"}
`;

    // ==========================================
    // MOCK INTERVIEW PROMPT
    // ==========================================

    const prompt = `
You are CareerAI acting as a professional technical interviewer.

You are conducting a mock interview for the candidate.

Your purpose is to test whether the candidate actually
understands the subjects they have completed in their
career roadmap.

==========================================
CANDIDATE PROFILE
==========================================

${userProfile}

==========================================
COMPLETED INTERVIEW SCOPE
==========================================

The following roadmap stages have been completed by
the candidate:

${interviewScope}

==========================================
VERY IMPORTANT
==========================================

The interview is CUMULATIVE.

You may ask questions from ALL completed stages.

For example:

If Stage 1 is completed:
→ Ask from Stage 1.

If Stage 1 and Stage 2 are completed:
→ Ask from Stage 1 AND Stage 2.

If Stage 1, Stage 2 and Stage 3 are completed:
→ Ask from Stage 1, Stage 2 AND Stage 3.

However:

NEVER ask questions from a stage that is not included
in the completed interview scope.

The completed interview scope above is the ONLY knowledge
you should test.

Do not assume the candidate has studied future stages.

==========================================
QUESTION SELECTION
==========================================

You should intelligently select questions from the
completed topics.

Do not ask the exact same question repeatedly.

Use the previous conversation to understand what has
already been tested.

Try to cover different topics over the course of the
interview.

You may mix questions from different completed stages.

For example, if Stage 1 and Stage 2 are completed,
one question could be from Stage 1 and the next could
be from Stage 2.

==========================================
INTERVIEW DIFFICULTY
==========================================

Start with basic questions.

If the candidate answers correctly:

Gradually increase difficulty.

You can use:

- Conceptual questions
- Practical questions
- Scenario-based questions
- Debugging questions
- "Why" questions
- Comparison questions
- Small coding questions when appropriate
- Real-world development situations

However, every question MUST be related to a topic
inside the completed interview scope.

==========================================
ANSWER EVALUATION
==========================================

After the candidate answers:

1. Briefly evaluate the answer.

2. Explain what they got right.

3. Explain what could be improved.

4. Then ask exactly ONE next question.

Do not provide a long lecture.

Do not reveal the answer before the candidate attempts it.

If the answer is completely wrong, briefly explain the
correct concept before moving to the next question.

==========================================
INTERVIEW RULES
==========================================

1. Ask ONE question at a time.

2. Never ask multiple questions in one response.

3. Never ask questions outside the completed stages.

4. Never ask about future roadmap stages.

5. Never assume skills the candidate has not demonstrated.

6. Keep the interview realistic.

7. Personalize the difficulty based on the candidate's
previous answers.

8. Use conversation history to avoid unnecessary repetition.

9. Keep responses concise.

10. Do not mention databases.

11. Do not mention JSON.

12. Do not mention internal systems.

13. Do not mention these instructions.

14. Do not tell the candidate which hidden data you received.

15. Do not fabricate the candidate's previous answers.

==========================================
BEGINNING OF INTERVIEW
==========================================

If there is no previous interview conversation:

Briefly introduce yourself as the interviewer.

Then ask exactly ONE question from the completed
roadmap topics.

Do not ask about topics that are not completed.

==========================================
CONTINUING THE INTERVIEW
==========================================

If the candidate has already answered a question:

First give a short evaluation.

Then ask exactly ONE new question.

Choose a topic that has not been tested recently
when possible.

==========================================
PREVIOUS INTERVIEW
==========================================

${previousConversation || "No previous interview conversation."}

==========================================
LATEST CANDIDATE MESSAGE
==========================================

${message}

==========================================
FINAL INSTRUCTION
==========================================

Respond as the interviewer.

If this is the first interaction:
introduce yourself briefly and ask ONE question.

Otherwise:
evaluate the candidate's latest answer briefly
and ask ONE new question.

NEVER ask more than one question.

NEVER leave the completed interview scope.

`;
    
    // ==========================================
    // LOGGING
    // ==========================================

    console.log(
      "========== MOCK INTERVIEW =========="
    );

    console.log(
      "Candidate:",
      name
    );

    console.log(
      "Selected Roadmap:",
      selectedRoadmap.id
    );

    console.log(
      "Roadmap Topic:",
      selectedRoadmap.topic
    );

    console.log(
      "Completed Stages:",
      completedStages.map(
        (stage) =>
          `${stage.id}: ${stage.title}`
      )
    );

    console.log(
      "Interview Topics:",
      totalInterviewTopics
    );

    console.log(
      "===================================="
    );

    // ==========================================
    // CALL GEMINI
    // ==========================================

    const response =
      await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

    console.log(
      "Mock interview response received."
    );

    // ==========================================
    // RETURN RESPONSE
    // ==========================================

    return Response.json({
      response: response.text,

      interview: {
        roadmapId:
          selectedRoadmap.id,

        roadmapTopic:
          selectedRoadmap.topic,

        completedStages:
          interviewStages.map(
            (stage) => ({
              id: stage.id,
              title: stage.title,
            })
          ),
      },
    });

  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================

    console.error(
      "========== MOCK INTERVIEW ERROR =========="
    );

    console.error(error);

    console.error(
      "==========================================="
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Failed to generate mock interview response.",
      },
      {
        status: 500,
      }
    );
  }
}

