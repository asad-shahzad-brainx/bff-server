import productByIdentifier from "../operations/productByIdentifier.js";
import { calculateDoorPrice } from "./calculateDoorPrice.js";
import uploadFile from "./uploadFileToAdmin.js";
import waitForUrl from "./waitForUrl.js";
import { v4 as uuidv4 } from "uuid";
import { 
  requiresFrameProduct, 
  createFrameLineItem, 
  createDoorLineItem 
} from "./frameProductHelper.js";
import { getAllPricingMetaobjects } from "../operations/pricingMetaobjects.js";

/**
 * Split cart items into separate door and frame products where applicable
 * @param {Array} cartItems - Original cart items
 * @param {Array} doorModelArray - Door model data
 * @param {Object} profitMarginConfig - Profit margin configuration
 * @param {number} shippingPerUnit - Shipping cost per unit
 * @param {Array} files - Uploaded files (photos)
 * @returns {Array} Array of line items for draft order
 */
export const splitProductsWithFrames = async (
  cartItems,
  doorModelArray,
  profitMarginConfig,
  shippingPerUnit,
  files = []
) => {
  const pricingData = await getAllPricingMetaobjects();
  const frameOptions = pricingData.frame;

  const processedItems = await Promise.all(
    cartItems.map(async (item, index) => {
      const { doorConfig, handle, quantity, margins } = item;
      
      if (!doorConfig) {
        return null;
      }

      const marginConfig = margins ? JSON.parse(margins) : profitMarginConfig;

      const itemPhotos = files.filter((file) =>
        file.fieldname.includes(`photos[${index}]`)
      );

      const doorModel = doorModelArray.find((model) => model.handle === handle);
      if (!doorModel) {
        console.warn(`Door model not found for handle: ${handle}`);
        return null;
      }

      const productHandle = typeof handle === "object" ? Object.values(handle)[0] : handle;

      const [doorPrice, doorProduct] = await Promise.all([
        calculateDoorPrice(doorModel, doorConfig, quantity, marginConfig),
        productByIdentifier(productHandle)
      ]);
      
      if (!doorProduct) {
        console.warn(`Door product not found for handle: ${productHandle}`);
        return null;
      }

      const baseCustomAttributes = [];

      for (const [key, value] of Object.entries(doorPrice.breakdown)) {
        baseCustomAttributes.push({
          key: `_${key}`,
          value: String(value.toFixed(2)),
        });
      }

      const calculateBlendedMargin = () => {
        const activeMargins = [];

        Object.entries(doorPrice.breakdown).forEach(([key, price]) => {
          if (price > 0 && marginConfig[key] !== undefined) {
            activeMargins.push(marginConfig[key]);
          }
        });

        if (activeMargins.length === 0) {
          return marginConfig.door || 30;
        }

        const totalMargin = activeMargins.reduce((sum, margin) => sum + margin, 0);
        return Math.round((totalMargin * 100) / activeMargins.length) / 100;
      };

      const blendedMargin = calculateBlendedMargin();

      baseCustomAttributes.push(
        {
          key: `_shippingPerUnit`,
          value: String(shippingPerUnit),
        },
        {
          key: `_margin`,
          value: String(blendedMargin),
        }
      );

      if (itemPhotos.length > 0) {
        try {
          const uploadedUrls = await uploadItemPhotos(itemPhotos);
          uploadedUrls.forEach((url, photoIndex) => {
            baseCustomAttributes.push({
              key: `photo_${photoIndex + 1}`,
              value: url,
            });
          });
        } catch (error) {
          console.error(`Error uploading photos for item ${index}:`, error);
        }
      }

      if (requiresFrameProduct(doorConfig)) {
        try {
          const doorLineItem = createDoorLineItem(
            item,
            doorPrice,
            quantity,
            shippingPerUnit,
            doorProduct,
            baseCustomAttributes
          );

          const frameLineItem = createFrameLineItem(
            item,
            doorPrice,
            quantity,
            shippingPerUnit,
            frameOptions
          );

          return [doorLineItem, frameLineItem];
        } catch (error) {
          console.error(`Error creating frame product for item ${index}:`, error);
          console.log("Falling back to combined door+frame product");
          
          const combinedLineItem = createCombinedLineItem(
            item,
            doorPrice,
            quantity,
            shippingPerUnit,
            doorProduct,
            baseCustomAttributes
          );
          return [combinedLineItem];
        }
      } else {
        const doorLineItem = createDoorOnlyLineItem(
          item,
          doorPrice,
          quantity,
          shippingPerUnit,
          doorProduct,
          baseCustomAttributes
        );
        return [doorLineItem];
      }
    })
  );

  return processedItems.filter(item => item !== null).flat();
};

/**
 * Create door-only line item (no frame required)
 */
function createDoorOnlyLineItem(
  doorItem,
  doorPrice,
  quantity,
  shippingPerUnit,
  doorProduct,
  customAttributes
) {
  const { doorConfig } = doorItem;
  
  // For door-only items, shipping weightage is 1
  const doorWeightage = 1;
  const doorShippingCost = shippingPerUnit * doorWeightage * quantity;
  const totalPriceWithShipping = doorPrice.totalPrice + doorShippingCost;

  // Add door config attributes
  const doorConfigAttributes = [];
  const keysToExclude = [
    "currentSubStepIndex",
    "skippedSteps",
    "photoUploads",
  ];

  Object.entries(doorConfig).forEach(([key, value]) => {
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
    customAttributes: [...customAttributes, ...doorConfigAttributes],
    priceOverride: {
      amount: totalPriceWithShipping.toFixed(2),
      currencyCode: "USD",
    },
  };
}

/**
 * Create combined door+frame line item (fallback for when frame product unavailable)
 */
function createCombinedLineItem(
  doorItem,
  doorPrice,
  quantity,
  shippingPerUnit,
  doorProduct,
  customAttributes
) {
  const { doorConfig } = doorItem;
  
  // For combined items with frame, shipping weightage is 2
  const itemWeightage = doorConfig.frameType !== "none" ? 2 : 1;
  const shippingCost = shippingPerUnit * itemWeightage * quantity;
  const totalPriceWithShipping = doorPrice.totalPrice + shippingCost;

  // Add all door config attributes (including frame attributes)
  const doorConfigAttributes = [];
  const keysToExclude = [
    "currentSubStepIndex",
    "skippedSteps",
    "photoUploads",
  ];

  Object.entries(doorConfig).forEach(([key, value]) => {
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
    customAttributes: [...customAttributes, ...doorConfigAttributes],
    priceOverride: {
      amount: totalPriceWithShipping.toFixed(2),
      currencyCode: "USD",
    },
  };
}

/**
 * Upload item photos and return URLs
 */
async function uploadItemPhotos(itemPhotos) {
  if (!itemPhotos || itemPhotos.length === 0) {
    return [];
  }

  const uploadedPhotoUrls = await Promise.all(
    itemPhotos.map(async (photo, photoIndex) => {
      try {
        const fileExtension = photo.originalname.split(".").pop();
        const cleanFileName = `item-${Date.now()}-${uuidv4()}.${fileExtension}`;

        const uploadedFileId = await uploadFile(
          photo.buffer,
          cleanFileName,
          "IMAGE",
          photo.mimetype
        );

        const photoUrl = await waitForUrl(uploadedFileId);
        return photoUrl;
      } catch (error) {
        console.error(
          `Error uploading photo ${photoIndex}:`,
          error
        );
        return null;
      }
    })
  );

  // Filter out any failed uploads
  return uploadedPhotoUrls.filter((url) => url !== null);
}
