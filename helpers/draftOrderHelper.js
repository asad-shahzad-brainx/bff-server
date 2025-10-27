import productByIdentifier from "../operations/productByIdentifier.js";
import { calculateDoorPrice } from "./calculateDoorPrice.js";
import getWarrantyConfig from "../operations/getWarrantyConfig.js";
import getPublishedDoorMetaobjects from "../helpers/getPublishedDoorMetaobjects.js";
import uploadFile from "./uploadFileToAdmin.js";
import waitForUrl from "./waitForUrl.js";
import { v4 as uuidv4 } from "uuid";
import { calculateTotalCost } from "./calculateDoorPrice.js";
import getProfitMargin from "../operations/getProfitMargin.js";
import getShippingCost from "../operations/getShippingCost.js";
import { splitProductsWithFrames } from "./productSplitter.js";

const warrantyProduct = {
  title: "Lifetime Warranty",
  quantity: 1,
  originalUnitPriceWithCurrency: {
    amount: 0,
    currencyCode: "USD",
  },
};

const getItemWeightage = (doorConfig) => {
  return doorConfig.frameType !== "none" ? 2 : 1;
};

const enrichCartItemsWithDoorModels = (cartItems, doorModelArray) => {
  return cartItems.map(item => {
    const doorModel = doorModelArray.find(model => model.handle === item.handle);
    return {
      ...item,
      doorModel: doorModel ? {
        defaultWindowSize: doorModel.defaultWindowSize
      } : null
    };
  });
};

const calculateShippingPerUnit = async (cartItems) => {
  const totalUnits = cartItems.reduce((acc, item) => {
    const weightage = getItemWeightage(item.doorConfig);
    return acc + weightage * item.quantity;
  }, 0);

  try {
    const totalShippingCost = await getShippingCost(totalUnits);
    return Math.round(totalShippingCost / totalUnits);
  } catch (error) {
    console.error("Error calculating dynamic shipping cost:", error);
    // Fallback to original logic
    const totalShippingCost = totalUnits > 1 ? 600 : 400;
    return Math.round(totalShippingCost / totalUnits);
  }
};

const generateDraftOrderInput = async (requestBody, files = [], isTeamMember = false) => {
  const doorModelArray = await getPublishedDoorMetaobjects(250, true);
  const { contactInformation, selectedUpsells, cart: cartItems } = requestBody;

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    country,
    zipCode,
    useSameAddress,
    billingAddress,
    billingCity,
    billingState,
    billingZipCode,
    billingCountry,
  } = contactInformation;

  if (!email && !phone) {
    return;
  }

  const enrichedCart = enrichCartItemsWithDoorModels(cartItems, doorModelArray);

  const shippingPerUnit = await calculateShippingPerUnit(cartItems);
  const warrantyConfig = await getWarrantyConfig();

  const cartTotalCost = await calculateTotalCost(cartItems, doorModelArray);
  const profitMargin = await getProfitMargin(cartTotalCost);
  const profitMarginConfig = {
    door: profitMargin,
    frame: profitMargin,
    jambGuard: profitMargin,
    protectionPlate: profitMargin,
    bumper: profitMargin,
    aluminumStrip: profitMargin,
  };

  // Use new product splitting logic to handle door and frame separation
  const lineItems = await splitProductsWithFrames(
    cartItems,
    doorModelArray,
    profitMarginConfig,
    shippingPerUnit,
    files
  );

  const input = {
    lineItems,
  };

  if (email) {
    input.email = email;
  }

  if (phone) {
    input.phone = phone;
  }

  input.tags = ["Configurator Quote", isTeamMember ? "Team Quote" : "Customer Flow"];

  const parsedUpsells = JSON.parse(selectedUpsells);
  const warrantyType = parsedUpsells.id;

  const totalCartPrice = lineItems.reduce((acc, item) => {
    return acc + parseFloat(item.priceOverride.amount);
  }, 0);

  if (warrantyType === "lifetime-warranty") {
    const warrantyAmount =
      totalCartPrice > 5000
        ? (totalCartPrice * warrantyConfig.largeOrderRate) / 100
        : (totalCartPrice * warrantyConfig.smallOrderRate) / 100;
    warrantyProduct.originalUnitPriceWithCurrency.amount =
      warrantyAmount.toFixed(2);
    warrantyProduct.customAttributes = [
      {
        key: "amount",
        value: warrantyAmount.toFixed(2),
      },
    ];
    input.lineItems.push(warrantyProduct);
    input.tags.push("lifetime-warranty");
  } else {
    input.tags.push("standard-warranty");
  }

  input.shippingLine = {
    title: "Free Shipping",
    priceWithCurrency: {
      amount: 0,
      currencyCode: "USD",
    },
  };

  input.shippingAddress = {
    address1: address,
    city,
    provinceCode: state,
    zip: zipCode,
    countryCode: country,
    firstName,
    lastName,
    phone,
  };

  if (!useSameAddress || useSameAddress === "false") {
    input.billingAddress = {
      address1: billingAddress,
      city: billingCity,
      provinceCode: billingState,
      zip: billingZipCode,
      countryCode: billingCountry,
      firstName,
      lastName,
      phone,
    };
  }

  input.metafields = [
    {
      namespace: "custom",
      key: "customer_sign_off",
      value: "false",
      type: "boolean",
    },
  ];

  return { input, enrichedCart };
};

export default generateDraftOrderInput;
