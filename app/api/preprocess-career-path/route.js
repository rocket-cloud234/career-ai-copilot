import { GoogleGenAI } from "@google/genai";

// =========================================================
// GEMINI SETUP
// =========================================================

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing.");
}

const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
    })
  : null;

// =========================================================
// POST
// =========================================================

export async function POST(request) {
  try {
    // =======================================================
    // CHECK API KEY
    // =======================================================

    if (!apiKey || !ai) {
      return Response.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // READ REQUEST
    // =======================================================

    let body;

    try {
      body = await request.json();
    } catch (error) {
      console.error("Invalid request JSON:", error);

      return Response.json(
        {
          success: false,
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const message = body?.message;

    // =======================================================
    // VALIDATE MESSAGE
    // =======================================================

    if (!message || typeof message !== "string") {
      return Response.json(
        {
          success: false,
          error: "A valid message is required.",
        },
        {
          status: 400,
        }
      );
    }

    // =======================================================
    // REMOVE INTERNAL MARKER
    // =======================================================

    const cleanMessage = message
      .replace(/UK41Z_CAREER_PATH_INPUT/g, "")
      .trim();

    if (!cleanMessage) {
      return Response.json(
        {
          success: false,
          error: "Career guidance message is empty.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("========================================");
    console.log("CAREER PATH PREPROCESSING STARTED");
    console.log("========================================");

    console.log("Career guidance message:");
    console.log(cleanMessage);

    // =======================================================
    // PROMPT
    // =======================================================

    const prompt = `
You are CareerAI's career-path extraction system.

Your task is to analyze the career guidance message below and
extract the most appropriate career paths for the user.

The message may contain:
- Career recommendations
- Career options
- Explanations about why a career fits
- User interests
- User skills
- User background
- Technical abilities
- Creative interests
- Education
- Experience

Based on that information, return the best career paths for the user.

IMPORTANT:

Return ONLY a JSON object.

Required format:

{
  "careerPathOptions": [
    {
      "id": "ui-ux-designer",
      "title": "UI/UX Designer",
      "description": "Design intuitive and visually appealing digital experiences."
    }
  ]
}

RULES:

1. Return between 2 and 5 career paths.

2. Every career path must be meaningfully different.

3. Do not return duplicate careers.

4. "id" must:
   - be lowercase
   - use kebab-case
   - contain only letters, numbers and hyphens
   - be unique

5. "title" must be the normal career name.

6. "description" must:
   - be one sentence
   - be short
   - clearly explain what the career involves
   - not contain unnecessary motivation

7. Prefer career paths explicitly recommended in the message.

8. If the message contains several reasonable career choices,
   return those choices.

9. Do not invent highly unrelated careers.

10. Consider both technical and creative interests.

11. Do not return markdown.

12. Do not return code fences.

13. Do not return explanations outside the JSON object.

14. Return ONLY the JSON object.

CAREER GUIDANCE MESSAGE:

${cleanMessage}
`;

    // =======================================================
    // GEMINI REQUEST
    // =======================================================

    console.log("Sending career path request to Gemini...");

    let result;

    try {
      result = await ai.models.generateContent({
         model: "gemini-3.6-flash",
        contents: prompt,


        config: {
          responseMimeType: "application/json",
        },
      });
    } catch (geminiError) {
      console.error("Gemini API error:");
      console.error(geminiError);

      return Response.json(
        {
          success: false,
          error:
            geminiError?.message ||
            "Gemini career path request failed.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // GET RESPONSE TEXT
    // =======================================================

    const text = result?.text?.trim();

    console.log("Gemini career path response:");
    console.log(text);

    if (!text) {
      return Response.json(
        {
          success: false,
          error: "Gemini returned an empty response.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // CLEAN RESPONSE
    // =======================================================

    let jsonText = text.trim();

    // Remove markdown code fences just in case
    jsonText = jsonText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // =======================================================
    // EXTRACT JSON OBJECT
    // =======================================================

    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.slice(
        firstBrace,
        lastBrace + 1
      );
    }

    // =======================================================
    // PARSE JSON
    // =======================================================

    let parsed;

    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("========================================");
      console.error("CAREER PATH JSON PARSE ERROR");
      console.error("========================================");

      console.error("Raw Gemini response:");
      console.error(text);

      console.error("Cleaned JSON:");
      console.error(jsonText);

      console.error(parseError);

      return Response.json(
        {
          success: false,
          error: "Gemini returned invalid career path JSON.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // VALIDATE ROOT OBJECT
    // =======================================================

    if (!parsed || typeof parsed !== "object") {
      return Response.json(
        {
          success: false,
          error: "Invalid career path response object.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // VALIDATE ARRAY
    // =======================================================

    if (!Array.isArray(parsed.careerPathOptions)) {
      console.error(
        "Missing careerPathOptions:",
        parsed
      );

      return Response.json(
        {
          success: false,
          error:
            "Gemini response does not contain careerPathOptions.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // NORMALIZE CAREER PATHS
    // =======================================================

    const careerPathOptions = parsed.careerPathOptions
      .filter((item) => {
        return (
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.description === "string"
        );
      })
      .map((item) => {
        const id = item.id
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        return {
          id,
          title: item.title.trim(),
          description: item.description.trim(),
        };
      })
      .filter((item) => {
        return (
          item.id &&
          item.title &&
          item.description
        );
      });

    // =======================================================
    // REMOVE DUPLICATE IDS
    // =======================================================

    const uniqueCareerPaths = [];

    const usedIds = new Set();

    for (const career of careerPathOptions) {
      if (!usedIds.has(career.id)) {
        usedIds.add(career.id);
        uniqueCareerPaths.push(career);
      }
    }

    // =======================================================
    // LIMIT TO 5
    // =======================================================

    const finalCareerPaths =
      uniqueCareerPaths.slice(0, 5);

    // =======================================================
    // REQUIRE AT LEAST 2
    // =======================================================

    if (finalCareerPaths.length < 2) {
      console.error(
        "Not enough valid career paths:",
        finalCareerPaths
      );

      return Response.json(
        {
          success: false,
          error:
            "Gemini returned fewer than 2 valid career paths.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // SUCCESS
    // =======================================================

    console.log("========================================");
    console.log("CAREER PATHS GENERATED SUCCESSFULLY");
    console.log("========================================");

    console.log(finalCareerPaths);

    return Response.json({
      success: true,
      careerPathOptions: finalCareerPaths,
    });

  } catch (error) {
    // =======================================================
    // UNEXPECTED ERROR
    // =======================================================

    console.error("========================================");
    console.error("CAREER PATH PREPROCESSING ERROR");
    console.error("========================================");

    console.error(error);

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Career path preprocessing failed.",
      },
      {
        status: 500,
      }
    );
  }
}
