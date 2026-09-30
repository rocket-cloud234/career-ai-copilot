import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import clientPromise from "../../../lib/mongodb";

export async function POST(request) {
  try {
    // ==========================================
    // GET REQUEST BODY
    // ==========================================

    const body = await request.json();

    const {
      name,
      dob,
      email,
      password,
      confirmPassword,
    } = body;

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (
      !name ||
      !dob ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // PASSWORD CONFIRMATION
    // ==========================================

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // PASSWORD LENGTH
    // ==========================================

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CLEAN VALUES
    // ==========================================

    const trimmedName = String(name).trim();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    if (!trimmedName) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // VALIDATE EMAIL
    // ==========================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // VALIDATE DOB
    // ==========================================

    const dobDate = new Date(dob);

    if (Number.isNaN(dobDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid date of birth.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CONNECT MONGODB
    // ==========================================

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "careerai"
    );

    const users = db.collection("users");

    // ==========================================
    // CHECK EXISTING EMAIL
    // ==========================================

    const existingUser = await users.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // ==========================================
    // CREATE STABLE USER ID
    // ==========================================

    const userId = randomUUID();

    // ==========================================
    // CREATE USER
    // ==========================================

    const now = new Date();

    const newUser = {
      userId,
      name: trimmedName,
      dob: dobDate,
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    // ==========================================
    // INSERT USER
    // ==========================================

    const result = await users.insertOne(newUser);

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          userId,
          id: result.insertedId.toString(),
          name: trimmedName,
          email: normalizedEmail,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong while creating your account.",
      },
      { status: 500 }
    );
  }
}
