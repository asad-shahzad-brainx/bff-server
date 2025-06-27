import { getPageMetafield } from "./getPageContent.js";

export const checkTeamMembership = async (customerEmail) => {
  try {
    const team = await getPageMetafield("customer-flow", "custom", "team");
    const emails = team?.references?.nodes?.map((node) => node.email);
    return emails?.includes(customerEmail) || false;
  } catch (error) {
    console.error("Error checking team membership:", error);
    return false;
  }
};
