import client from "./shopifyAdmin.js";
import orderByName from "../operations/orderByName.js";

const getOrderByName = async (orderName) => {
  if (!orderName) {
    throw new Error("Order name is required");
  }

  // Create exact match query using name field
  const searchQuery = `name:"${orderName}"`;

  const { data, errors } = await client.request(orderByName, {
    variables: {
      query: searchQuery,
    },
  });

  if (errors?.graphQLErrors?.length > 0) {
    throw new Error(errors.graphQLErrors[0].message);
  }

  // Return the first matching order or null if not found
  const orders = data?.orders?.edges || [];

  if (orders.length === 0) {
    return null;
  }

  return orders[0].node;
};

export default getOrderByName;
