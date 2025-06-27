import client from "./shopifyAdmin.js";
import draftOrderById from "../operations/draftOrderById.js";
import generateShopifyGid from "./generateShopifyGid.js";
import { decryptToken } from "./token.js";

const getDraftOrderById = async (
  id,
  includeInvoiceUrl = false,
  namespace = "custom",
  keys = ["is_expired", "customer_sign_off"]
) => {
  const draftOrderId = generateShopifyGid("DraftOrder", decryptToken(id));
  const { data, errors } = await client.request(draftOrderById, {
    variables: {
      id: draftOrderId,
      keys: keys.map((key) => `${namespace}.${key}`),
      includeInvoiceUrl,
    },
  });

  if (errors?.graphQLErrors?.length > 0) {
    throw new Error(errors.graphQLErrors[0].message);
  }

  return data.draftOrder;
};

export default getDraftOrderById;
