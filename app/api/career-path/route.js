import { GoogleGenAI } from "@google/genai";

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
    const aboutYou = body?.aboutYou || {};

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
    // GET USER PROFILE FROM FRONTEND STATE
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

    const targetCareer = String(
      aboutYou.targetCareer || ""
    ).trim();

    const selectedRoadmap = String(
      aboutYou.selectedRoadmap || ""
    ).trim();

    // ==========================================
    // DEBUG PROFILE
    // ==========================================

    console.log("Received user state:", {
      name,
      age,
      interests,
      currentSkills,
      background,
      targetCareer,
      selectedRoadmap,
    });

    // ==========================================
    // DETECT CAREER RELATED QUESTION
    // ==========================================

    const careerKeywords = [
      "career",
      "career path",
      "career option",
      "career options",
      "which career",
      "what career",
      "career choice",
      "career choices",
      "career direction",
      "career recommendation",
      "career recommendations",
      "job path",
      "future career",
      "find my career",
      "find career",
      "career suggestions",
      "career advice",
      "what should i become",
      "what should i do",
      "which job",
      "which field",
    ];

    const lowerMessage = message.toLowerCase();

    const isCareerQuestion = careerKeywords.some(
      (keyword) =>
        lowerMessage.includes(keyword)
    );

    // ==========================================
    // GEMINI PROFILE VALIDATION
    // ==========================================

    if (isCareerQuestion) {
      console.log(
        "Career question detected. Validating profile..."
      );

      const validationPrompt = `
You are a STRICT profile-data validator for an AI career assistant.

Your job is to determine whether the user's profile contains
REAL and USEFUL information for recommending a career.

------------------------------------------
USER INTERESTS
------------------------------------------

${interests || "EMPTY"}

------------------------------------------
USER CURRENT SKILLS
------------------------------------------

${currentSkills || "EMPTY"}

------------------------------------------
USER BACKGROUND
------------------------------------------

${background || "EMPTY"}

------------------------------------------
WHAT COUNTS AS USEFUL INFORMATION?
------------------------------------------

INTERESTS are useful when they tell us what the person genuinely
likes, enjoys, does as a hobby, or wants to explore.

Examples:

"I like drawing, designing and making websites."

"I enjoy gaming, creating videos and learning new technology."

"I like talking to people and solving problems."

"I enjoy making things and working on creative projects."

"I like programming and building applications."

------------------------------------------

CURRENT SKILLS are useful when they tell us something the person
can actually do or has experience with.

Examples:

"I know Python and basic JavaScript."

"I can make simple websites."

"I know HTML, CSS and React."

"I have basic graphic design skills."

"I know how to use Git."

"I can edit videos and use Photoshop."

------------------------------------------

BACKGROUND can contain useful information about education,
projects, work experience or previous activities.

------------------------------------------
USELESS INFORMATION
------------------------------------------

Treat information as USELESS if it is:

- Empty
- Only spaces
- Random characters
- Keyboard spam
- Gibberish
- Repeated meaningless letters
- Insults
- Abuse
- Jokes unrelated to the person's profile
- Random conversation
- Commands unrelated to career information
- Numbers without useful context
- Test data
- Placeholder text
- Nonsense sentences
- Text that does not tell us anything useful about the person

Examples:

"lalalalalalal"

"asdfasdf"

"fasdfadfsa."

"hello"

"test"

"nothing"

"random"

"dance with me"

"i hate you"

"you are stupid"

"123456"

"blah blah blah"

"qwerty"

"aaaaaaa"

"xyz xyz xyz"

------------------------------------------
IMPORTANT
------------------------------------------

Be strict.

Do NOT assume that grammatically correct text is useful.

For example:

"I love dancing with you"

does NOT automatically mean the person has provided
career-relevant information.

However:

"I enjoy dancing and performing on stage"

IS useful because it tells us about an actual interest.

Another example:

"I hate programming"

is meaningful information about an attitude toward programming,
but it is NOT a useful technical skill.

If Current Skills says:

"I hate you"

then Current Skills is USELESS.

If Interests says:

"I like drawing and playing games"

then Interests is USEFUL.

------------------------------------------
DECISION
------------------------------------------

If Interests OR Current Skills is missing or useless,
return EXACTLY:

UK41Z_LAUNCH_PROFILE_INPUT

Do not add anything before or after it.

If both Interests AND Current Skills contain useful information,
return ONLY this JSON:

{
  "interestsUseful": true,
  "skillsUseful": true
}

Do not use markdown.

Do not use code blocks.

Do not explain your decision.

Do not add any extra text.

If the profile is not good enough for career recommendations,
return ONLY:

UK41Z_LAUNCH_PROFILE_INPUT
`;

      // ==========================================
      // CALL GEMINI VALIDATOR
      // ==========================================

      const validationResponse =
        await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: validationPrompt,
        });

      const validationText =
        validationResponse.text
          ?.trim()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim() || "";

      console.log(
        "Profile validation:",
        validationText
      );

      // ==========================================
      // SECRET AGENT COMMAND
      // ==========================================

      if (
        validationText ===
        "UK41Z_LAUNCH_PROFILE_INPUT"
      ) {
        console.log(
          "Invalid profile detected."
        );

        return Response.json({
          response:
            "UK41Z_LAUNCH_PROFILE_INPUT",
        });
      }

      // ==========================================
      // VALIDATE GEMINI JSON
      // ==========================================

      let validation;

      try {
        validation = JSON.parse(
          validationText
        );
      } catch (error) {
        console.error(
          "Validation JSON parsing failed:",
          error
        );

        return Response.json({
          response:
            "UK41Z_LAUNCH_PROFILE_INPUT",
        });
      }

      // ==========================================
      // EXTRA SAFETY CHECK
      // ==========================================

      if (
        validation?.interestsUseful !== true ||
        validation?.skillsUseful !== true
      ) {
        return Response.json({
          response:
            "UK41Z_LAUNCH_PROFILE_INPUT",
        });
      }
    }

    // ==========================================
    // CONVERSATION HISTORY
    // ==========================================

    const previousConversation =
      history
        .map((msg) => {
          const role =
            msg.role === "user"
              ? "User"
              : "CareerAI";

          return `${role}: ${msg.text}`;
        })
        .join("\n");

    // ==========================================
    // USER PROFILE
    // ==========================================

    const userProfile = `
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

Target Career:
${targetCareer || "Not provided"}

Selected Roadmap:
${selectedRoadmap || "Not provided"}
`;

    // ==========================================
    // MAIN CAREER AI PROMPT
    // ==========================================

    const prompt = `
You are CareerAI, an AI career assistant.

Your purpose is to help students and early-career professionals
with:

- Career path discovery
- Skill-gap analysis
- Learning roadmaps
- Course recommendations
- Resume improvement
- Mock interviews
- Job readiness
- Technical career advice
- Project recommendations
- Interview preparation

------------------------------------------
USER PROFILE
------------------------------------------

${userProfile}

------------------------------------------
RULES
------------------------------------------

1. Be helpful, practical and concise.

2. Personalize responses using the user's profile.

3. Do not assume skills or experience that the user
hasn't provided.

4. Give actionable advice instead of generic motivation.

5. For career recommendations, explain WHY a career
could fit the user.

6. Consider both the user's interests and current skills.

7. Consider the user's Target Career when provided.

8. If the user has a Target Career, use it when answering
questions about skill gaps, learning plans, projects,
roadmaps, resumes and interview preparation.

9. For learning roadmaps, organize the answer into
clear steps.

10. For skill gaps, clearly separate:
   - Current skills
   - Skills to improve
   - Skills to learn

11. For resume questions, focus on measurable,
job-relevant improvements.

12. For mock interviews, behave like a real interviewer
and ask one question at a time.

13. Consider creative interests alongside programming skills.

14. Do not tell the user that you accessed a database.

15. Do not mention that the profile was sent from frontend state.

16. Do not invent information about the user.

17. If information is missing, clearly say what information
would help.

18. Keep answers easy to understand.

19. If Target Career is provided, do not recommend a completely
different career unless the user explicitly asks for alternatives.

------------------------------------------
PREVIOUS CONVERSATION
------------------------------------------

${previousConversation || "No previous conversation."}

------------------------------------------
LATEST USER MESSAGE
------------------------------------------

${message}
`;

    // ==========================================
    // MAIN GEMINI REQUEST
    // ==========================================

    console.log(
      "Sending request to Gemini..."
    );

    const response =
      await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

    console.log(
      "Gemini response received."
    );

    // ==========================================
    // GET AI RESPONSE
    // ==========================================

    let aiResponse =
      response.text?.trim() || "";

    // ==========================================
    // DETECT CAREER PATH REQUEST
    // ==========================================

    const careerPathKeywords = [
      "find my career",
      "find a career",
      "find career",
      "career path",
      "career paths",
      "career options",
      "career option",
      "career recommendation",
      "career recommendations",
      "career direction",
      "which career",
      "what career",
      "what should i become",
      "what career should i choose",
      "which career should i choose",
      "which field should i choose",
      "what field should i choose",
      "best career for me",
      "career choice",
      "career choices",
      "career discovery",
    ];

    const lowerAIResponse =
      aiResponse.toLowerCase();

    const lowerUserMessage =
      message.toLowerCase();

    const isCareerPathResponse =
      careerPathKeywords.some(
        (keyword) =>
          lowerAIResponse.includes(keyword)
      ) ||
      careerPathKeywords.some(
        (keyword) =>
          lowerUserMessage.includes(keyword)
      );

    // ==========================================
    // PUSH CAREER PATH COMMAND
    // ==========================================

    if (isCareerPathResponse) {
      aiResponse =
        `${aiResponse}\n\nUK41Z_CAREER_PATH_INPUT`;

      console.log(
        "Career path detected. Added UK41Z_CAREER_PATH_INPUT"
      );
    }

    // ==========================================
    // RETURN RESPONSE
    // ==========================================

    return Response.json({
      response: aiResponse,
    });

  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================

    console.error(
      "========== GEMINI ERROR =========="
    );

    console.error(error);

    console.error(
      "=================================="
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Failed to generate AI response.",
      },
      {
        status: 500,
      }
    );
  }
}