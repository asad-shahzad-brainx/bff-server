import { getAllPricingMetaobjects } from "../operations/pricingMetaobjects.js";

const defaultMargin = {
  door: 30,
  frame: 30,
  jambGuard: 30,
  protectionPlate: 30,
  bumper: 30,
  aluminumStrip: 30,
};

const applyMargin = (cost, marginPercentage) => {
  return cost / (1 - marginPercentage / 100);
};

/**
 * Calculate door pricing with detailed breakdown
 * @param {Object} doorModel - Door model object with pricing information
 * @param {Object} doorConfig - Door configuration object
 * @param {number} quantity - Quantity of doors (default: 1)
 * @returns {Object} Detailed pricing breakdown with total
 *
 * Example usage:
 * const result = await calculateDoorPrice(doorModel, doorConfig, 2);
 * console.log(result.totalPrice); // Total price for 2 doors
 * console.log(result.breakdown.door); // Door price per unit
 */
const calculateDoorPrice = async (
  doorModel,
  doorConfig,
  quantity = 1,
  marginConfig = defaultMargin
) => {
  if (!doorModel || !doorConfig) {
    throw new Error("Door model and door configuration are required");
  }

  // Get pricing data from metaobjects
  const pricingData = await getAllPricingMetaobjects();

  // Calculate door area in square feet
  const calculateDoorArea = (width, height) => {
    return (width * height) / 144; // Convert from square inches to square feet
  };

  // Calculate door price based on model, configuration, and dimensions
  const calculateDoorPriceInternal = (doorModel, doorConfig) => {
    if (!doorModel || !doorConfig || !doorModel.pricing) return 0;

    const config = doorConfig.doorTypeSelection || "single";

    // Get dimensions - always use finished opening dimensions
    const width = parseFloat(doorConfig.finishedOpeningWidth);
    const height = parseFloat(doorConfig.finishedOpeningHeight);

    if (isNaN(width) || isNaN(height)) return 0;

    // Calculate door area
    const area = calculateDoorArea(width, height);

    // Determine price rate based on area and configuration
    let rate = 0;
    const modelRates = doorModel.pricing;

    if (!modelRates) return 0;

    if (config === "single") {
      rate = area <= 30 ? modelRates.single.upTo30 : modelRates.single.over30;
    } else {
      rate = modelRates.pair.over30;
    }

    // Calculate base door price
    const basePrice = area * rate;

    return basePrice;
  };

  // Calculate frame price
  const calculateFramePrice = (doorConfig) => {
    if (!doorConfig || doorConfig.frameType === "none") return 0;

    // Get dimensions
    const width = parseFloat(doorConfig.roughOpeningWidth);
    const height = parseFloat(doorConfig.roughOpeningHeight);

    if (isNaN(width) || isNaN(height)) return 0;

    // Frame area calculation (approximate based on perimeter)
    // Assuming standard frame depth
    const frameArea = (width + height * 2) / 12; // Convert to linear feet

    // Determine rate based on height
    let rate;
    if (height <= 84) {
      rate = parseFloat(pricingData.frame.standard);
    } else if (height <= 96) {
      rate = parseFloat(pricingData.frame.tall);
    } else {
      rate = parseFloat(pricingData.frame.extraTall);
    }

    return frameArea * rate;
  };

  // Calculate jamb guard price
  const calculateJambGuardPrice = (doorConfig) => {
    if (!doorConfig.jamGuardIncluded) return 0;

    const size = doorConfig.jamGuardType;
    const material = doorConfig.jamGuardFinish;

    return parseFloat(pricingData.jambGuard[size][material] || 0);
  };

  // Find closest standard size for protection plates/bumpers
  const findClosestSize = (width, height) => {
    // Standard widths and heights available
    const standardWidths = [36, 48];
    const standardHeights = [12, 24, 36];

    // Find closest standard width
    const closestWidth = standardWidths.reduce((prev, curr) => {
      return Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev;
    });

    // Find closest standard height for kick plate or bumper
    const closestHeight = standardHeights.reduce((prev, curr) => {
      return Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev;
    });

    return { width: closestWidth, height: closestHeight };
  };

  // Calculate protection plate price
  const calculateProtectionPlatePrice = (doorConfig) => {
    if (!doorConfig.protectionType || doorConfig.protectionType !== "kickplate")
      return 0;

    // Get width based on opening type
    // let width;
    // if (doorConfig.openingType === "finished") {
    //   width = parseFloat(doorConfig.finishedOpeningWidth);
    // } else {
    //   width = parseFloat(doorConfig.roughOpeningWidth);
    // }

    const width = parseFloat(doorConfig.finishedOpeningWidth);

    const height = parseFloat(doorConfig.kickplateHeight || 0);
    const config =
      doorConfig.doorTypeSelection === "single" ? "single" : "pair";
    const material = doorConfig.kickplateMaterial;

    if (isNaN(width) || isNaN(height) || height <= 0) return 0;

    // Find closest standard size
    const { width: closestWidth, height: closestHeight } = findClosestSize(
      width,
      height
    );

    // Create lookup key
    const key = `${closestWidth}_${closestHeight}_${config}`;

    const pricing = pricingData.protectionPlate[key];
    return pricing ? parseFloat(pricing[material] || 0) : 0;
  };

  // Calculate bumper price
  const calculateBumperPrice = (doorConfig) => {
    if (!doorConfig.protectionType || doorConfig.protectionType !== "bumper")
      return 0;

    // Get width based on opening type
    let width;
    if (doorConfig.openingType === "finished") {
      width = parseFloat(doorConfig.finishedOpeningWidth);
    } else {
      width = parseFloat(doorConfig.roughOpeningWidth);
    }

    const height = parseFloat(doorConfig.bumperHeight || 0);
    const config = doorConfig.doorTypeSelection;

    if (isNaN(width) || isNaN(height) || height <= 0) return 0;

    // Find closest standard size
    const { width: closestWidth } = findClosestSize(width, height);

    // Create lookup key
    const key = `${closestWidth}_${height}`;

    // Calculate base bumper price
    const material = doorConfig.bumperMaterial;
    const baseBumperPrice = parseFloat(pricingData.bumper[key][material] || 0);

    // Multiply by 2 for single door (both sides), by 4 for pairs (both sides of both doors)
    const multiplier = config === "single" ? 2 : 4;

    // Calculate total
    let total = baseBumperPrice * multiplier;

    return total;
  };

  const calculateAluminumStripPrice = (doorConfig) => {
    if (!doorConfig.bumperType || doorConfig.bumperType !== "yes") return 0;

    const width = parseFloat(doorConfig.finishedOpeningWidth) <= 36 ? 36 : 48;

    return parseFloat(pricingData.aluminumStrip[width] || 0);
  };

  // Calculate individual prices
  const doorPrice = calculateDoorPriceInternal(doorModel, doorConfig);
  const framePrice = calculateFramePrice(doorConfig);
  const jambGuardPrice = calculateJambGuardPrice(doorConfig);
  const protectionPrice = calculateProtectionPlatePrice(doorConfig);
  const bumperPrice = calculateBumperPrice(doorConfig);
  const aluminumStripPrice = calculateAluminumStripPrice(doorConfig);

  // Apply margins to each component
  const doorPriceWithMargin = applyMargin(doorPrice, marginConfig.door);
  const framePriceWithMargin = applyMargin(framePrice, marginConfig.frame);
  const jambGuardPriceWithMargin = applyMargin(
    jambGuardPrice,
    marginConfig.jambGuard
  );
  const protectionPriceWithMargin = applyMargin(
    protectionPrice,
    marginConfig.protectionPlate
  );
  const bumperPriceWithMargin = applyMargin(bumperPrice, marginConfig.bumper);
  const aluminumStripPriceWithMargin = applyMargin(
    aluminumStripPrice,
    marginConfig.aluminumStrip
  );

  // Calculate total for single unit
  const unitTotal =
    doorPriceWithMargin +
    framePriceWithMargin +
    jambGuardPriceWithMargin +
    protectionPriceWithMargin +
    bumperPriceWithMargin +
    aluminumStripPriceWithMargin;

  // Multiply by quantity
  const totalPrice = unitTotal * quantity;

  // Return detailed breakdown
  return {
    breakdown: {
      door: doorPriceWithMargin,
      frame: framePriceWithMargin,
      jambGuard: jambGuardPriceWithMargin,
      protectionPlate: protectionPriceWithMargin,
      bumper: bumperPriceWithMargin,
      aluminumStrip: aluminumStripPriceWithMargin,
      unitTotal: unitTotal,
    },
    quantity: quantity,
    totalPrice: totalPrice,
  };
};

/**
 * Calculate door pricing - simple version that returns just the total price
 * @param {Object} doorModel - Door model object with pricing information
 * @param {Object} doorConfig - Door configuration object
 * @param {number} quantity - Quantity of doors (default: 1)
 * @returns {number} Total price for the specified quantity
 *
 * Example usage:
 * const totalPrice = await calculateDoorPriceSimple(doorModel, doorConfig, 3);
 * console.log(`Total: $${totalPrice.toFixed(2)}`);
 */
const calculateDoorPriceSimple = async (
  doorModel,
  doorConfig,
  quantity = 1
) => {
  const result = await calculateDoorPrice(doorModel, doorConfig, quantity);
  return result.totalPrice;
};

export { calculateDoorPrice, calculateDoorPriceSimple };
export default calculateDoorPrice;
