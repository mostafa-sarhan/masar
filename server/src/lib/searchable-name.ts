import mongoose from "mongoose";
import { normalizeArabic } from "@masar/shared";

// Keeps `nameSearch` = the Arabic-normalized `name`, so lists can be searched on the server the same
// way the client searches ("الاسكندريه" finds "الإسكندرية"). Covers save() and update queries that set the name.
export function searchableName(schema: mongoose.Schema) {
  schema.add({ nameSearch: { type: String, select: false } });
  schema.pre("validate", function () {
    if (this.isModified("name") || !this.get("nameSearch")) this.set("nameSearch", normalizeArabic(this.get("name") as string));
  });
  schema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
    const update = this.getUpdate() as Record<string, unknown> | null;
    if (!update || Array.isArray(update)) return;
    // The name may be a plain field or inside $set (timestamps add a $set next to plain fields).
    const $set = (update.$set ?? {}) as Record<string, unknown>;
    const name = typeof $set.name === "string" ? $set.name : update.name;
    if (typeof name !== "string") return;
    this.setUpdate({ ...update, $set: { ...$set, nameSearch: normalizeArabic(name) } });
  });
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Mongo filter: every word of the query appears in nameSearch.
export function nameSearchFilter(query: string | undefined) {
  const words = normalizeArabic(query).split(" ").filter(Boolean);
  if (!words.length) return {};
  return { nameSearch: { $regex: words.map((w) => `(?=.*${escapeRegex(w)})`).join("") } };
}
