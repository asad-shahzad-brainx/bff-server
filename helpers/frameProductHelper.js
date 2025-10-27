const FRAME_ATTRIBUTES = [
  "frameType",
  "roughOpeningWallThickness", 
  "jambDepth"
];

/**
 * Check if a door configuration requires a frame product
 */
export const requiresFrameProduct = (doorConfig) => {
  return doorConfig && doorConfig.frameType && doorConfig.frameType !== "none";
};

/**
 * Extract frame-specific attributes from door configuration
 */
export const extractFrameAttributes = (doorConfig) => {
  const frameAttributes = {};
  const remainingDoorAttributes = { ...doorConfig };

  FRAME_ATTRIBUTES.forEach(attr => {
    if (doorConfig[attr] !== undefined) {
      frameAttributes[attr] = doorConfig[attr];
      delete remainingDoorAttributes[attr];
    }
  });

  return { frameAttributes, remainingDoorAttributes };
};

/**
 * Create frame line item from door configuration
 */
export const createFrameLineItem = (
  doorItem,
  doorPrice,
  quantity,
  shippingPerUnit,
  frameOptions
) => {
  const { doorConfig, handle: doorHandle } = doorItem;
  
  const frameHandle = doorConfig.frameType;
  const frameOption = frameOptions.find(f => f.handle === frameHandle);
  
  if (!frameOption || !frameOption.frameProduct) {
    throw new Error(`Frame option "${frameHandle}" not found or missing product reference`);
  }

  const { frameAttributes } = extractFrameAttributes(doorConfig);
  const framePrice = doorPrice.breakdown.frame || 0;
  
  const frameWeightage = 1;
  const frameShippingCost = shippingPerUnit * frameWeightage * quantity;
  const framePriceWithShipping = framePrice + frameShippingCost;

  const customAttributes = [
    {
      key: "_frame",
      value: String(framePrice.toFixed(2)),
    },
    {
      key: "_frameType",
      value: frameOption.name,
    },
    {
      key: "_shippingPerUnit", 
      value: String(shippingPerUnit),
    },
    {
      key: "_originalDoorHandle",
      value: typeof doorHandle === "object" ? Object.values(doorHandle)[0] : doorHandle,
    }
  ];

  Object.entries(frameAttributes).forEach(([key, value]) => {
    if (value !== "" && value !== null) {
      customAttributes.push({
        key,
        value: String(value),
      });
    }
  });

  if (doorConfig.finishedOpeningWidth) {
    customAttributes.push({
      key: "doorWidth",
      value: String(doorConfig.finishedOpeningWidth),
    });
  }
  if (doorConfig.finishedOpeningHeight) {
    customAttributes.push({
      key: "doorHeight", 
      value: String(doorConfig.finishedOpeningHeight),
    });
  }

  return {
    variantId: frameOption.frameProduct.variantId,
    quantity: Number(quantity),
    customAttributes,
    priceOverride: {
      amount: framePriceWithShipping.toFixed(2),
      currencyCode: "USD",
    },
  };
};

/**
 * Create door line item with frame attributes removed
 */
export const createDoorLineItem = (
  doorItem,
  doorPrice,
  quantity,
  shippingPerUnit,
  doorProduct,
  customAttributes = []
) => {
  const { doorConfig } = doorItem;
  const { remainingDoorAttributes } = extractFrameAttributes(doorConfig);
  
  // Calculate door-only pricing (subtract frame cost)
  const framePrice = doorPrice.breakdown.frame || 0;
  const doorOnlyPrice = doorPrice.totalPrice - framePrice;
  
  // Calculate door shipping (door without frame has weightage of 1)
  const doorWeightage = 1; // Door alone has weightage of 1  
  const doorShippingCost = shippingPerUnit * doorWeightage * quantity;
  const doorPriceWithShipping = doorOnlyPrice + doorShippingCost;

  // Update custom attributes to remove frame pricing
  const updatedCustomAttributes = customAttributes.map(attr => {
    if (attr.key === "_frame") {
      return { ...attr, value: "0" }; // Set frame cost to 0 for door-only product
    }
    return attr;
  });

  // Remove frame attributes from door config attributes
  const doorConfigAttributes = [];
  Object.entries(remainingDoorAttributes).forEach(([key, value]) => {
    const keysToExclude = [
      "currentSubStepIndex",
      "skippedSteps", 
      "photoUploads",
    ];
    
    if (!keysToExclude.includes(key) && value !== "" && value !== null) {
      doorConfigAttributes.push({
        key,
        value: String(value),
      });
    }
  });

  const { id: variantId } = doorProduct.variants.nodes[0];

  return {
    variantId,
    quantity: Number(quantity),
    customAttributes: [...updatedCustomAttributes, ...doorConfigAttributes],
    priceOverride: {
      amount: doorPriceWithShipping.toFixed(2),
      currencyCode: "USD",
    },
  };
};

export { FRAME_ATTRIBUTES };

