import pageByHandle from "../operations/pageByHandle.js";

const getPageContent = async (handle) => {
  try {
    const page = await pageByHandle(handle);

    if (!page) {
      return null;
    }

    return {
      title: page.title,
      handle: page.handle,
      body: page.body,
    };
  } catch (error) {
    console.error(`Error fetching page content for handle "${handle}":`, error);
    throw error;
  }
};

export const getPageMetafield = async (handle, namespace, key) => {
  try {
    const page = await pageByHandle(handle, { namespace, key });
    if (!page) {
      return null;
    }
    return page.metafield;
  } catch (error) {
    console.error(
      `Error fetching page metafield for handle "${handle}":`,
      error
    );
    throw error;
  }
};

export default getPageContent;
