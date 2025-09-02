import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

import { Resend } from "resend";

const sendEmail = ({
  subject,
  content,
  to,
}: {
  to: string;
  name: string;
  subject: string;
  content: string;
}) => {
  const resend = new Resend(process.env.SMTP_KEY);
  resend.emails.send({
    from: "LeadsGen <onboarding@resend.dev>",
    to: [to],
    subject,
    html: content,
  });
};

export const auth = betterAuth({
  database: new Database("database.sqlite"),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        name: user.name,
        subject: "Verify your email address",
        content: `Click the link to verify your email: ${url}`,
      });
    },
  },
  user: {
    additionalFields: {
      terms: {
        type: "boolean",
        required: true,
      },
    },
  },
  advanced: {
    useSecureCookies: true,
    cookiePrefix: process.env.COOKIE_PREFIX,
  },
});
