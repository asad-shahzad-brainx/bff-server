import getDraftOrderById from "../helpers/getDraftOrderById.js";

const getDraftOrderController = async (req, res) => {
  try {
    const draftOrderId = req.params.id;
    const draftOrder = await getDraftOrderById(draftOrderId);

    res.status(200).json({
      status: "success",
      data: draftOrder,
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
