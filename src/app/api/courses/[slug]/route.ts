import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ENGINEERING_COURSES } from "@/lib/courses-data";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const course = await prisma.course.findUnique({
      where: { slug },
    });

    if (course) {
      return NextResponse.json({
        success: true,
        course: {
          ...course,
          learn: JSON.parse(course.learn || "[]"),
          tools: JSON.parse(course.tools || "[]"),
        },
      });
    }

    const fallback = ENGINEERING_COURSES.find((c) => c.slug === slug);
    if (fallback) {
      return NextResponse.json({ success: true, course: fallback });
    }

    return NextResponse.json(
      { success: false, message: "Course not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Course fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}