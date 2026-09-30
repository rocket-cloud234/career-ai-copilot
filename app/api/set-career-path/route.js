import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { getAuthUser } from "../../lib/auth";
import crypto from "crypto";

// ==========================================
// GENERATE TARGET CAREER ID
// ==========================================

function generateTargetCareerId(targetCareer) {
  const career = String(targetCareer || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 8);

  return `career-${career}-${randomPart}`;
}

// ==========================================
// POST
// ==========================================

export async function POST(request) {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please log in.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // USER ID
    // ==========================================

    const userId = String(authUser.userId || "").trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authenticated user.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // REQUEST BODY
    // ==========================================

    const body = await request.json();

    const targetCareer =
      typeof body.targetCareer === "string"
        ? body.targetCareer.trim()
        : "";

    // ==========================================
    // MONGODB
    // ==========================================

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "careerai"
    );

    const users = db.collection("users");

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await users.findOne(
      { userId },
      {
        projection: {
          targetCareer: 1,
          targetCareerId: 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // EXISTING CAREER DATA
    // ==========================================

    const existingTargetCareer =
      typeof user.targetCareer === "string"
        ? user.targetCareer.trim()
        : "";

    const existingTargetCareerId =
      typeof user.targetCareerId === "string"
        ? user.targetCareerId.trim()
        : "";

    // ==========================================
    // CASE 1:
    // TARGET CAREER REMOVED
    // ==========================================

    if (!targetCareer) {
      await users.updateOne(
        { userId },
        {
          $unset: {
            targetCareer: "",
            targetCareerId: "",
          },
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: "Target career removed successfully.",
          targetCareer: "",
          targetCareerId: "",
        },
        { status: 200 }
      );
    }

    // ==========================================
    // CASE 2:
    // SAME CAREER
    // KEEP EXISTING ID
    // ==========================================

    let targetCareerId;

    if (
      existingTargetCareer &&
      existingTargetCareer === targetCareer &&
      existingTargetCareerId
    ) {
      targetCareerId = existingTargetCareerId;
    }

    // ==========================================
    // CASE 3:
    // NEW / CHANGED CAREER
    // GENERATE NEW ID
    // ==========================================

    else {
      targetCareerId =
        generateTargetCareerId(targetCareer);
    }

    // ==========================================
    // IMPORTANT:
    // ONLY UPDATE THESE TWO FIELDS
    //
    // Nothing else in the user document
    // is modified.
    // ==========================================

    await users.updateOne(
      { userId },
      {
        $set: {
          targetCareer: targetCareer,
          targetCareerId: targetCareerId,
        },
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        message: "Target career saved successfully.",
        targetCareer,
        targetCareerId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("TARGET CAREER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong while saving target career.",
      },
      { status: 500 }
    );
  }
}

