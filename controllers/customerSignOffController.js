import { decryptToken } from "../helpers/token.js";
import client from "../helpers/shopifyAdmin.js";
import operation from "../operations/draftOrderUpdate.js";
import generateShopifyGid from "../helpers/generateShopifyGid.js";

const customerSignOffController = async (req, res) => {
  const { id } = req.query;
  const { data } = await client.request(operation, {
    variables: {
      id: generateShopifyGid("DraftOrder", decryptToken(id)),
      input: {
        metafields: [
          {
            namespace: "custom",
            key: "customer_sign_off",
            value: "true",
            type: "boolean",
          },
        ],
      },
    },
  });

  const { invoiceUrl } = data?.draftOrderUpdate?.draftOrder ?? {
    invoiceUrl: null,
  };

  if (!invoiceUrl) {
    return res.status(404).json({
      status: "error",
      error: "Invalid quote",
    });
  }

  return res.status(200).json({ redirectUrl: invoiceUrl });
};

export default customerSignOffController;
