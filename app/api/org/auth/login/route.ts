import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

// Zod schema for login
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = LoginSchema.parse(body);

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Single query: get org + verify password in one call
    const { data: organization, error: fetchError } = await supabase
      .from("organizations")
      .select("id, name, email, contact_person, phone, authorized_priorities, is_active")
      .eq("email", validatedData.email)
      .eq("is_active", true)
      .single();

    if (fetchError || !organization) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const { data: passwordCheck } = await supabase.rpc("verify_password", {
      p_email: validatedData.email,
      p_password: validatedData.password,
    });

    if (!passwordCheck) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const session = {
      organization_id: organization.id,
      organization_name: organization.name,
      email: organization.email,
      authorized_priorities: organization.authorized_priorities,
      expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("org_session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    console.log(`[ORG LOGIN] ${organization.name} (${organization.email})`);

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          email: organization.email,
          contact_person: organization.contact_person,
          phone: organization.phone,
          authorized_priorities: organization.authorized_priorities,
        },
        message: "Login successful",
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle generic errors
    console.error("Organization login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("org_session");

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}

// Get current session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("org_session");

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    // Check if session expired
    if (session.expires_at < Date.now()) {
      cookieStore.delete("org_session");
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: session.organization_id,
          name: session.organization_name,
          email: session.email,
          authorized_priorities: session.authorized_priorities,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid session" },
      { status: 401 }
    );
  }
}
