import getWarrantyPrice from "../helpers/getWarrantyPrice.js";

const warrantyCalculationController = async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Bad request",
        message: "Cart is required and must be a non-empty array",
      });
    }

    const parsedBody = {
      cart: cart.map((item) => ({
        ...item,
        doorConfig:
          typeof item.doorConfig === "string"
            ? JSON.parse(item.doorConfig)
            : item.doorConfig,
      })),
      selectedUpsells: '{"id":"lifetime-warranty"}',
    };

    const warrantyAmount = await getWarrantyPrice(parsedBody);

    res.status(200).json({
      success: true,
      data: {
        warrantyAmount: parseFloat(warrantyAmount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error calculating warranty price:", error);

    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (
      error.message.includes("required") ||
      error.message.includes("must be") ||
      error.message.includes("not found")
    ) {
      statusCode = 400;
      errorMessage = "Bad request";
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      message: error.message,
    });
  }
};

export default warrantyCalculationController;
