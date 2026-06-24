import { db } from "../config/db.js";
import { users } from "../db/schema.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedCFO() {
  const email = "cfo@org.com";
  const password = "CFO#ORG@April2026";
  const role = "CFO";

  try {
    console.log(`Checking if root CFO user exists: ${email}...`);
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing.length > 0) {
      console.log("Root CFO user already exists. Skipping seeding.");
      process.exit(0);
    }

    console.log("Hashing password for CFO...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("Inserting root CFO user...");
    await db.insert(users).values({
      email,
      password: hashedPassword,
      role,
    });

    console.log("✅ Root CFO user seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed root CFO user:", error);
    process.exit(1);
  }
}

seedCFO();
