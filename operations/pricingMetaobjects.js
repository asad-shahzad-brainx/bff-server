import client from "../helpers/shopifyAdmin.js";

const bundledPricingQuery = `
  query GetAllPricingMetaobjects($first: Int!) {
    framePricing: metaobjects(type: "frame_pricing", first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
          reference {
            ... on Product {
              id
              handle
              title
              variants(first: 1) {
                nodes {
                  id
                }
              }
            }
          }
        }
      }
    }
    jambGuardPricing: metaobjects(type: "jamb_guard_pricing", first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
        }
      }
    }
    protectionPlatePricing: metaobjects(type: "protection_plate_pricing", first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
        }
      }
    }
    bumperPricing: metaobjects(type: "bumper_pricing", first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
        }
      }
    }
    aluminumStripPricing: metaobjects(type: "aluminum_strip_pricing", first: $first) {
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

const getAllPricingMetaobjects = async (options = {}) => {
  const { first = 100 } = options;

  try {
    const { data, errors } = await client.request(bundledPricingQuery, {
      variables: { first },
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    const transformed = {};
    transformed.frame = transformFramePricing(
      data?.framePricing?.nodes || []
    );
    transformed.jambGuard = transformJambGuardPricing(
      data?.jambGuardPricing?.nodes
    );
    transformed.protectionPlate = transformProtectionPlatePricing(
      data?.protectionPlatePricing?.nodes
    );
    transformed.bumper = transformBumperPricing(data?.bumperPricing?.nodes);
    transformed.aluminumStrip = transformAluminumStripPricing(
      data?.aluminumStripPricing?.nodes
    );

    return transformed;
  } catch (error) {
    console.error("Error fetching pricing metaobjects:", error);
    throw error;
  }
};

const normalize = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

const transformPricingFields = (fields) => {
  return fields.reduce((acc, field) => {
    if (field.key !== "name") {
      acc[toCamelCase(field.key)] = field.value;
    }
    return acc;
  }, {});
};

const transformFramePricing = (nodes) => {
  return nodes
    .map((node) => {
      const fieldsMap = {};
      node.fields.forEach((field) => {
        fieldsMap[field.key] = field;
      });

      const frameProduct = fieldsMap.frame_product?.reference;
      
      if (!frameProduct || !frameProduct.handle || !frameProduct.variants?.nodes[0]?.id) {
        return null;
      }
      
      return {
        handle: node.handle,
        name: fieldsMap.name?.value || '',
        frameProduct: {
          handle: frameProduct.handle,
          title: frameProduct.title,
          variantId: frameProduct.variants.nodes[0].id,
        },
        pricing: {
          standard: parseFloat(fieldsMap.standard?.value || 0),
          tall: parseFloat(fieldsMap.tall?.value || 0),
          extraTall: parseFloat(fieldsMap.extra_tall?.value || 0),
        },
      };
    })
    .filter(Boolean);
};

function transformProtectionPlatePricing(data) {
  const output = {};

  data.forEach((item) => {
    const obj = Object.fromEntries(item.fields.map((f) => [f.key, f.value]));
    const key = `${obj.width}_${obj.height}_${obj.door_type.toLowerCase()}`;
    const material = normalize(obj.material);
    const price = parseFloat(obj.price);

    if (!output[key]) {
      output[key] = {};
    }
    output[key][material] = price;
  });

  return output;
}

function transformJambGuardPricing(rawJambGuardPricing) {
  const result = {};

  rawJambGuardPricing.forEach((item) => {
    const fieldMap = Object.fromEntries(
      item.fields.map((f) => [f.key.toLowerCase(), f.value])
    );
    const size = fieldMap.size?.toLowerCase();
    const material = fieldMap.material?.toLowerCase();
    const price = parseFloat(fieldMap.price);

    if (!size || !material || isNaN(price)) return;

    if (!result[size]) {
      result[size] = {};
    }

    const handle = normalize(material);
    result[size][handle] = price;
  });

  return result;
}

const transformBumperPricing = (data) => {
  const output = {};

  data.forEach((item) => {
    const obj = Object.fromEntries(item.fields.map((f) => [f.key, f.value]));
    const key = `${obj.width}_${obj.height}`;
    // const materialKey = obj.material.toLowerCase().includes("black")
    //   ? "black"
    //   : obj.material.toLowerCase().includes("metallic")
    //     ? "metallic"
    //     : obj.material.toLowerCase();
    const materialKey = obj.material.toLowerCase().replace(/\s+/g, "-");

    if (!output[key]) output[key] = {};
    output[key][materialKey] = parseFloat(obj.price);
  });

  return output;
};

// make it into a function
const transformAluminumStripPricing = (data) => {
  return data.reduce((acc, item) => {
    const width = item.fields.find((f) => f.key === "width")?.value;
    const price = item.fields.find((f) => f.key === "price")?.value;
    if (width && price) {
      acc[width] = parseFloat(price);
    }
    return acc;
  }, {});
};

const getFramePricingByDimensions = (framePricing, width, height) => {
  return framePricing.find((frame) => {
    const fields = transformPricingFields(frame.fields);
    return (
      parseFloat(fields.width) === width && parseFloat(fields.height) === height
    );
  });
};

const getJambGuardPricingBySize = (jambGuardPricing, size) => {
  return jambGuardPricing.find((jambGuard) => {
    const fields = transformPricingFields(jambGuard.fields);
    return fields.size === size;
  });
};

const getProtectionPlatePricingBySize = (protectionPlatePricing, size) => {
  return protectionPlatePricing.find((plate) => {
    const fields = transformPricingFields(plate.fields);
    return fields.size === size;
  });
};

const getBumperPricingBySize = (bumperPricing, size) => {
  return bumperPricing.find((bumper) => {
    const fields = transformPricingFields(bumper.fields);
    return fields.size === size;
  });
};

const getAluminumStripPricingByLength = (aluminumStripPricing, lengthFeet) => {
  return aluminumStripPricing.find((strip) => {
    const fields = transformPricingFields(strip.fields);
    return parseFloat(fields.length_feet) === lengthFeet;
  });
};

const calculateTotalPricing = (specifications) => {
  const {
    framePricing = [],
    jambGuardPricing = [],
    protectionPlatePricing = [],
    bumperPricing = [],
    aluminumStripPricing = [],
    frameSpecs = {},
    jambGuardSpecs = {},
    protectionPlateSpecs = {},
    bumperSpecs = {},
    aluminumStripSpecs = {},
  } = specifications;

  let total = 0;

  if (frameSpecs.width && frameSpecs.height) {
    const framePrice = getFramePricingByDimensions(
      framePricing,
      frameSpecs.width,
      frameSpecs.height
    );
    if (framePrice) {
      const fields = transformPricingFields(framePrice.fields);
      total += parseFloat(fields.price || 0);
    }
  }

  if (jambGuardSpecs.size) {
    const jambGuardPrice = getJambGuardPricingBySize(
      jambGuardPricing,
      jambGuardSpecs.size
    );
    if (jambGuardPrice) {
      const fields = transformPricingFields(jambGuardPrice.fields);
      total += parseFloat(fields.price || 0);
    }
  }

  if (protectionPlateSpecs.size) {
    const protectionPlatePrice = getProtectionPlatePricingBySize(
      protectionPlatePricing,
      protectionPlateSpecs.size
    );
    if (protectionPlatePrice) {
      const fields = transformPricingFields(protectionPlatePrice.fields);
      total += parseFloat(fields.price || 0);
    }
  }

  if (bumperSpecs.size) {
    const bumperPrice = getBumperPricingBySize(bumperPricing, bumperSpecs.size);
    if (bumperPrice) {
      const fields = transformPricingFields(bumperPrice.fields);
      total += parseFloat(fields.price || 0);
    }
  }

  if (aluminumStripSpecs.lengthFeet) {
    const aluminumStripPrice = getAluminumStripPricingByLength(
      aluminumStripPricing,
      aluminumStripSpecs.lengthFeet
    );
    if (aluminumStripPrice) {
      const fields = transformPricingFields(aluminumStripPrice.fields);
      total += parseFloat(fields.price || 0);
    }
  }

  return total;
};

const formatPricingResponse = (pricingData) => {
  const formatPricingGroup = (group) => {
    return group.map((item) => ({
      id: item.id,
      handle: item.handle,
      ...transformPricingFields(item.fields),
    }));
  };

  return {
    framePricing: formatPricingGroup(pricingData.framePricing),
    jambGuardPricing: formatPricingGroup(pricingData.jambGuardPricing),
    protectionPlatePricing: formatPricingGroup(
      pricingData.protectionPlatePricing
    ),
    bumperPricing: formatPricingGroup(pricingData.bumperPricing),
    aluminumStripPricing: formatPricingGroup(pricingData.aluminumStripPricing),
  };
};

const getPricingByCategory = async (category, options = {}) => {
  const allPricing = await getAllPricingMetaobjects(options);

  switch (category.toLowerCase()) {
    case "frame":
      return allPricing.framePricing;
    case "jamb_guard":
      return allPricing.jambGuardPricing;
    case "protection_plate":
      return allPricing.protectionPlatePricing;
    case "bumper":
      return allPricing.bumperPricing;
    case "aluminum_strip":
      return allPricing.aluminumStripPricing;
    default:
      throw new Error(`Unknown pricing category: ${category}`);
  }
};

export {
  getAllPricingMetaobjects,
  transformPricingFields,
  getFramePricingByDimensions,
  getJambGuardPricingBySize,
  getProtectionPlatePricingBySize,
  getBumperPricingBySize,
  getAluminumStripPricingByLength,
  calculateTotalPricing,
  formatPricingResponse,
  getPricingByCategory,
};

export default getAllPricingMetaobjects;
