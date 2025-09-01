import client from "../helpers/shopifyAdmin.js";

const operation = `
  query GetTeamEmails($first: Int!) {
    team: metaobjects(type: "team", first: $first) {
      nodes {
        id
        handle
        fields {
          key
          value
        }
      }
    }
  }
`;

const getTeamEmails = async () => {
  try {
    const { data, errors } = await client.request(operation, {
      variables: { first: 1 },
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    return data?.team?.nodes?.[0] || null;
  } catch (error) {
    console.error("Error fetching first team entry:", error);
    throw error;
  }
};

export { getTeamEmails };
export default operation;
