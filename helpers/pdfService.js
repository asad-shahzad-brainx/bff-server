import puppeteer from "puppeteer";

const generatePdfFromHtml = async (html, options = {}) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    await page.emulateMediaType("screen");

    const defaultOptions = {
      format: "A3",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    };

    const pdfOptions = { ...defaultOptions, ...options };

    const pdf = await page.pdf(pdfOptions);

    return pdf;
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default generatePdfFromHtml;
