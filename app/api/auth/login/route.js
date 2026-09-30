import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import clientPromise from "../../../lib/mongodb";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function POST(request) {
  try {
    // ==========================================
    // GET REQUEST BODY
    // ==========================================

    const body = await request.json();

    const {
      identifier,
      password,
      remember,
    } = body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(
      identifier
    )
      .trim()
      .toLowerCase();

    // ==========================================
    // CONNECT MONGODB
    // ==========================================

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "careerai"
    );

    const users = db.collection("users");

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await users.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // VERIFY PASSWORD
    // ==========================================

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // CHECK USER ID
    // ==========================================
    //
    // New users have:
    //
    // user.userId
    //
    // We use this ID everywhere:
    //
    // JWT
    // auth helper
    // roadmaps
    // profile
    // chats
    //
    // ==========================================

    if (!user.userId) {
      console.error(
        "User does not have a userId:",
        user._id
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "This account is missing a user ID. Please contact support.",
        },
        { status: 500 }
      );
    }

    const userId = String(
      user.userId
    );

    // ==========================================
    // CREATE JWT
    // ==========================================

    const token = await new SignJWT({
      userId,

      email: user.email,

      name: user.name,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime(
        remember ? "30d" : "1d"
      )
      .sign(secret);

    // ==========================================
    // CREATE RESPONSE
    // ==========================================

    const response =
      NextResponse.json(
        {
          success: true,

          message:
            "Login successful.",

          user: {
            userId,

            id: user._id.toString(),

            name: user.name,

            email: user.email,
          },
        },
        {
          status: 200,
        }
      );

    // ==========================================
    // SET HTTP-ONLY COOKIE
    // ==========================================

    response.cookies.set(
      "auth_token",
      token,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path: "/",

        maxAge: remember
          ? 60 * 60 * 24 * 30
          : 60 * 60 * 24,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Something went wrong while logging in.",
      },
      {
        status: 500,
      }
    );
  }
}

