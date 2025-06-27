// Generate a Shopify GID
export default function generateShopifyGid(entityType, value) {
  return `gid://shopify/${entityType}/${value}`;
}
