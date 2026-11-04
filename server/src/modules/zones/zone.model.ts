import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import { tenantScoped, tenantIdField } from "../../lib/tenant-plugin";

// A tenant's shipping zone: whole governorates and/or single cities sharing one price.
// A city listed in a zone beats its governorate listed in another one.
const zoneSchema = new mongoose.Schema(
  {
    tenantId: tenantIdField,
    name: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
    governorates: { type: [String], default: [] },
    cities: { type: [String], default: [] },
  },
  { timestamps: true }
);

zoneSchema.plugin(tenantScoped);
zoneSchema.index({ tenantId: 1, name: 1 }, { unique: true });
zoneSchema.index({ tenantId: 1, cities: 1 });
zoneSchema.index({ tenantId: 1, governorates: 1 });

export type ZoneDoc = HydratedDocument<InferSchemaType<typeof zoneSchema>>;
export const Zone = mongoose.model("Zone", zoneSchema);
