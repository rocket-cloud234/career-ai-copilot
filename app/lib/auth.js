import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function getAuthUser(request) {
  try {
    // ==========================================
    // GET AUTH COOKIE
    // ==========================================

    const token =
      request.cookies.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const { payload } =
      await jwtVerify(token, secret);

    // ==========================================
    // CHECK USER ID
    // ==========================================

    if (!payload.userId) {
      console.error(
        "JWT does not contain userId."
      );

      return null;
    }

    // ==========================================
    // RETURN AUTHENTICATED USER
    // ==========================================

    return {
      userId: String(payload.userId),

      email: payload.email
        ? String(payload.email)
        : "",

      name: payload.name
        ? String(payload.name)
        : "",
    };
  } catch (error) {
    console.error(
      "Auth verification failed:",
      error
    );

    return null;
  }
}

