/**
 * Zod schemas for important external DummyJSON response shapes.
 *
 * These are intentionally focused on the shapes the Workbench depends on
 * (list envelopes, auth payloads, utility endpoints, tools endpoints, and
 * error responses). Item-level schemas for full product/user/recipe records
 * are not required to safely render the Workbench, since the UI treats item
 * bodies as opaque JSON.
 */
import { z } from "zod";

/** Shared pagination fields present on every paginated DummyJSON list. */
export const paginationFields = {
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
} as const;

/**
 * Builds a paginated list response schema for a resource key such as
 * `products` or `users`. If `itemSchema` is omitted, items are validated
 * only as an array.
 */
export function listResponseSchema(
  itemsKey: string,
  itemSchema?: z.ZodType,
): z.ZodType {
  const items =
    itemSchema === undefined
      ? z.array(z.unknown())
      : z.array(itemSchema);
  return z.object({
    [itemsKey]: items,
    ...paginationFields,
  });
}

/** Generic envelope for paginated list responses. */
export const paginatedResponseSchema = z.object({
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

/** Documented error responses are `{ message: string }`. */
export const errorResponseSchema = z.object({
  message: z.string(),
});

/** `/http/{status}` response: status code plus optional custom message. */
export const httpStatusResponseSchema = z.object({
  status: z.union([z.string(), z.number()]),
  message: z.union([z.string(), z.number()]).optional(),
});

/** `/test` route response. */
export const testResponseSchema = z.object({
  status: z.string(),
  method: z.string(),
});

/** `/ip` route response. */
export const ipResponseSchema = z.object({
  ip: z.string(),
  userAgent: z.string(),
});

/** `/auth/login` and `/auth/refresh` response. */
export const authTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  id: z.number(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.string(),
  image: z.string(),
});

/** `/2fa` response. */
export const totpResponseSchema = z.object({
  totp: z.string(),
  expiresIn: z.number(),
  period: z.number(),
});

/** `/c/generate` response. */
export const customResponseUrlSchema = z.object({
  url: z.string(),
});

/** `/webhook/create` response. */
export const webhookCreateSchema = z.object({
  identifier: z.string(),
  url: z.string(),
  expiresAt: z.string(),
});

/** `/webhook/{id}` capture acknowledgement. */
export const webhookCaptureSchema = z.object({
  received: z.boolean(),
  requestId: z.string(),
});

/** `/webhook/{id}/requests/{requestId}` delete response. */
export const webhookDeleteSchema = z.object({
  deleted: z.boolean(),
});

/** Single captured webhook request item. */
export const webhookRequestItemSchema = z.object({
  requestId: z.string(),
  method: z.string(),
  headers: z.record(z.string(), z.unknown()),
  query: z.record(z.string(), z.unknown()),
  body: z.unknown(),
  receivedAt: z.string(),
});

/** `/webhook/{id}/requests` response. */
export const webhookListSchema = z.object({
  identifier: z.string(),
  expiresAt: z.string().optional(),
  requests: z.array(webhookRequestItemSchema),
});