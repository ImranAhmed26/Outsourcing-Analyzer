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

// const sendEmail = async ({
//   subject,
//   content,
//   to,
//   name,
// }: {
//   to: string;
//   name: string;
//   subject: string;
//   content: string;
// }) => {
//   const mailerSend = new MailerSend({
//     apiKey: process.env.SMTP_KEY as string,
//   });
//   const sentFrom = new Sender("contact@leadsgen.com", "Support");
//   const recipients = [new Recipient(to, name)];
//   const emailParams = new EmailParams()
//     .setFrom(sentFrom)
//     .setTo(recipients)
//     .setReplyTo(sentFrom)
//     .setSubject(subject)
//     .setHtml(
//       `
//   <h1>Welcome to LeadGen!</h1>
//   <h2>Access AI-Powered Business Leads</h2>
//   <p>Better insights, better accuracy, more conversion.</p>
// `
//     )
//     .setText(content);
//   const res = await mailerSend.email.send(emailParams);
//   console.log(res);
// };

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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
