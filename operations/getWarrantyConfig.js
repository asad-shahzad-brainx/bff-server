import client from "../helpers/shopifyAdmin.js";

const query = `
  query getWarrantyConfig($first: Int!) {
    warrantyConfig: metaobjects(type: "warranty_config", first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
        }
      }
    }
  }
`;

export default async function getWarrantyConfig(options = {}) {
  const { first = 100 } = options;

  try {
    const { data, errors } = await client.request(query, {
      variables: { first },
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    const nodes = data?.warrantyConfig?.nodes;
    if (nodes.length > 0) {
      return transformWarrantyConfig(nodes[0]);
    }

    const defaultRates = {
      smallOrderRate: 15,
      largeOrderRate: 12,
    };

    return defaultRates;
  } catch (error) {
    console.error("Error fetching warranty config:", error);
    throw error;
  }
}

function transformWarrantyConfig(metaobject) {
  const result = {};

  metaobject.fields.forEach((field) => {
    if (field.key === "small_order_rate") {
      result.smallOrderRate = parseFloat(field.value);
    } else if (field.key === "large_order_rate") {
      result.largeOrderRate = parseFloat(field.value);
    }
  });

  return result;
}
