import client from "../helpers/shopifyAdmin.js";

const operation = `
  query getPageByHandle($query: String!, $first: Int, $namespace: String!, $key: String!, $includeMetafield: Boolean = false) {
    pages(first: $first, query: $query) {
      nodes {
        id
        handle
        title
        body
        isPublished
        publishedAt
        createdAt
        updatedAt
        metafield(namespace: $namespace, key: $key) @include(if: $includeMetafield) {
          value
          references(first: 250) {
            nodes {
              ... on Customer {
                email
              }
            }
          }
        }
      }
    }
  }
`;

const pageByHandle = async (handle, options = {}) => {
  const { namespace, key } = options;
  const includeMetafield = Boolean(namespace && key);

  if (includeMetafield) {
    const { data, errors } = await client.request(operation, {
      variables: {
        query: `handle:${handle}`,
        first: 1,
        namespace,
        key,
        includeMetafield,
      },
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    return data?.pages?.nodes?.[0] || null;
  } else {
    // Use a simpler query without metafield when not needed
    const simpleOperation = `
      query getPageByHandle($query: String!, $first: Int) {
        pages(first: $first, query: $query) {
          nodes {
            id
            handle
            title
            body
            isPublished
            publishedAt
            createdAt
            updatedAt
          }
        }
      }
    `;

    const { data, errors } = await client.request(simpleOperation, {
      variables: {
        query: `handle:${handle}`,
        first: 1,
      },
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    return data?.pages?.nodes?.[0] || null;
  }
};

export default pageByHandle;
