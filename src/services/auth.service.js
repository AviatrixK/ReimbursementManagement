import { db } from "../config/db.js";
import { users } from "../db/schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { eq } from "drizzle-orm";

export class AuthService {
  static validateEmailDomain(email) {
    if (!email) return false;
    const parts = email.split("@");
    return parts.length === 2 && parts[1] === "org.com";
  }

  static async register({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (!this.validateEmailDomain(email)) {
      throw new Error("Only emails belonging to the 'org.com' domain are allowed");
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error("Email is already registered");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with default role 'EMP'
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      role: "EMP",
    }).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

    return newUser;
  }

  static async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (!this.validateEmailDomain(email)) {
      throw new Error("Only emails belonging to the 'org.com' domain are allowed");
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }
}
