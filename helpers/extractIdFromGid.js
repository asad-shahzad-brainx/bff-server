// Extract the ID from a Shopify GID
const extractIdFromGid = (gid) => {
  return gid.split("/").pop();
};

export default extractIdFromGid;
