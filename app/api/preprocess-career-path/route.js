import { GoogleGenAI } from "@google/genai";

// =========================================================
// GEMINI SETUP
// =========================================================

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
    })
  : null;

const MODEL = "gemini-3.6-flash";
const CAREER_PATH_MARKER = "UK41Z_CAREER_PATH_INPUT";

// =========================================================
// HELPERS
// =========================================================

function errorMessage(error) {
  if (!error) {
    return "Unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.message ||
    error?.error?.message ||
    error?.details?.[0]?.message ||
    "Unknown Gemini API error"
  );
}

function cleanCareerId(id) {
  return String(id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJson(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  let cleaned = text.trim();

  // Remove ```json ... ``` if Gemini returns markdown
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Find JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    return null;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function normalizeCareerPaths(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  const uniqueCareerPaths = [];
  const usedIds = new Set();

  for (const item of options) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const id = cleanCareerId(item.id);
    const title = cleanText(item.title);
    const description = cleanText(item.description);

    if (!id || !title || !description) {
      continue;
    }

    if (usedIds.has(id)) {
      continue;
    }

    usedIds.add(id);

    uniqueCareerPaths.push({
      id,
      title,
      description,
    });
  }

  return uniqueCareerPaths.slice(0, 5);
}

// =========================================================
// POST
// =========================================================

export async function POST(request) {
  console.log("");
  console.log("========================================");
  console.log("CAREER PATH API REQUEST");
  console.log("========================================");

  try {
    // =======================================================
    // CHECK API KEY
    // =======================================================

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

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

    if (!ai) {
      console.error("Gemini client was not initialized.");

      return Response.json(
        {
          success: false,
          error: "Gemini client is not initialized.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // READ REQUEST BODY
    // =======================================================

    let body;

    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse request JSON.");
      console.error(error);

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

    // =======================================================
    // GET MESSAGE
    // =======================================================

    const originalMessage = body?.message;

    if (
      typeof originalMessage !== "string" ||
      !originalMessage.trim()
    ) {
      console.error("Invalid message:", originalMessage);

      return Response.json(
        {
          success: false,
          error: "A valid career guidance message is required.",
        },
        {
          status: 400,
        }
      );
    }

    // =======================================================
    // REMOVE INTERNAL MARKER
    // =======================================================

    const cleanMessage = originalMessage
      .replace(new RegExp(CAREER_PATH_MARKER, "g"), "")
      .trim();

    if (!cleanMessage) {
      console.error("Career message became empty after marker removal.");

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

    console.log("Model:", MODEL);
    console.log("Career message:");
    console.log(cleanMessage);

    // =======================================================
    // PROMPT
    // =======================================================

    const prompt = `
You are CareerAI's career-path extraction system.

Analyze the career guidance message provided below and identify
the most appropriate career paths for the user.

The message may contain:

- Career recommendations
- Career options
- User interests
- User skills
- User education
- User background
- Technical abilities
- Creative interests
- Experience
- Career goals

Return between 2 and 5 career paths.

IMPORTANT:

Return ONLY a valid JSON object.

Do not return markdown.
Do not return code fences.
Do not return explanations.
Do not return text outside the JSON object.

Required JSON format:

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

4. The "id" must:
   - be lowercase
   - use kebab-case
   - contain only letters, numbers and hyphens
   - be unique

5. The "title" must be the normal career name.

6. The "description" must:
   - be exactly one short sentence
   - clearly describe what the career involves
   - avoid unnecessary motivation
   - avoid mentioning that the career is "perfect"

7. Prefer careers explicitly recommended in the user's message.

8. If several reasonable career choices are mentioned, return those choices.

9. Do not invent unrelated careers.

10. Consider both technical and creative interests.

11. Return ONLY the JSON object.

CAREER GUIDANCE MESSAGE:

${cleanMessage}
`;

    // =======================================================
    // CALL GEMINI
    // =======================================================

    console.log("");
    console.log("Sending request to Gemini...");
    console.log("Model:", MODEL);

    let result;

    try {
      result = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } catch (geminiError) {
      console.error("");
      console.error("========================================");
      console.error("GEMINI API ERROR");
      console.error("========================================");

      console.error("Name:", geminiError?.name);
      console.error("Message:", geminiError?.message);
      console.error("Status:", geminiError?.status);
      console.error("Code:", geminiError?.code);
      console.error("Error:", geminiError);

      return Response.json(
        {
          success: false,
          error: errorMessage(geminiError),
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // GET GEMINI TEXT
    // =======================================================

    let text = "";

    try {
      // Current @google/genai response
      if (typeof result?.text === "string") {
        text = result.text.trim();
      }

      // Fallback for alternate response structure
      if (!text && typeof result?.response?.text === "function") {
        text = result.response.text().trim();
      }
    } catch (error) {
      console.error("Could not read Gemini response text.");
      console.error(error);
    }

    console.log("");
    console.log("========================================");
    console.log("GEMINI RESPONSE");
    console.log("========================================");

    console.log(text);

    // =======================================================
    // EMPTY RESPONSE
    // =======================================================

    if (!text) {
      console.error("Gemini returned an empty response.");

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
    // EXTRACT JSON
    // =======================================================

    const jsonText = extractJson(text);

    if (!jsonText) {
      console.error("");
      console.error("========================================");
      console.error("JSON EXTRACTION FAILED");
      console.error("========================================");

      console.error("Raw Gemini response:");
      console.error(text);

      return Response.json(
        {
          success: false,
          error: "Gemini did not return a valid JSON object.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // PARSE JSON
    // =======================================================

    let parsed;

    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("");
      console.error("========================================");
      console.error("JSON PARSE ERROR");
      console.error("========================================");

      console.error("Raw response:");
      console.error(text);

      console.error("Extracted JSON:");
      console.error(jsonText);

      console.error("Parse error:");
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

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      console.error("Invalid Gemini root object:", parsed);

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
    // VALIDATE CAREER PATH ARRAY
    // =======================================================

    if (!Array.isArray(parsed.careerPathOptions)) {
      console.error(
        "careerPathOptions is missing or is not an array."
      );

      console.error("Gemini object:");
      console.error(parsed);

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
    // NORMALIZE
    // =======================================================

    const careerPathOptions = normalizeCareerPaths(
      parsed.careerPathOptions
    );

    console.log("");
    console.log("Normalized career paths:");
    console.log(careerPathOptions);

    // =======================================================
    // REQUIRE AT LEAST 2
    // =======================================================

    if (careerPathOptions.length < 2) {
      console.error("");
      console.error("========================================");
      console.error("NOT ENOUGH CAREER PATHS");
      console.error("========================================");

      console.error(
        "Gemini returned:",
        parsed.careerPathOptions
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

    console.log("");
    console.log("========================================");
    console.log("CAREER PATHS GENERATED SUCCESSFULLY");
    console.log("========================================");

    console.log(careerPathOptions);

    return Response.json(
      {
        success: true,
        careerPathOptions,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    // =======================================================
    // UNEXPECTED ERROR
    // =======================================================

    console.error("");
    console.error("========================================");
    console.error("UNEXPECTED CAREER PATH ERROR");
    console.error("========================================");

    console.error("Name:", error?.name);
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);
    console.error("Full error:", error);

    return Response.json(
      {
        success: false,
        error: errorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}
