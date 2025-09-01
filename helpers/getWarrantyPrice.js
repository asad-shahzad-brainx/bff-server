import productByIdentifier from "../operations/productByIdentifier.js";
import { calculateDoorPrice } from "./calculateDoorPrice.js";
import getWarrantyConfig from "../operations/getWarrantyConfig.js";
import getPublishedDoorMetaobjects from "../helpers/getPublishedDoorMetaobjects.js";

const getItemWeightage = (doorConfig) => {
  return doorConfig.frameType !== "none" ? 2 : 1;
};

const calculateShippingPerUnit = (cartItems) => {
  const totalUnits = cartItems.reduce((acc, item) => {
    const weightage = getItemWeightage(item.doorConfig);
    return acc + weightage * item.quantity;
  }, 0);

  const totalShippingCost = totalUnits > 1 ? 600 : 400;
  return Math.round(totalShippingCost / totalUnits);
};

const getWarrantyPrice = async (requestBody, files = []) => {
  const doorModelArray = await getPublishedDoorMetaobjects(50, true);
  const { cart: cartItems } = requestBody;

  const shippingPerUnit = calculateShippingPerUnit(cartItems);
  const warrantyConfig = await getWarrantyConfig();

  const lineItems = await Promise.all(
    cartItems.map(async (item, index) => {
      const { doorConfig, handle, quantity, margins } = item;
      if (!doorConfig) {
        return;
      }

      const marginConfig = margins && JSON.parse(margins);

      const doorModel = doorModelArray.find((model) => model.handle === handle);
      const doorPrice = await calculateDoorPrice(
        doorModel,
        doorConfig,
        quantity,
        marginConfig
      );

      const customAttributes = [];

      for (const [key, value] of Object.entries(doorPrice.breakdown)) {
        customAttributes.push({
          key: `_${key}`,
          value: String(value),
        });
      }

      customAttributes.push({
        key: `_shippingPerUnit`,
        value: String(shippingPerUnit),
      });

      const keysToExclude = [
        "currentSubStepIndex",
        "skippedSteps",
        "photoUploads",
      ];

      Object.entries(doorConfig).forEach(([key, value]) => {
        if (!keysToExclude.includes(key) && value !== "" && value !== null) {
          customAttributes.push({
            key,
            value: String(value),
          });
        }
      });

      const productHandle =
        typeof handle === "object" ? Object.values(handle)[0] : handle;
      const product = await productByIdentifier(productHandle);

      if (!product) {
        return;
      }

      const { id: variantId } = product.variants.nodes[0];

      const itemWeightage = getItemWeightage(doorConfig);
      const shippingCostForItem = shippingPerUnit * itemWeightage * quantity;
      const totalPriceWithShipping = doorPrice.totalPrice + shippingCostForItem;

      const priceOverride = {
        amount: totalPriceWithShipping.toFixed(2),
        currencyCode: "USD",
      };

      return {
        variantId,
        quantity: Number(quantity),
        customAttributes,
        priceOverride,
      };
    })
  );

  const totalCartPrice = lineItems.reduce((acc, item) => {
    return acc + parseFloat(item.priceOverride.amount);
  }, 0);

  const warrantyAmount =
    totalCartPrice > 5000
      ? (totalCartPrice * warrantyConfig.largeOrderRate) / 100
      : (totalCartPrice * warrantyConfig.smallOrderRate) / 100;

  return warrantyAmount;
};

export default getWarrantyPrice;
