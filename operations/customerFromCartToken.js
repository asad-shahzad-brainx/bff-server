import storefrontClient from "../helpers/storefrontClient.js";
import generateShopifyGid from "../helpers/generateShopifyGid.js";

const operation = `
  query getCartByToken($cartId: ID!) {
    cart(id: $cartId) {
      buyerIdentity {
        customer {
          email
        }
      }
    }
  }
`;

const getCustomerFromCartToken = async (token) => {
  const cartId = generateShopifyGid("Cart", token);
  const { data, errors } = await storefrontClient.request(operation, {
    variables: { cartId },
  });

  if (errors) {
    return null;
  }

  const customer = data.cart.buyerIdentity.customer;

  if (!customer) {
    return null;
  }

  return customer;
};

export default getCustomerFromCartToken;
