import getDraftOrderById from "../helpers/getDraftOrderById.js";
import getMetafieldValue from "../helpers/getMetafieldValue.js";

const checkoutController = async (req, res) => {
  try {
    const draftOrderId = req.query.id;
    const includeInvoiceUrl = true;
    const draftOrder = await getDraftOrderById(draftOrderId, includeInvoiceUrl);

    const metafields = draftOrder.metafields.nodes;

    // const isExpired = getMetafieldValue(metafields, "custom.is_expired");

    // if (!Boolean(isExpired)) {
    //   return res.status(200).json({
    //     status: "success",
    //     message: "Quote has expired",
    //   });
    // }

    const customerSignOff = getMetafieldValue(
      metafields,
      "custom.customer_sign_off"
    );

    if (customerSignOff !== "true") {
      return res.status(200).json({
        status: "success",
        url: `/pages/customer-sign-off?id=${draftOrderId}`,
      });
    }

    const { invoiceUrl } = draftOrder;

    res.status(200).json({
      status: "success",
      url: invoiceUrl,
    });
  } catch (error) {
    console.error("Error fetching draft order:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch draft order",
      error: error.message,
    });
  }
};

export default checkoutController;
