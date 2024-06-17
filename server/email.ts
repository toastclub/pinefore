import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

export const sendEmail = async (
  to: string,
  template: (typeof templateTypes)[number]
) => {
  const client = createClient();
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: "",
        },
      },
    },
  });
};
