// Password policy, shared so forms can show the same rules the server enforces:
// 10+ characters, at most 72 bytes (bcrypt limit), at least one letter and one digit,
// and not containing the email name.
export const PASSWORD_RULES = ["At least 10 characters", "At most 72 bytes", "At least one letter", "At least one digit", "Must not contain the email name"] as const;
export type PasswordRule = (typeof PASSWORD_RULES)[number];

export function passwordProblems(password: string, email?: string): PasswordRule[] {
  const problems: PasswordRule[] = [];
  if (password.length < 10) problems.push("At least 10 characters");
  if (new TextEncoder().encode(password).length > 72) problems.push("At most 72 bytes");
  if (!/\p{L}/u.test(password)) problems.push("At least one letter");
  if (!/\d/.test(password)) problems.push("At least one digit");
  if (email && password.toLowerCase().includes(email.toLowerCase().split("@")[0])) problems.push("Must not contain the email name");
  return problems;
}
