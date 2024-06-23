import { templates, layout } from "./macros" with { type: 'macro' };
import { AwsClient } from "aws4fetch";

const ENDPOINT =
  "https://email.us-east-2.amazonaws.com/v2/email/outbound-emails";
export const createClient = () => {
  return new AwsClient({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.MAIL_KEY_ID!,
    secretAccessKey: process.env.MAIL_SECRET!,
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

let _templates = templates();
let layouts = layout();

export const sendEmail = async (
  to: string,
  template: (typeof templateTypes)[number],
  data?: Record<string, string>
) => {
  const client = createClient();
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
  console.log(await res.text());
};
