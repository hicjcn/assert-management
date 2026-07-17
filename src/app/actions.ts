"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAccount,
  createAccountChange,
  deleteAccount,
  updateAccount,
} from "@/server/assets";
import { login, logout, requireSession } from "@/server/auth";
import {
  createGoal,
  deleteGoal,
  updateGoal,
  updateGoalBudget,
} from "@/server/goals";
import {
  assetDataCacheTag,
  goalDataCacheTag,
} from "@/server/cache";

function redirectPath(formData: FormData, fallback: string) {
  const value = formData.get("redirectTo");

  if (typeof value === "string" && value.startsWith("/")) {
    return value;
  }

  return fallback;
}

export async function loginAction(formData: FormData) {
  await login(String(formData.get("username") ?? ""), String(formData.get("password") ?? ""));
  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function createAccountAction(formData: FormData) {
  const session = await requireSession();

  await createAccount(session.userId, formData);
  updateTag(assetDataCacheTag(session.userId));
  redirect("/accounts");
}

export async function updateAccountAction(formData: FormData) {
  const session = await requireSession();
  const destination = redirectPath(formData, "/accounts");

  await updateAccount(session.userId, formData);
  updateTag(assetDataCacheTag(session.userId));
  redirect(destination);
}

export async function deleteAccountAction(formData: FormData) {
  const session = await requireSession();

  await deleteAccount(session.userId, formData);
  updateTag(assetDataCacheTag(session.userId));
  redirect("/accounts");
}

export async function createAccountChangeAction(formData: FormData) {
  const session = await requireSession();

  await createAccountChange(session.userId, formData);
  updateTag(assetDataCacheTag(session.userId));
  redirect("/records");
}

export async function createGoalAction(formData: FormData) {
  const session = await requireSession();

  await createGoal(session.userId, formData);
  updateTag(goalDataCacheTag(session.userId));
  redirect("/goals");
}

export async function updateGoalAction(formData: FormData) {
  const session = await requireSession();

  await updateGoal(session.userId, formData);
  updateTag(goalDataCacheTag(session.userId));
  redirect("/goals");
}

export async function deleteGoalAction(formData: FormData) {
  const session = await requireSession();

  await deleteGoal(session.userId, formData);
  updateTag(goalDataCacheTag(session.userId));
  redirect("/goals");
}

export async function updateGoalBudgetAction(formData: FormData) {
  const session = await requireSession();

  await updateGoalBudget(session.userId, formData);
  updateTag(goalDataCacheTag(session.userId));
  redirect("/goals");
}
