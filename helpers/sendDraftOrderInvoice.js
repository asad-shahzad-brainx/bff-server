import client from "./shopifyAdmin.js";
import draftOrderInvoiceSend from "../operations/draftOrderInvoiceSend.js";

const sendDraftOrderInvoice = async (draftOrderId) => {
  const { data, errors } = await client.request(draftOrderInvoiceSend, {
    variables: {
      id: draftOrderId,
    },
  });

  if (errors?.graphQLErrors?.length > 0) {
    throw new Error(errors.graphQLErrors[0].message);
  }

  if (data.draftOrderInvoiceSend.userErrors?.length > 0) {
    throw new Error(data.draftOrderInvoiceSend.userErrors[0].message);
  }

  return data.draftOrderInvoiceSend.draftOrder.invoiceSentAt;
};

export default sendDraftOrderInvoice;
