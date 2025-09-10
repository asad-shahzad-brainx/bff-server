import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {string} subject - The subject of the email
 * @param {string} body - The body of the email
 * @param {string} from - The email address of the sender
 * @param {string|string[]} to - The email address(es) of the recipient(s)
 * @param {Array} attachments - Array of attachment objects
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
const sendEmail = async (subject, body, from, to, attachments) => {
  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: to,
      subject: subject,
      text: body,
      attachments: attachments,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error sending email:", error);
    return { success: false, error };
  }
};

/**
 * Send quote to manufacturer with detailed context
 * @param {Buffer} attachment - PDF attachment buffer
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
const sendQuoteToManufacturer = async (attachment, draftOrderNumber) => {
  const manufacturerEmails = process.env.MANUFACTURER_EMAILS
    ? process.env.MANUFACTURER_EMAILS.split(",").map((email) => email.trim())
    : ["asad.shahzad@brainxtech.com"];

  const fromEmail = "Building Supply BFF <orders@buildingsupplybff.com>";

  const subject = `New Quote Request`;

  const body = `
    Please provide a quote for the attached PDF. If you have any questions, reply to this email.
  `.trim();

  return await sendEmail(subject, body, fromEmail, manufacturerEmails, [
    {
      content: Buffer.from(attachment).toString("base64"),
      filename: `Quote-${draftOrderNumber}.pdf`,
    },
  ]);
};

export { sendEmail, sendQuoteToManufacturer };
