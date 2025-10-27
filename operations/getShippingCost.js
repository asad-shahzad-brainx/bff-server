import client from "../helpers/shopifyAdmin.js";

const query = `
  query getShippingCost($first: Int!) {
    shippingRules: metaobjects(type: "shipping_rules", first: $first) {
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

export default async function getShippingCost(totalUnits = 0, options = {}) {
  const { first = 100 } = options;

  try {
    const { data, errors } = await client.request(query, {
      variables: { first },
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    const nodes = data?.shippingRules?.nodes;

    if (!nodes || nodes.length === 0) {
      console.warn("No shipping rules found, using fallback calculation");
      return getFallbackShippingCost(totalUnits);
    }

    const matchingTier = findMatchingShippingTier(nodes, totalUnits);

    if (!matchingTier) {
      console.warn(
        `No matching shipping tier found for total units: ${totalUnits}, using fallback`
      );
      return getFallbackShippingCost(totalUnits);
    }

    return getShippingCostFromTier(matchingTier);
  } catch (error) {
    console.error("Error fetching shipping cost:", error);
    return getFallbackShippingCost(totalUnits);
  }
}

function findMatchingShippingTier(tiers, totalUnits) {
  return tiers.find((tier) => {
    const minUnits = parseInt(getFieldValue(tier, "min_number_of_units") || "0");
    const maxUnits = parseInt(getFieldValue(tier, "max_number_of_units") || "999999");
    
    return totalUnits >= minUnits && totalUnits <= maxUnits;
  });
}

function getShippingCostFromTier(tier) {
  const shippingCostValue = getFieldValue(tier, "shipping_cost");
  if (!shippingCostValue) {
    throw new Error("Shipping cost value not found in tier");
  }
  return parseFloat(shippingCostValue);
}

function getFieldValue(metaobject, key) {
  const field = metaobject.fields.find((field) => field.key === key);
  return field ? field.value : null;
}

function getFallbackShippingCost(totalUnits) {
  // Fallback to original hardcoded logic
  return totalUnits > 1 ? 600 : 400;
}

