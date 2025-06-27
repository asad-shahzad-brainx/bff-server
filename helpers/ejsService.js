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

const renderTemplate = async (templateName, data = {}) => {
  try {
    const templatePath = path.join(templatesPath, `${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, {
      ...data,
      formatKey,
    });
    return html;
  } catch (error) {
    throw new Error(
      `Failed to render template ${templateName}: ${error.message}`
    );
  }
};

export default renderTemplate;
