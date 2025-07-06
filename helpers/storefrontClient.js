import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import dotenv from "dotenv";

dotenv.config();

const storefrontClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE,
  apiVersion: process.env.SHOPIFY_API_VERSION,
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_API_KEY,
});

export default storefrontClient;
