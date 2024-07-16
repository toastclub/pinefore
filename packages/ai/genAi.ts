// https://docs.google.com/document/d/1VG8HIyz361zGduWgNG7R_R8Xkv0OOJ8b5C9QKeCjU0c/view#heading=h.5s2qlonhpm36

async function browserAiAPIAvailable() {
  // @ts-expect-error
  if (typeof window == "undefined" || window.ai == undefined) {
    return false;
  }
  try {
    // @ts-expect-error
    const canCreate = await window.ai.canCreateTextSession();
    if (canCreate == "readily") {
      return true;
    }
    if (canCreate == "after-download") {
      // start download
      // @ts-expect-error
      window.ai.createTextSession();
    }
  } catch (e) {
    return false;
  }
  return false;
}

export type AiHandler =
  | {
      function: (type: string, prompt: any) => Promise<any>;
    }
  | {
      accountId: string;
      token: string;
    };

export async function callCfAiServerside(
  data: { text: string; model: string },
  handler: AiHandler
) {
  if ("function" in handler) {
    return handler
      .function(data.model, { prompt: data.text })
      .then((r: any) => r?.response?.response as string | undefined);
  }
  return fetch(
    `https://api.cloudflare.com/client/v4/accounts/${handler.accountId}/ai/run/${data.model}`,
    {
      body: JSON.stringify({
        prompt: data.text,
      }),
      method: "POST",
      headers: {
        Authorization: `Bearer ${handler.token}`,
      },
    }
  )
    .then((r) => r.json())
    .then((r) => {
      return r?.result?.response as string | undefined;
    });
}

export function genAiHandlerFromEnv(
  env: Record<string, any>
): AiHandler | undefined {
  if (env?.CF_AI_ACCOUNT_ID && env?.CF_AI_TOKEN) {
    return {
      accountId: env.CF_AI_ACCOUNT_ID,
      token: env.CF_AI_TOKEN,
    };
  } else if (process?.env?.CF_AI_ACCOUNT_ID && process?.env?.CF_AI_TOKEN) {
    return {
      accountId: process.env.CF_AI_ACCOUNT_ID,
      token: process.env.CF_AI_TOKEN,
    };
  } else if (env.AI) {
    return {
      function: env.AI,
    };
  }
}
