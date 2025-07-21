import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesPath = path.join(__dirname, "..", "templates");

// keys like oak brown should be oak brown
function formatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/-/g, " ");
}

// create a closure based counter
function createCounter() {
  let count = 0;
  return () => {
    count++;
    return count;
  };
}

function getCustomAttribute(customAttributes, key) {
  return customAttributes.find((attr) => attr.key === key);
}

function getWarrantyLineItem(lineItems) {
  return lineItems.find((lineItem) => lineItem.title === "Lifetime Warranty");
}

function getOrderTotal(lineItems) {
  return lineItems.reduce((acc, lineItem) => {
    if (lineItem.title === "Lifetime Warranty") {
      return acc + Number(lineItem.originalUnitPriceWithCurrency.amount);
    }
    return acc + Number(lineItem.priceOverride.amount);
  }, 0);
}

const renderTemplate = async (templateName, data = {}) => {
  try {
    const counter = createCounter();
    const templatePath = path.join(templatesPath, `${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, {
      ...data,
      formatKey,
      counter,
      getCustomAttribute,
      getWarrantyLineItem,
      getOrderTotal,
    });
    return html;
  } catch (error) {
    throw new Error(
      `Failed to render template ${templateName}: ${error.message}`
    );
  }
};

export default renderTemplate;
