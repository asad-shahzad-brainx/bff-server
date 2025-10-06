import client from "./shopifyAdmin.js";
import operation from "../operations/draftOrderStatus.js";

const waitForDraftOrder = async (draftOrderId, maxRetries = 5) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    const { data } = await client.request(operation, {
      variables: { id: draftOrderId },
    });

    if (data?.draftOrder?.ready === true) {
      return data.draftOrder;
    }

    attempts++;

    if (attempts < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Draft order ${draftOrderId} did not become ready after ${maxRetries} attempts`
  );
};

export default waitForDraftOrder;

