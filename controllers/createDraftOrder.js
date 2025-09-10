import client from "../helpers/shopifyAdmin.js";
import draftOrderCreate from "../operations/draftOrderCreate.js";
import generateDraftOrderInput from "../helpers/draftOrderHelper.js";
import createOrUpdateCustomer from "../helpers/createOrUpdateCustomer.js";
import renderTemplate from "../helpers/ejsService.js";
import generatePdfFromHtml from "../helpers/pdfService.js";
import uploadFile from "../helpers/uploadFileToAdmin.js";
import waitForUrl from "../helpers/waitForUrl.js";
import draftOrderUpdate from "../operations/draftOrderUpdate.js";
import { encryptToken } from "../helpers/token.js";
import extractIdFromGid from "../helpers/extractIdFromGid.js";
import sendDraftOrderInvoice from "../helpers/sendDraftOrderInvoice.js";
import getPageContent from "../helpers/getPageContent.js";
import { v4 as uuidv4 } from "uuid";
import { sendQuoteToManufacturer } from "../helpers/resendClient.js";

const createDraftOrder = async (req, res) => {
  try {
    const { contactInformation, smsConsent } = req.body;
    const accountActivationUrl = await createOrUpdateCustomer(
      contactInformation,
      smsConsent
    );

    const parsedBody = {
      ...req.body,
      cart: req.body.cart.map((item) => ({
        ...item,
        doorConfig: JSON.parse(item.doorConfig),
      })),
    };

    const input = await generateDraftOrderInput(parsedBody, req.files);
    // return res.status(201).json({
    //   status: "success",
    //   message: "Draft order created successfully",
    //   input,
    // });

    const { data, errors } = await client.request(draftOrderCreate, {
      variables: {
        input,
      },
    });

    if (data?.draftOrderCreate?.userErrors?.length > 0) {
      return res.status(400).json({
        status: "error",
        errors: data.draftOrderCreate.userErrors
          .map((error) => error.message)
          .join(", "),
        message: "Failed to create draft order",
      });
    }

    res.status(201).json({
      status: "success",
      message: "Draft order created successfully",
    });

    const draftOrderId = data.draftOrderCreate.draftOrder.id;
    const draftOrderNumber = data.draftOrderCreate.draftOrder.name;

    const pageContent = await getPageContent("quote");
    const html = await renderTemplate("main", {
      input: parsedBody,
      lineItems: input.lineItems,
      terms: {
        title: pageContent.title,
        body: pageContent.body,
      },
      isManufacturerQuote: false,
    });

    const quotePdf = await generatePdfFromHtml(html);
    // replace uuid with draft order id
    const uploadedFileId = await uploadFile(
      quotePdf,
      // replace # with empty string in draft order number
      `quote-${draftOrderNumber.replace("#", "")}-${uuidv4()}.pdf`
    );

    const fileUrl = await waitForUrl(uploadedFileId);
    const customerSignOffUrl = `https://buildingsupplybff.com/pages/quote?id=${encryptToken(extractIdFromGid(draftOrderId))}`;

    const { data: draftOrderUpdateData } = await client.request(
      draftOrderUpdate,
      {
        variables: {
          id: draftOrderId,
          input: {
            note: `|quote|${fileUrl}|endquote||invoice|${customerSignOffUrl}|endinvoice|`,
          },
        },
      }
    );

    if (draftOrderUpdateData?.draftOrderUpdate?.draftOrder?.id) {
      const subject = `Hi ${contactInformation.firstName}! Here is your traffic door quote from Building Supply BFF.`;
      await sendDraftOrderInvoice(
        draftOrderUpdateData.draftOrderUpdate.draftOrder.id,
        subject
      );
    }

    const manufacturerHtml = await renderTemplate("main", {
      input: parsedBody,
      lineItems: input.lineItems,
      terms: {
        title: pageContent.title,
        body: pageContent.body,
      },
      isManufacturerQuote: true,
    });
    const manufacturerPdf = await generatePdfFromHtml(manufacturerHtml);
    await sendQuoteToManufacturer(manufacturerPdf, draftOrderNumber);
  } catch (error) {
    console.error("Error creating draft order:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while creating draft order",
      error: error.message,
    });
  }
};

export default createDraftOrder;
