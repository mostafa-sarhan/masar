import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import { tenantScoped, tenantIdField } from "../../lib/tenant-plugin";
import { searchableName } from "../../lib/searchable-name";

const courierSchema = new mongoose.Schema(
  {
    tenantId: tenantIdField,
    name: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true }
);

courierSchema.plugin(tenantScoped);
courierSchema.plugin(searchableName);
courierSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export type CourierDoc = HydratedDocument<InferSchemaType<typeof courierSchema>>;
// Existing data lives in the "deliveries" collection.
export const Courier = mongoose.model("Courier", courierSchema, "deliveries");
