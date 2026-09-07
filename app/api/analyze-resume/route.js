import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error: "GEMINI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    // Get uploaded form data
    const formData = await request.formData();

    const resume = formData.get("resume");
    const targetRole = formData.get("targetRole");

    // Validate resume
    if (!resume) {
      return Response.json(
        {
          error: "Resume file is required.",
        },
        { status: 400 }
      );
    }

    // Validate target role
    if (!targetRole?.trim()) {
      return Response.json(
        {
          error: "Target career role is required.",
        },
        { status: 400 }
      );
    }

    // Only allow PDF for now
    if (resume.type !== "application/pdf") {
      return Response.json(
        {
          error: "Please upload your resume as a PDF.",
        },
        { status: 400 }
      );
    }

    // 10 MB limit
    if (resume.size > 10 * 1024 * 1024) {
      return Response.json(
        {
          error: "Resume must be smaller than 10 MB.",
        },
        { status: 400 }
      );
    }

    console.log("Resume received:", resume.name);
    console.log("Target role:", targetRole);

    // Convert PDF to base64
    const arrayBuffer = await resume.arrayBuffer();

    const base64Resume = Buffer.from(arrayBuffer).toString("base64");

    // Prompt for Gemini
    const prompt = `
You are CareerAI, an expert career advisor.

Analyze the uploaded resume specifically for this target role:

TARGET ROLE:
${targetRole}

Your task is to perform a detailed skill-gap analysis.

Analyze only information that is actually present in the resume.
Do not invent experience, projects, education, or skills.

Return the analysis using this structure:

## Overall Job Readiness

Give a percentage from 0-100 and briefly explain why.

## Current Skills

List the technical and professional skills clearly demonstrated in the resume.

Separate them into categories where useful:
- Programming
- Frameworks
- AI/ML
- Data
- Cloud/DevOps
- Tools
- Soft skills

## Strong Matches

List the skills and experience that already match the target role.

For each important match, briefly explain why it is relevant.

## Skill Gaps

Identify the most important skills missing or insufficiently demonstrated for the target role.

For each gap provide:

Skill:
Priority: High / Medium / Low
Reason:
What to learn:

## Experience Gaps

Identify missing practical experience that would make the candidate stronger for this role.

## Project Recommendations

Recommend 3-5 projects that would specifically help close the identified gaps.

For each project include:
- Project name
- Skills learned
- Difficulty
- Why it helps

## Learning Roadmap

Create a practical roadmap in this order:

1. Immediate priorities
2. Next skills
3. Projects
4. Advanced skills
5. Job preparation

## Resume Improvements

Give specific improvements to the resume based on the target role.

Focus on:
- Missing keywords
- Weak bullet points
- Missing measurable impact
- Projects
- Technical skills
- Experience presentation

## Final Recommendation

Give a short conclusion explaining:

1. How close the candidate currently is to the target role.
2. The top 3 skills they should learn next.
3. The single most valuable project they should build.

Keep the response practical and concise.
Use Markdown.
`;

    // Send PDF + prompt to Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Resume,
          },
        },
        {
          text: prompt,
        },
      ],
    });

    console.log("Resume analysis completed.");

    return Response.json({
      response: response.text,
    });
  } catch (error) {
    console.error("========== RESUME ANALYSIS ERROR ==========");
    console.error(error);
    console.error("===========================================");

    return Response.json(
      {
        error:
          error?.message ||
          "Failed to analyze the resume.",
      },
      { status: 500 }
    );
  }
}