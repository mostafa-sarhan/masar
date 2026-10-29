import bcrypt from "bcryptjs";
import { passwordProblems } from "@masar/shared";
import { AppError } from "../../lib/errors";
import { config } from "../../config";

export const isBcryptHash = (value: string) => /^\$2[aby]\$\d{2}\$/.test(value);

// The policy itself is shared with the client (forms show the same rules).
export { passwordProblems };

export function assertStrongPassword(password: string, email?: string) {
  const problems = passwordProblems(password, email);
  if (problems.length) throw new AppError(400, "WEAK_PASSWORD", "Password does not meet the policy", problems);
}

export const hashPassword = (password: string) => bcrypt.hash(password, config.bcryptRounds);
export const verifyPassword = (password: string, hash: string) =>
  isBcryptHash(hash) ? bcrypt.compare(password, hash) : Promise.resolve(false);
export const needsRehash = (hash: string) => bcrypt.getRounds(hash) < config.bcryptRounds;
