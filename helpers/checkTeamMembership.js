import getCustomerFromCartToken from "../operations/customerFromCartToken.js";
import { getTeamEmails } from "../operations/teamEmails.js";

export const checkTeamMembership = async (token) => {
  if (!token) {
    return false;
  }

  try {
    const customer = await getCustomerFromCartToken(token);

    if (!customer) {
      return false;
    }

    const email = customer.email;
    if (!email) {
      return false;
    }

    const team = await getTeamEmails();
    const emails = team?.fields?.map((field) => field.value);
    if (!emails) {
      return false;
    }

    const parsedEmails = JSON.parse(emails);
    return parsedEmails?.includes(email) || false;
  } catch (error) {
    console.error("Error checking team membership:", error);
    return false;
  }
};
