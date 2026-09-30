import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { getAuthUser } from "../../../lib/auth";

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

export async function GET(request) {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const authUser =
      await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // USER ID
    // ==========================================

    const userId = String(
      authUser.userId || ""
    ).trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // MONGODB
    // ==========================================

    const client =
      await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB ||
        "careerai"
    );

    const users =
      db.collection("users");

    // ==========================================
    // FIND USER
    // ==========================================
    //
    // IMPORTANT:
    //
    // userId is now our application-level ID.
    //
    // Do NOT use:
    //
    // new ObjectId(userId)
    //
    // because userId is a UUID.
    //
    // ==========================================

    const user =
      await users.findOne({
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
    // DOB
    // ==========================================

    let dob = null;

    if (user.dob) {
      if (user.dob instanceof Date) {
        dob =
          user.dob.toISOString();
      } else {
        const parsedDob =
          new Date(user.dob);

        if (
          !Number.isNaN(
            parsedDob.getTime()
          )
        ) {
          dob =
            parsedDob.toISOString();
        }
      }
    }

    // ==========================================
    // CALCULATE AGE
    // ==========================================

    const age =
      calculateAge(dob);

    // ==========================================
    // RETURN USER
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        user: {
          // Application user ID
          userId,

          // MongoDB internal ID
          id: user._id.toString(),

          name: user.name || "",

          email: user.email || "",

          dob,

          // Calculated from DOB.
          // Not stored as source of truth.
          age,

          interests:
            user.interests || "",

          currentSkills:
            user.currentSkills || "",

          background:
            user.background || "",

          targetCareer:
            user.targetCareer || "",

          targetCareerId:
            user.targetCareerId || "",

          selectedRoadmap:
            user.selectedRoadmap || "",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to get user information.",
      },
      {
        status: 500,
      }
    );
  }
}

