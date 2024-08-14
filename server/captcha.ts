/// Adapted from https://github.com/cloudflare/pages-plugins/blob/main/packages/turnstile/functions/index.ts

import { HttpError } from "$plugins/error";
import { StatusMap } from "elysia";
import { MODE } from "../constants";

const errorStringMap = {
  "missing-input-secret": "The secret parameter was not passed.",
  "invalid-input-secret": "The secret parameter was invalid or did not exist.",
  "missing-input-response": "The response parameter was not passed.",
  "invalid-input-response": "The response parameter is invalid or has expired.",
  "invalid-widget-id":
    "The widget ID extracted from the parsed site secret key was invalid or did not exist.",
  "invalid-parsed-secret":
    "The secret extracted from the parsed site secret key was invalid.",
  "bad-request": "The request was rejected because it was malformed.",
  "timeout-or-duplicate":
    "The response parameter has already been validated before.",
  "invalid-idempotency-key": "The provided idempotendy key was malformed.",
  "internal-error":
    "An internal error happened while validating the response. The request can be retried.",
};

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const NOT_SO_SECRET_TESTING_KEYS = {
  always_pass: "1x0000000000000000000000000000000AA",
  always_fail: "2x0000000000000000000000000000000AA",
  token_already_spent: "3x0000000000000000000000000000000AA",
};

export async function captcha(context: {
  ip?: string;
  response: string;
  env: any;
}) {
  const secret =
    MODE == "development"
      ? NOT_SO_SECRET_TESTING_KEYS.always_pass
      : context.env.CAPTCHA_PRIVATEKEY!;
  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", context.response);
  if (context.ip) formData.set("remoteip", context.ip);

  const response = await fetch(SITEVERIFY_URL, {
    method: "POST",
    body: formData,
  });
  const turnstile = await response.json();

  if (!turnstile.success) {
    const descriptions = turnstile["error-codes"].map(
      (errorCode: keyof typeof errorStringMap) =>
        errorStringMap[errorCode] || "An unexpected error has occurred."
    );

    throw new HttpError(
      StatusMap["Bad Request"],
      "Form validation errors occurred",
      [["cf-turnstile-response", descriptions.join("\n")]]
    );
  }
}
