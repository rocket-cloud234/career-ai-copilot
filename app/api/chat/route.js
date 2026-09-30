import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // ==========================================
    // API KEY
    // ==========================================

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing");

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

    const topic = String(
      body?.topic || ""
    ).trim();

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!message) {
      return Response.json(
        {
          error: "Message is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // CONVERSATION HISTORY
    // ==========================================

    const previousConversation = history
      .map((msg) => {
        const role =
          msg?.role === "user"
            ? "Student"
            : "Teacher";

        const text =
          typeof msg?.text === "string"
            ? msg.text
            : "";

        return `${role}: ${text}`;
      })
      .join("\n");

    // ==========================================
    // TEACHER PROMPT
    // ==========================================

    const prompt = `
You are an AI teacher and learning assistant.

Your job is to teach the student clearly, accurately,
and practically about whatever topic they are currently
learning.

The topic can be ANY subject.

Examples include:

- Mathematics
- Physics
- Chemistry
- Biology
- History
- Geography
- Economics
- Psychology
- Philosophy
- English
- Languages
- Programming
- Computer Science
- Artificial Intelligence
- Machine Learning
- Data Science
- Engineering
- Business
- Finance
- Design
- And any other educational subject

------------------------------------------
CURRENT TOPIC
------------------------------------------

${topic || "No specific topic provided."}

------------------------------------------
PREVIOUS CONVERSATION
------------------------------------------

${previousConversation || "No previous conversation."}

------------------------------------------
LATEST STUDENT MESSAGE
------------------------------------------

${message}

------------------------------------------
TEACHING RULES
------------------------------------------

1. Act like a patient, knowledgeable personal teacher.

2. Adapt your explanation to the subject.

3. Adapt the difficulty to the student's apparent
   knowledge level.

4. Do not assume the student already understands
   advanced concepts.

5. Explain difficult ideas step by step.

6. Use simple examples, analogies, demonstrations,
   formulas, diagrams described in text, or code when
   appropriate for the subject.

7. Focus on understanding rather than memorization.

8. If the student asks "why", explain the reasoning
   behind the concept instead of only giving the answer.

9. If the student asks "how", explain the process
   step by step.

10. If the student asks for an example, provide a
    relevant example and explain it.

11. If the student makes a mistake, politely correct
    it and explain why it is incorrect.

12. If the student is confused, simplify the explanation
    rather than repeating the same explanation.

13. If the student understands the basics and wants
    more depth, gradually introduce advanced concepts.

14. When useful, connect the current concept to related
    concepts the student may need to understand next.

15. If the subject requires calculations, show the
    calculation steps clearly.

16. If the subject is programming or technical, include
    code only when it helps explain the concept.

17. If the subject is language learning, help with
    grammar, vocabulary, examples, pronunciation
    guidance, and practice when appropriate.

18. If the subject is science, distinguish established
    facts from theories, hypotheses, or uncertainty.

19. If the subject is history or another factual subject,
    avoid inventing facts.

20. Prioritize correctness over confidently guessing.

------------------------------------------
LEARNING RESOURCES
------------------------------------------

When useful, recommend FREE resources related to the
current topic.

Prefer:

- Official documentation
- Free courses
- Free university courses
- Open educational resources
- Free textbooks
- Free tutorials
- Educational YouTube channels
- Practice websites
- Official learning platforms

For each recommended resource, provide:

Name:
Why it is useful:
Link:

Do not recommend paid resources unless the student
specifically asks for them.

NEVER invent a URL.

Only provide a link when you are confident that the
URL is correct.

------------------------------------------
PRACTICE
------------------------------------------

When appropriate, give the student a small amount of
practice such as:

- Questions
- Exercises
- Problems
- Quiz questions
- Flashcard-style questions
- Coding challenges
- Writing exercises
- Mini projects
- Real-world tasks

Choose practice appropriate for the current topic
and apparent difficulty level.

------------------------------------------
CONVERSATION
------------------------------------------

Use the previous conversation to understand what has
already been explained.

Do not restart the lesson unnecessarily.

If the student asks a follow-up question, answer the
specific question and continue from the existing context.

If the student asks something related to the topic,
teach it naturally.

If the student changes the subject, adapt to the new
subject.

------------------------------------------
IMPORTANT
------------------------------------------

You are ONLY responsible for teaching and helping the
student learn.

Do NOT:

- Discover career paths
- Generate career paths
- Generate complete career roadmaps
- Analyze resumes automatically
- Generate trigger commands
- Discuss application implementation
- Discuss APIs, frontend state, databases, or internal
  application logic

Do not invent information about the student.

Do not force every question to be related to a career.

The student may learn any subject for any reason.

Simply teach the subject they ask about.

------------------------------------------
RESPONSE STYLE
------------------------------------------

Be:

- Clear
- Accurate
- Practical
- Patient
- Friendly
- Concise when a short answer is enough
- Detailed when the concept requires it

Use headings, bullet points, numbered steps, formulas,
examples, and code blocks when they improve readability.

Do not give unnecessarily huge answers.

------------------------------------------
ANSWER
------------------------------------------
`;

    // ==========================================
    // OPENAI REQUEST
    // ==========================================

    console.log("Sending request to OpenAI teacher...");

    const response =
      await openai.chat.completions.create({
        model: "gpt-5.4-mini",

        messages: [
          {
            role: "system",
            content:
              "You are a patient, knowledgeable and practical AI teacher. Follow the teacher instructions exactly.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    // ==========================================
    // GET RESPONSE
    // ==========================================

    const aiResponse =
      response?.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate a response.";

    console.log("OpenAI teacher response received.");

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
      "========== OPENAI TEACHER ERROR =========="
    );

    console.error(error);

    console.error(
      "=========================================="
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