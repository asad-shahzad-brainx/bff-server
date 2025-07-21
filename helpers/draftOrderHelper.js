import productByIdentifier from "../operations/productByIdentifier.js";
import { calculateDoorPrice } from "./calculateDoorPrice.js";
import getWarrantyConfig from "../operations/getWarrantyConfig.js";
import getPublishedDoorMetaobjects from "../helpers/getPublishedDoorMetaobjects.js";
import uploadFile from "./uploadFileToAdmin.js";
import waitForUrl from "./waitForUrl.js";
import { v4 as uuidv4 } from "uuid";

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

const calculateShippingPerUnit = (cartItems) => {
  const totalUnits = cartItems.reduce((acc, item) => {
    const weightage = getItemWeightage(item.doorConfig);
    return acc + weightage * item.quantity;
  }, 0);

  const totalShippingCost = totalUnits > 1 ? 600 : 400;
  return Math.round(totalShippingCost / totalUnits);
};

const generateDraftOrderInput = async (requestBody, files = []) => {
  const doorModelArray = await getPublishedDoorMetaobjects(50, true);
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

  const shippingPerUnit = calculateShippingPerUnit(cartItems);
  const warrantyConfig = await getWarrantyConfig();

  const lineItems = await Promise.all(
    cartItems.map(async (item, index) => {
      const { doorConfig, handle, quantity, margins } = item;
      if (!doorConfig) {
        return;
      }

      const marginConfig = margins && JSON.parse(margins);

      const itemPhotos = files.filter((file) =>
        file.fieldname.includes(`photos[${index}]`)
      );

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

      // Upload photos to Shopify and get URLs
      if (itemPhotos && itemPhotos.length > 0) {
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
                `Error uploading photo for item ${index}, photo ${photoIndex}:`,
                error
              );
              return null;
            }
          })
        );

        // Filter out any failed uploads and add to custom attributes
        const validPhotoUrls = uploadedPhotoUrls.filter((url) => url !== null);
        if (validPhotoUrls.length > 0) {
          // Also add individual photo URLs for easier access
          validPhotoUrls.forEach((url, photoIndex) => {
            customAttributes.push({
              key: `photo_${photoIndex + 1}`,
              value: url,
            });
          });
        }
      }

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

  const input = {
    lineItems,
  };

  if (email) {
    input.email = email;
  }

  if (phone) {
    input.phone = phone;
  }

  input.tags = ["Customer Flow"];

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

  return input;
};

export default generateDraftOrderInput;
