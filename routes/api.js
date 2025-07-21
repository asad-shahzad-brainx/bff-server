import express from "express";
import createDraftOrder from "../controllers/createDraftOrder.js";
import getCustomerQuotes from "../helpers/getCustomerQuotes.js";
import getDraftOrderController from "../controllers/getDraftOrderController.js";
import checkoutController from "../controllers/checkoutController.js";
import customerSignOffController from "../controllers/customerSignOffController.js";
import getOrderController from "../controllers/getOrderController.js";
import getPublishedDoorMetaobjects from "../helpers/getPublishedDoorMetaobjects.js";
import { checkTeamMembership } from "../helpers/checkTeamMembership.js";
import { getAllPricingMetaobjects } from "../operations/pricingMetaobjects.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is working" });
});

router.get("/quotes/:customerId", getCustomerQuotes);

router.get("/quote/:id", getDraftOrderController);

router.get("/order/:name", getOrderController);

router.get("/checkout", checkoutController);

router.get("/signOff", customerSignOffController);

// TODO: Refactor - add controllers
// TODO: add auth check for pricing and doors endpoints
router.get("/pricing", async (req, res) => {
  const { token } = req?.body || {};
  const isTeamMember = await checkTeamMembership(token);
  if (!isTeamMember) {
    return res.status(401).json({});
  }

  const pricing = await getAllPricingMetaobjects();
  return res.status(200).json(pricing);
});

router.all("/doors", async (req, res) => {
  try {
    const { token } = req?.body || {};
    const isTeamMember = await checkTeamMembership(token);
    console.log("token", token);
    console.log("isTeamMember", isTeamMember);

    const limit = parseInt(req.query.limit) || 25;
    const doors = await getPublishedDoorMetaobjects(limit, isTeamMember);
    res.status(200).json(doors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/orders", createDraftOrder);

export default router;
