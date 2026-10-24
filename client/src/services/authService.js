import { api } from "./api";

export const loginUser = (email, password) =>
  api("/auth/login", { method: "POST", body: { email, password } });
