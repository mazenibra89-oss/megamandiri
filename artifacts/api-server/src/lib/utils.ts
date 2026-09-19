import { randomBytes } from "crypto";

export const generateId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
