import client from "../helpers/shopifyAdmin.js";

const query = `
  query getProfitMargin($first: Int!) {
    profitMargin: metaobjects(type: "profit_margin", first: $first) {
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

export default async function getProfitMargin(cartTotal = 0, options = {}) {
  const { first = 100 } = options;

  try {
    const { data, errors } = await client.request(query, {
      variables: { first },
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    const nodes = data?.profitMargin?.nodes;

    if (!nodes || nodes.length === 0) {
      throw new Error("No profit margin tiers found");
    }

    const matchingTier = findMatchingTier(nodes, cartTotal);

    if (!matchingTier) {
      throw new Error(
        `No matching profit margin tier found for cart total: ${cartTotal}`
      );
    }

    return getMarginFromTier(matchingTier);
  } catch (error) {
    console.error("Error fetching profit margin:", error);
    throw error;
  }
}

function findMatchingTier(tiers, cartTotal) {
  return tiers.find((tier) => {
    const minOrderValue = getFieldValue(tier, "min_order_value");
    const maxOrderValue = getFieldValue(tier, "max_order_value");

    const minValue = parseFloat(minOrderValue) || 0;
    const maxValue = maxOrderValue ? parseFloat(maxOrderValue) : null;

    if (maxValue === null) {
      return cartTotal >= minValue;
    }

    return cartTotal >= minValue && cartTotal < maxValue;
  });
}

function getMarginFromTier(tier) {
  const marginValue = getFieldValue(tier, "margin");
  return parseFloat(marginValue);
}

function getFieldValue(metaobject, key) {
  const field = metaobject.fields.find((field) => field.key === key);
  return field ? field.value : null;
}
