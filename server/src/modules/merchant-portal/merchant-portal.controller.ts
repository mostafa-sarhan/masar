import { Request, Response } from "express";
import { ok, created } from "../../lib/respond";
import { idParams } from "../../lib/validate";
import { shippingQuoteQuery } from "@masar/shared";
import { portalOrderBody, portalListQuery, statementQuery } from "./merchant-portal.schema";
import * as portal from "./merchant-portal.service";

export async function list(req: Request, res: Response) {
  const { page, limit, ...q } = portalListQuery.parse(req.query);
  const { items, meta } = await portal.listOwnOrders(req, { ...q, archived: "all" }, page, limit);
  ok(res, items, meta);
}

export async function get(req: Request, res: Response) {
  ok(res, await portal.getOwnOrder(req, idParams.parse(req.params).id));
}

export async function create(req: Request, res: Response) {
  const order = await portal.createOwnOrder(req, portalOrderBody.parse(req.body));
  created(res, await portal.getOwnOrder(req, order._id.toString()));
}

export async function statement(req: Request, res: Response) {
  const { from, to } = statementQuery.parse(req.query);
  ok(res, await portal.statement(req, from, to));
}

export async function apiKey(req: Request, res: Response) {
  ok(res, await portal.apiKeyInfo(req));
}

export async function rotateApiKey(req: Request, res: Response) {
  ok(res, await portal.rotateOwnApiKey(req));
}

export async function quote(req: Request, res: Response) {
  // `merchant` is ignored: the quote is always for the logged-in merchant.
  const q = shippingQuoteQuery.parse(req.query);
  const { zoneName, shippingFee } = await portal.quote(req, q.governorate, q.city);
  ok(res, { zoneName, shippingFee });
}
