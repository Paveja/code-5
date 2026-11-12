import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError } from "@/lib/http";
import { createSession } from "@/lib/auth";

export async function authenticateUser(email: string, password: string) {
  const [user] = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1)
    .all();

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    console.warn("Sign-in rejected");
    throw new ApiError(
      "Email or password was not recognized.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  await createSession(user.id);
  console.info("User signed in", { userId: user.id, role: user.role });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
