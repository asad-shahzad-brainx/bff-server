import getDraftOrderById from "../helpers/getDraftOrderById.js";
import filterDraftOrderCustomAttributes from "../helpers/filterDraftOrderCustomAttributes.js";

const getDraftOrderController = async (req, res) => {
  try {
    const draftOrderId = req.params.id;
    const draftOrder = await getDraftOrderById(draftOrderId);
    const filteredDraftOrder = filterDraftOrderCustomAttributes(draftOrder);

    res.status(200).json({
      status: "success",
      data: filteredDraftOrder,
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

export default getDraftOrderController;
