import client from "../helpers/shopifyAdmin.js";

const operation = `
  query getProductByIdentifier($handle: String!) {
    productByIdentifier(identifier: {handle: $handle}) {
      id
      variants(first: 250) {
        nodes {
          id
        }
      }
    }
  }
`;

const productByIdentifier = async (handle) => {
  const { data, errors } = await client.request(operation, {
    variables: { handle },
  });
  return data?.productByIdentifier;
};

export default productByIdentifier;
