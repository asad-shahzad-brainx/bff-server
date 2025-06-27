import client from "./shopifyAdmin.js";
import draftOrdersByCustomerId from "../operations/draftOrdersByCustomerId.js";
import getNodesFromConnection from "./getNodesFromConnection.js";
import extractIdFromGid from "./extractIdFromGid.js";
import { encryptToken } from "./token.js";

const getCustomerQuotes = async (req, res) => {
  const { customerId } = req.params;
  const { after = null } = req.query;
  const first = 10;

  const query = `customer_id:${customerId}`;
  const { data, errors } = await client.request(draftOrdersByCustomerId, {
    variables: {
      query,
      first,
      after,
    },
  });

  if (errors?.graphQLErrors?.length > 0) {
    return res.status(500).json({ errors: errors.graphQLErrors });
  }

  const draftOrders = getNodesFromConnection(data.draftOrders);
  const quotes = draftOrders.map((quote) => ({
    id: encryptToken(extractIdFromGid(quote.id)),
    name: quote.name,
    createdAt: quote.createdAt,
    totalPrice: `${quote.totalLineItemsPriceSet.presentmentMoney.amount} ${quote.totalLineItemsPriceSet.presentmentMoney.currencyCode}`,
  }));

  return res.status(200).json({
    quotes,
    cursor: data.draftOrders.pageInfo.hasNextPage
      ? data.draftOrders.pageInfo.endCursor
      : null,
  });
};

export default getCustomerQuotes;
