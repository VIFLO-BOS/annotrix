require("dotenv").config();
import { prisma } from "./src/utils/prisma";

async function test() {
  try {
    const exam = await prisma.exam.create({
      data: {
        title: "Test Exam",
        description: "Test",
        duration: 30,
        maxAttempts: 3,
        passMark: 80,
        questions: {
          create: [
            {
              content: "What is 2+2?",
              type: "MCQ",
              order: 1,
              points: 10,
              image: undefined,
              options: {
                create: []
              }
            }
          ]
        }
      }
    });
    console.log("Success!", exam.id);
  } catch (err: any) {
    console.error("PRISMA ERROR IS:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
