import type { ApiOperation } from "../types";
import { body, delayParam, op } from "./helpers";

const DOCS = "https://dummyjson.com/docs/auth";

export const authOperations: ApiOperation[] = [
  op(
    "auth-login",
    "auth",
    "Login",
    "POST",
    "/auth/login",
    "Authenticate with a username and password from the users dataset. Returns access and refresh tokens.",
    `${DOCS}#auth-login`,
    {
      auth: "none",
      parameters: [delayParam()],
      requestBody: body({
        username: "emilys",
        password: "emilyspass",
        expiresInMins: 30,
      }),
      responseKind: "json",
      tags: ["auth", "login", "token"],
    },
  ),
  op(
    "auth-me",
    "auth",
    "Get current user",
    "GET",
    "/auth/me",
    "Returns the authenticated user. Requires a bearer access token (or cookies).",
    `${DOCS}#auth-me`,
    {
      auth: "required",
      parameters: [delayParam()],
      responseKind: "json",
      tags: ["auth", "me"],
    },
  ),
  op(
    "auth-refresh",
    "auth",
    "Refresh session",
    "POST",
    "/auth/refresh",
    "Refresh the access token using a refresh token. Send `expiresInMins` to choose a new lifetime.",
    `${DOCS}#auth-refresh`,
    {
      auth: "required",
      parameters: [delayParam()],
      requestBody: body({
        refreshToken: "<refresh token>",
        expiresInMins: 30,
      }),
      responseKind: "json",
      tags: ["auth", "refresh", "token"],
    },
  ),
];