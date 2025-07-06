import { getPageMetafield } from "./getPageContent.js";
import getCustomerFromCartToken from "../operations/customerFromCartToken.js";

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
    if (email) {
      return false;
    }

    const team = await getPageMetafield("customer-flow", "custom", "team");
    const emails = team?.references?.nodes?.map((node) => node.email);
    return emails?.includes(email) || false;
  } catch (error) {
    console.error("Error checking team membership:", error);
    return false;
  }
};
