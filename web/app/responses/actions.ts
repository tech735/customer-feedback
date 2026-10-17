"use server";

import { refresh } from "next/cache";
import { signIn, signOut } from "@/lib/server/auth";

// `username` is sent back so the form can keep it after a failed attempt
// (React resets a form once its action finishes).
type LoginState = { error?: string; username?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { error: "Please enter your username and password.", username };

  const result = await signIn(username, password);
  if (result.error) return { error: result.error, username };
  refresh();
  return {};
}

export async function logout() {
  await signOut();
  refresh();
}
