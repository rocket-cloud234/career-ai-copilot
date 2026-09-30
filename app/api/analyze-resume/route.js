import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // ==========================================
    // CHECK API KEY
    // ==========================================

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // GET UPLOADED FORM DATA
    // ==========================================

    const formData = await request.formData();

    const resume = formData.get("resume");
    const targetRole = formData.get("targetRole");

    // ==========================================
    // VALIDATE RESUME
    // ==========================================

    if (!resume) {
      return Response.json(
        {
          error: "Resume file is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // VALIDATE TARGET ROLE
    // ==========================================

    if (
      typeof targetRole !== "string" ||
      !targetRole.trim()
    ) {
      return Response.json(
        {
          error: "Target career role is required.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanTargetRole = targetRole.trim();

    // ==========================================
    // VALIDATE FILE
    // ==========================================

    if (resume.type !== "application/pdf") {
      return Response.json(
        {
          error:
            "Please upload your resume as a PDF.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 10 MB LIMIT
    // ==========================================

    if (resume.size > 10 * 1024 * 1024) {
      return Response.json(
        {
          error:
            "Resume must be smaller than 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "Resume received:",
      resume.name
    );

    console.log(
      "Resume size:",
      resume.size
    );

    console.log(
      "Target role:",
      cleanTargetRole
    );

    // ==========================================
    // CONVERT PDF TO BASE64
    // ==========================================

    const arrayBuffer =
      await resume.arrayBuffer();

    const base64Resume =
      Buffer.from(arrayBuffer).toString(
        "base64"
      );

    // ==========================================
    // RESUME ANALYSIS PROMPT
    // ==========================================

    const prompt = `
You are CareerAI, an expert career advisor.

Analyze the uploaded resume specifically for this
target role:

TARGET ROLE:
${cleanTargetRole}

Your task is to perform a detailed skill-gap analysis.

Analyze only information that is actually present in
the resume.

Do not invent:

- Experience
- Projects
- Education
- Certifications
- Skills
- Achievements
- Job responsibilities

If information is not present in the resume, say that
it is not demonstrated.

========================================
OVERALL JOB READINESS
========================================

Give a percentage from 0-100 and briefly explain why.

The percentage should represent how closely the resume's
demonstrated skills and experience align with the target
role.

Do not treat missing information as proof that the
candidate does not have the skill.

========================================
CURRENT SKILLS
========================================

List the technical and professional skills clearly
demonstrated in the resume.

Separate them into categories where useful:

- Programming
- Frameworks
- AI/ML
- Data
- Cloud/DevOps
- Tools
- Soft skills

Only include skills supported by the resume.

========================================
STRONG MATCHES
========================================

List the skills and experience that already match the
target role.

For each important match, briefly explain why it is
relevant.

========================================
SKILL GAPS
========================================

Identify the most important skills that are missing or
insufficiently demonstrated for the target role.

For each gap provide:

Skill:
Priority: High / Medium / Low
Reason:
What to learn:

Clearly distinguish between:

- Not mentioned in the resume
- Mentioned but insufficiently demonstrated
- Demonstrated but needing deeper experience

========================================
EXPERIENCE GAPS
========================================

Identify missing practical experience that would make
the candidate stronger for this role.

Focus on experience relevant to:

${cleanTargetRole}

Do not invent experience.

========================================
PROJECT RECOMMENDATIONS
========================================

Recommend 3-5 projects that would specifically help
close the identified gaps.

For each project include:

- Project name
- Skills learned
- Difficulty
- Why it helps

Projects should be realistic and directly relevant
to the target role.

========================================
LEARNING ROADMAP
========================================

Create a practical roadmap in this order:

1. Immediate priorities
2. Next skills
3. Projects
4. Advanced skills
5. Job preparation

Prioritize the most important gaps first.

Do not include unnecessary technologies.

========================================
RESUME IMPROVEMENTS
========================================

Give specific improvements to the resume based on the
target role.

Focus on:

- Missing keywords
- Weak bullet points
- Missing measurable impact
- Projects
- Technical skills
- Experience presentation

Do not invent achievements.

Instead, explain what type of measurable information
the candidate could add if they have it.

========================================
FINAL RECOMMENDATION
========================================

Give a short conclusion explaining:

1. How closely the demonstrated resume profile currently
   aligns with the target role.

2. The top 3 skills they should learn next.

3. The single most valuable project they should build.

Keep the response practical and concise.

Use Markdown.

========================================
IMPORTANT
========================================

Base the analysis on the uploaded resume.

Do not assume information that is not present.

Do not claim the candidate has a skill merely because
it is commonly required for the target role.

If something cannot be determined from the resume,
explicitly say so.

Target role:

${cleanTargetRole}
`;

    // ==========================================
    // OPENAI REQUEST
    // ==========================================

    console.log(
      "Sending resume to OpenAI..."
    );

    const response =
      await openai.chat.completions.create({
        model: "gpt-5.4-mini",

        messages: [
          {
            role: "system",
            content:
              "You are CareerAI, an expert career advisor. Analyze resumes carefully and only make claims supported by the uploaded resume. Do not invent candidate information.",
          },

          {
            role: "user",

            content: [
              {
                type: "text",
                text: prompt,
              },

              {
                type: "file",
                file: {
                  filename:
                    resume.name ||
                    "resume.pdf",

                  file_data:
                    `data:application/pdf;base64,${base64Resume}`,
                },
              },
            ],
          },
        ],
      });

    // ==========================================
    // GET AI RESPONSE
    // ==========================================

    const aiResponse =
      response?.choices?.[0]?.message?.content?.trim() ||
      "";

    // ==========================================
    // EMPTY RESPONSE CHECK
    // ==========================================

    if (!aiResponse) {
      throw new Error(
        "OpenAI returned an empty resume analysis."
      );
    }

    console.log(
      "Resume analysis completed successfully."
    );

    // ==========================================
    // RETURN
    // ==========================================

    return Response.json(
      {
        success: true,
        response: aiResponse,
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
      "========== RESUME ANALYSIS ERROR =========="
    );

    console.error(error);

    console.error(
      "==========================================="
    );

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to analyze the resume.",
      },
      {
        status: 500,
      }
    );
  }
}

