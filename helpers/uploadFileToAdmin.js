import FormData from "form-data";
import axios from "axios";

import client from "../helpers/shopifyAdmin.js";
import stagedUploadsCreateMutation from "../operations/stagedUploadCreate.js";
import fileCreateMutation from "../operations/fileCreate.js";

const uploadFile = async (
  file,
  fileName,
  resource = "FILE",
  mimeType = null
) => {
  // If mimeType is not provided, use resource as fallback (for backward compatibility)
  const actualMimeType = mimeType || resource;

  const stagedResponse = await client.request(stagedUploadsCreateMutation, {
    variables: {
      input: [
        {
          filename: fileName,
          mimeType: actualMimeType,
          resource: resource,
          httpMethod: "POST",
        },
      ],
    },
  });

  const { data } = stagedResponse;
  const target = data.stagedUploadsCreate.stagedTargets[0];
  const { url, resourceUrl, parameters } = target;

  const form = new FormData();
  parameters.forEach(({ name, value }) => {
    form.append(name, value);
  });
  const buffer = Buffer.from(file);
  form.append("file", buffer);

  try {
    await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
      },
    });
  } catch (error) {
    console.error("Error during file upload:", error.message);
    throw error;
  }

  const variables = {
    files: {
      originalSource: resourceUrl,
      contentType: resource,
      filename: fileName,
    },
  };

  const fileResponse = await client.request(fileCreateMutation, { variables });

  const fileIdResult = fileResponse.data.fileCreate.files[0].id;

  return fileIdResult;
};

export default uploadFile;
