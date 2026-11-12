import { NextRequest, NextResponse } from "next/server";
import { getMemories, addMemory, removeMemory, clearAllMemories } from "@/lib/memory";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to access personalized AI memories." },
        { status: 401 }
      );
    }

    const memories = await getMemories(session.userId);
    return NextResponse.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error: any) {
    console.error("Memory GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve memories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to save memories." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const memoryText = body.memory?.trim();
    if (!memoryText) {
      return NextResponse.json(
        { error: "Memory content cannot be empty." },
        { status: 400 }
      );
    }

    if (memoryText.length > 2000) {
      return NextResponse.json(
        { error: "Memory item exceeds 2,000 character maximum limit." },
        { status: 400 }
      );
    }

    const createdMemory = await addMemory(session.userId, memoryText);

    return NextResponse.json({
      success: true,
      message: "Memory item saved successfully.",
      memory: createdMemory,
    });
  } catch (error: any) {
    console.error("Memory POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to manage memories." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id") || searchParams.get("memoryId");
    const isClearAll = searchParams.get("clearAll") === "true";
    
    let bodyId: string | undefined;
    let body: any = {};
    try {
      body = await req.json();
      bodyId = body.id || body.memoryId;
    } catch {}

    if (isClearAll || body.clearAll) {
      await clearAllMemories(session.userId);
      return NextResponse.json({
        success: true,
        message: "All memories cleared successfully.",
      });
    }

    const memoryId = queryId || bodyId;
    if (!memoryId) {
      return NextResponse.json(
        { error: "Missing required memoryId or id parameter." },
        { status: 400 }
      );
    }

    const success = await removeMemory(session.userId, memoryId);

    return NextResponse.json({
      success: true,
      removed: success,
      message: success ? "Memory removed successfully." : "Memory item not found or already removed.",
    });
  } catch (error: any) {
    console.error("Memory DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove memory" },
      { status: 500 }
    );
  }
}
