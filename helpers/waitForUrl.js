import client from "./shopifyAdmin.js";
import operation from "../operations/node.js";

const waitForUrl = async (fileId, maxRetries = 5) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    const { data } = await client.request(operation, {
      variables: { id: fileId },
    });

    if (data?.node?.fileStatus === "READY") {
      return data.node.url;
    }

    if (data?.node?.image?.url) {
      return data.node.image.url;
    }

    attempts++;

    if (attempts < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `File ${fileId} did not become ready after ${maxRetries} attempts`
  );
};

export default waitForUrl;
