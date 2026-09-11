import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ENGINEERING_COURSES } from "@/lib/courses-data";

export async function GET() {
  try {
    const dbCourses = await prisma.course.findMany({
      orderBy: { category: "asc" },
    });

    if (dbCourses.length > 0) {
      const parsed = dbCourses.map((c) => ({
        ...c,
        learn: JSON.parse(c.learn || "[]"),
        tools: JSON.parse(c.tools || "[]"),
      }));
      return NextResponse.json({ success: true, courses: parsed });
    }

    return NextResponse.json({ success: true, courses: ENGINEERING_COURSES });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ success: true, courses: ENGINEERING_COURSES });
  }
}