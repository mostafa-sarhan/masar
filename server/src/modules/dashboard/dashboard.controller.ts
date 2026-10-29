import { Request, Response } from "express";
import { ok } from "../../lib/respond";
import * as dashboard from "./dashboard.service";

export async function overview(req: Request, res: Response) {
  ok(res, await dashboard.overview(req));
}
