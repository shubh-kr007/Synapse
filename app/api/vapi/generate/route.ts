import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getRandomInterviewCover } from "@/lib/utils";

const interviewRequestSchema = z.object({
  type: z.string().min(1, "Type is required."),
  role: z.string().min(1, "Role is required."),
  level: z.string().min(1, "Level is required."),
  techstack: z.string().min(1, "Tech stack is required."),
  amount: z.number().int().positive("Amount must be a positive number."),
});

const questionsSchema = z.object({
  questions: z
    .array(z.string())
    .describe("An array of interview questions."),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = interviewRequestSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          error: "Invalid request body.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { type, role, level, techstack, amount } = validation.data;

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: questionsSchema,
      prompt: `Prepare exactly ${amount} questions for a job interview.
        The job role is "${role}".
        The job experience level is "${level}".
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The questions are going to be read by a voice assistant so do not use special characters like "/" or "*" which might break the voice assistant.`,
    });

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((t) => t.trim()),
      questions: object.questions,
      userId: user.id,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    // Revalidate the homepage to show the new interview
    revalidatePath("/");

    return Response.json({ success: true, interviewId: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/vapi/generate:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return Response.json(
      {
        success: false,
        error: "Failed to generate interview.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
