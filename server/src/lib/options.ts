import { Request } from "express";
import mongoose from "mongoose";
import { optionsQuery } from "@masar/shared";
import { scope } from "./scope";
import { nameSearchFilter } from "./searchable-name";

// {_id, name} pairs for a combobox: the requested ids, or the first matches for the search text.
export async function searchOptions<T extends { name: string }>(req: Request, model: mongoose.Model<T>) {
  const { q, ids, limit } = optionsQuery.parse(req.query);
  const filter = ids.length ? { _id: { $in: ids } } : nameSearchFilter(q);
  return model.find({ ...scope(req), ...filter }).sort({ name: 1 }).limit(ids.length || limit).select("name").lean();
}
