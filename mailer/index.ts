import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { templates, layout } from "./macros" with { type: 'macro' };

const createClient = () => {
  return new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.MAIL_KEY_ID!,
      secretAccessKey: process.env.MAIL_SECRET!,
    },
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
  "sign-up",
  "deleted-account",
] as const;

let _templates = templates()
let layouts = layout()

export const sendEmail = async (
  to: string,
  template: (typeof templateTypes)[number]
) => {
  const client = createClient();
  const command = new SendEmailCommand({
    Source: '"📀 The Pinefore Computer" <computer@pinefore.com>',
    Destination: {
      ToAddresses: [to],
    },
    ReplyToAddresses: ["evan@boehs.org"],
    Message: {
      Subject: {
        Data: _templates[template].title,
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: layouts.replace('{title}', _templates[template].title).replace('{contents}', _templates[template].contents),
        },
        Text: {
          Charset: "UTF-8",
          Data: "",
        },
      },
    },
  });
  await client.send(command).catch(console.error)
};
