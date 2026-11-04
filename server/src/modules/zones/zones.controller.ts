import { Request, Response } from "express";
import { zoneBody, shippingQuoteQuery } from "@masar/shared";
import { ok, created } from "../../lib/respond";
import { idParams } from "../../lib/validate";
import * as zones from "./zones.service";

export async function list(req: Request, res: Response) {
  ok(res, await zones.listZones(req));
}

export async function create(req: Request, res: Response) {
  created(res, await zones.createZone(req, zoneBody.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  ok(res, await zones.updateZone(req, idParams.parse(req.params).id, zoneBody.parse(req.body)));
}

export async function remove(req: Request, res: Response) {
  await zones.deleteZone(req, idParams.parse(req.params).id);
  ok(res, { deleted: true });
}

// Live price for the order form.
export async function quote(req: Request, res: Response) {
  const q = shippingQuoteQuery.parse(req.query);
  ok(res, await zones.quoteShipping(req.tenant!._id, q.merchant, q.governorate, q.city));
}
