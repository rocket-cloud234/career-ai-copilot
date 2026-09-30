import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { getAuthUser } from "../../../lib/auth";
import crypto from "crypto";

function calculateAge(dob) {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

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
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // GET AUTHENTICATED USER ID
    // ==========================================

    const userId = String(
      authUser.userId || ""
    ).trim();

    if (!userId) {
      return NextResponse.json(
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
    // READ REQUEST BODY
    // ==========================================

    const body = await request.json();

    const {
      name,
      age,
      interests,
      currentSkills,
      background,
      targetCareer,
    } = body;

    // ==========================================
    // CLEAN VALUES
    // ==========================================

    const cleanName =
      typeof name === "string"
        ? name.trim()
        : "";

    const cleanInterests =
      typeof interests === "string"
        ? interests.trim()
        : "";

    const cleanCurrentSkills =
      typeof currentSkills === "string"
        ? currentSkills.trim()
        : "";

    const cleanBackground =
      typeof background === "string"
        ? background.trim()
        : "";

    const cleanTargetCareer =
      typeof targetCareer === "string"
        ? targetCareer.trim()
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
    // FIND AUTHENTICATED USER
    // ==========================================

    const user = await users.findOne({
      userId,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // TARGET CAREER + TARGET CAREER ID
    // ==========================================
    //
    // IMPORTANT:
    //
    // 1. If targetCareer is empty:
    //    remove targetCareerId too.
    //
    // 2. If targetCareer is different from
    //    the existing career:
    //    generate a NEW targetCareerId.
    //
    // 3. If targetCareer is the same:
    //    keep the existing targetCareerId.
    //
    // ==========================================

    let finalTargetCareerId = null;

    const existingTargetCareer =
      typeof user.targetCareer === "string"
        ? user.targetCareer.trim()
        : "";

    const existingTargetCareerId =
      typeof user.targetCareerId === "string"
        ? user.targetCareerId.trim()
        : "";

    if (!cleanTargetCareer) {
      // ========================================
      // CAREER REMOVED
      // ========================================
      //
      // Remove both fields from MongoDB.
      //
      finalTargetCareerId = null;
    } else if (
      existingTargetCareer &&
      existingTargetCareer === cleanTargetCareer &&
      existingTargetCareerId
    ) {
      // ========================================
      // SAME CAREER
      // ========================================
      //
      // Keep the existing ID.
      //
      finalTargetCareerId =
        existingTargetCareerId;
    } else {
      // ========================================
      // NEW / CHANGED CAREER
      // ========================================
      //
      // Generate a completely new ID.
      //
      finalTargetCareerId =
        generateTargetCareerId(
          cleanTargetCareer
        );
    }

    console.log(
      "Previous Target Career:",
      existingTargetCareer
    );

    console.log(
      "New Target Career:",
      cleanTargetCareer
    );

    console.log(
      "Previous Target Career ID:",
      existingTargetCareerId
    );

    console.log(
      "New Target Career ID:",
      finalTargetCareerId
    );

    // ==========================================
    // AGE → DOB
    // ==========================================

    let calculatedDob = null;

    if (
      age !== undefined &&
      age !== null &&
      age !== "" &&
      !Number.isNaN(Number(age))
    ) {
      const numericAge = Number(age);

      if (
        Number.isInteger(numericAge) &&
        numericAge > 0 &&
        numericAge < 120
      ) {
        const today = new Date();

        calculatedDob = new Date(
          today.getFullYear() - numericAge,
          today.getMonth(),
          today.getDate()
        );
      }
    }

    // ==========================================
    // BUILD UPDATE
    // ==========================================

    const now = new Date();

    const updateFields = {
      interests: cleanInterests,
      currentSkills: cleanCurrentSkills,
      background: cleanBackground,
      updatedAt: now,
    };

    // ==========================================
    // NAME
    // ==========================================

    if (cleanName) {
      updateFields.name = cleanName;
    }

    // ==========================================
    // DOB
    // ==========================================

    if (calculatedDob) {
      updateFields.dob = calculatedDob;
    }

    // ==========================================
    // TARGET CAREER
    // ==========================================

    if (cleanTargetCareer) {
      // Career exists
      updateFields.targetCareer =
        cleanTargetCareer;

      updateFields.targetCareerId =
        finalTargetCareerId;
    } else {
      // ========================================
      // CAREER REMOVED
      // ========================================
      //
      // Completely remove both fields instead
      // of storing empty strings/null.
      //
      delete updateFields.targetCareer;
      delete updateFields.targetCareerId;
    }

    // ==========================================
    // BUILD MONGODB UPDATE
    // ==========================================

    const updateOperation = {
      $set: updateFields,
    };

    // ==========================================
    // REMOVE CAREER FIELDS WHEN EMPTY
    // ==========================================

    if (!cleanTargetCareer) {
      updateOperation.$unset = {
        targetCareer: "",
        targetCareerId: "",
      };
    }

    // ==========================================
    // UPDATE USER
    // ==========================================

    await users.updateOne(
      {
        userId,
      },
      updateOperation
    );

    // ==========================================
    // GET UPDATED USER
    // ==========================================

    const updatedUser =
      await users.findOne({
        userId,
      });

    if (!updatedUser) {
      throw new Error(
        "User could not be retrieved after update."
      );
    }

    // ==========================================
    // GET DOB
    // ==========================================

    let returnedDob = null;

    if (updatedUser.dob) {
      const parsedDob =
        new Date(updatedUser.dob);

      if (
        !Number.isNaN(
          parsedDob.getTime()
        )
      ) {
        returnedDob =
          parsedDob.toISOString();
      }
    }

    // ==========================================
    // CALCULATE AGE
    // ==========================================

    const returnedAge =
      calculateAge(returnedDob);

    // ==========================================
    // RETURN TARGET CAREER VALUES
    // ==========================================

    const returnedTargetCareer =
      updatedUser.targetCareer || "";

    const returnedTargetCareerId =
      updatedUser.targetCareerId || "";

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "User profile information saved successfully.",

        profile: {
          userId,

          name:
            updatedUser.name || "",

          email:
            updatedUser.email || "",

          age:
            returnedAge,

          dob:
            returnedDob,

          interests:
            updatedUser.interests || "",

          currentSkills:
            updatedUser.currentSkills || "",

          background:
            updatedUser.background || "",

          targetCareer:
            returnedTargetCareer,

          targetCareerId:
            returnedTargetCareerId,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "USER PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : "Something went wrong while saving user profile.",
      },
      {
        status: 500,
      }
    );
  }
}