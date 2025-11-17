// src/lib/emailService.ts

import { Resend } from "resend";
import { render } from "@react-email/render";
import { VisitEmailTemplate } from "@/components/email/VisitEmailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVisitNotificationArgs {
  user: {
    name: string | null;
    email: string | null;
  };
  visitId: string;
  note: string;
}

/**
 * Renders and sends the visit notification email.
 * This function is designed to be called from any server-side procedure.
 */
export async function sendVisitNotification({
  user,
  visitId,
  note,
}: SendVisitNotificationArgs) {
  // 1. Validate inputs
  if (!user.email || !user.name) {
    console.warn(
      `Visit ${visitId} created, but user ${user.email} has no email or name. Skipping email.`
    );
    return; // Exit gracefully
  }

  try {
    // 2. Render the React component to HTML (Async for React 19)
    // This is the only module that bundles React dependencies.
    const emailHtml = await render(
      <VisitEmailTemplate customerName={user.name} visitNote={note} />
    );

    // 3. Send the email
    await resend.emails.send({
      from: "Greenworks Landscaping <info@gnwlandscaping.ca>",
      to: user.email,
      subject: "We've completed your recent service!",
      html: emailHtml,
    });
  } catch (emailError) {
    // Log the error but do not throw
    // The API mutation should not fail just because the email failed.
    console.error(
      `Failed to send visit email for visit ${visitId}:`,
      emailError
    );
  }
}
