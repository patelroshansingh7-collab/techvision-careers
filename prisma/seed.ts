import { PrismaClient } from "@prisma/client";
import { ENGINEERING_COURSES } from "../src/lib/courses-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with TechVision Careers data...");

  // Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@techvisioncareers.com" },
    update: {},
    create: {
      email: "admin@techvisioncareers.com",
      name: "TechVision Admin",
      role: "ADMIN",
      password: "admin_techvision_2026",
    },
  });
  console.log("Admin user created/verified:", adminUser.email);

  // Seed Demo Student
  const demoStudent = await prisma.user.upsert({
    where: { email: "roshan.singh@example.com" },
    update: {},
    create: {
      email: "roshan.singh@example.com",
      name: "Roshan Singh",
      role: "STUDENT",
    },
  });
  console.log("Demo student created/verified:", demoStudent.email);

  // Seed All 22 Engineering Courses
  for (const course of ENGINEERING_COURSES) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        category: course.category,
        durationDays: course.durationDays,
        mode: course.mode,
        priceINR: course.priceINR,
        description: course.description,
        learn: JSON.stringify(course.learn),
        tools: JSON.stringify(course.tools),
        thumbnail: course.thumbnail,
      },
      create: {
        slug: course.slug,
        title: course.title,
        category: course.category,
        durationDays: course.durationDays,
        mode: course.mode,
        priceINR: course.priceINR,
        description: course.description,
        learn: JSON.stringify(course.learn),
        tools: JSON.stringify(course.tools),
        thumbnail: course.thumbnail,
      },
    });
  }
  console.log(`Successfully seeded ${ENGINEERING_COURSES.length} courses.`);

  // Create sample verified enrollment and certificate for demonstration
  const firstCourse = await prisma.course.findUnique({
    where: { slug: "full-stack-web-development-react-node" },
  });

  if (firstCourse) {
    const sampleOrderId = "ORD-TVC-2026-DEMO";
    const sampleCertNo = "TVC-IN-2026-0142";

    const enrollment = await prisma.enrollment.upsert({
      where: { orderId: sampleOrderId },
      update: {},
      create: {
        orderId: sampleOrderId,
        userId: demoStudent.id,
        courseId: firstCourse.id,
        userName: "Roshan Singh",
        college: "Indian Institute of Technology",
        startDate: new Date("2026-06-12"),
        endDate: new Date("2026-07-12"),
        issueDate: new Date("2026-06-12"),
        mode: "Online",
        amountINR: 149,
        paymentId: "pay_mock_success_149",
        paymentStatus: "PAID",
      },
    });

    await prisma.certificate.upsert({
      where: { certNo: sampleCertNo },
      update: {},
      create: {
        certNo: sampleCertNo,
        enrollmentId: enrollment.id,
        pdfUrl: `/api/certificates/${sampleCertNo}/pdf`,
        qrPayload: `http://localhost:3000/verify/${sampleCertNo}`,
        issuedAt: new Date("2026-06-12"),
      },
    });
    console.log("Sample certificate created with ID:", sampleCertNo);
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
