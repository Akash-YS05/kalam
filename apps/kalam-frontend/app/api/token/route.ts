import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/lib/auth";

// Must match the backend JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || "qjfbwjebfq";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate a JWT token compatible with the HTTP backend
    // The backend expects { userId: string } payload
    const token = jwt.sign(
      { userId: session.user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
