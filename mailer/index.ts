import { templates, layout } from "./macros" with { type: 'macro' };
import { AwsClient } from "aws4fetch";

const ENDPOINT =
  "https://email.us-east-2.amazonaws.com/v2/email/outbound-emails";
export const createClient = (env: {
  AWS_REGION: string;
  MAIL_KEY_ID: string;
  MAIL_SECRET: string;
}) => {
  return new AwsClient({
    region: env.AWS_REGION,
    accessKeyId: env.MAIL_KEY_ID,
    secretAccessKey: env.MAIL_SECRET,
  });
};

export const templateTypes = [
  "billing/archive-downgrade",
  "billing/archive-upgrade",
  "billing/cancelled",
  "billing/new-subscriber",
  "billing/payment-failed",
  "billing/renewing-soon",
  "billing/repeat-subscriber",
  "billing/subscriber-overdue-reminder",
  "billing/trial-ending-soon",
  "security/email-changed",
  "security/password-changed",
  "security/password-reset-done",
  "security/password-reset-request",
  "security/token-created",
  "sign-up",
  "deleted-account",
  "prereg",
] as const;

// https://github.com/oven-sh/bun/issues/13398
// todo: dont do this
let _templates: {
  [key: string]: {
    title: string;
    contents: string;
  };
} = JSON.parse(templates());
let layouts = layout();

export const sendEmail = async (
  to: string,
  template: (typeof templateTypes)[number],
  env: { AWS_REGION: string; MAIL_KEY_ID: string; MAIL_SECRET: string },
  data?: Record<string, string>,
) => {
  const client = createClient(env);
  let target = _templates[template];
  let targetText = target.contents;
  if (data) {
    targetText = targetText.replace(
      /{([^}]+)}/g,
      (match, key) => data[key] || match
    );
  }
  let htmlData = layouts
    .replace("{title}", target.title)
    .replace("{contents}", targetText);
  const command = {
    FromEmailAddress: '"The Pinefore Computer" <computer@pinefore.com>',
    Destination: {
      ToAddresses: [to],
    },
    ReplyToAddresses: ["evan@boehs.org"],
    Content: {
      Simple: {
        Subject: {
          Data: target.title,
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: htmlData,
          },
          Text: {
            Charset: "UTF-8",
            Data: targetText,
          },
        },
      },
    },
  };
  let res = await client.fetch(ENDPOINT, { body: JSON.stringify(command) });
};
