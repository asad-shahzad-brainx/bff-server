import client from "./shopifyAdmin.js";
import publishedDoorMetaobjects from "../operations/publishedDoorMetaobjects.js";
import transformDoorMetaobjects from "./transformDoorMetaobjects.js";

const getPublishedDoorMetaobjects = async (
  limit = 25,
  isTeamMember = false
) => {
  const { data, errors } = await client.request(publishedDoorMetaobjects, {
    variables: {
      first: limit,
    },
  });

  if (errors?.graphQLErrors?.length > 0) {
    throw new Error(errors.graphQLErrors[0].message);
  }

  const rawMetaobjects = data.metaobjects.nodes;
  // return rawMetaobjects;
  return transformDoorMetaobjects(rawMetaobjects, isTeamMember);
};

export default getPublishedDoorMetaobjects;
