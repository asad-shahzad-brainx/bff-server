import getOrderByName from "../helpers/getOrderByName.js";

const getOrderController = async (req, res) => {
  try {
    const orderName = req.params.name;

    if (!orderName) {
      return res.status(400).json({
        status: "error",
        message: "Order name is required",
      });
    }

    const order = await getOrderByName(orderName);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

export default getOrderController;
