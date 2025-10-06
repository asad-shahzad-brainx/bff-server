import client from "./shopifyAdmin.js";
import draftOrderInvoiceSend from "../operations/draftOrderInvoiceSend.js";

const sendDraftOrderInvoice = async (
  draftOrderId,
  subject,
  bcc = ["orders@buildingsupplybff.com"]
) => {
  const { data, errors } = await client.request(draftOrderInvoiceSend, {
    variables: {
      id: draftOrderId,
      subject,
      bcc: process.env.NODE_ENV === "development" ? [] : bcc,
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
