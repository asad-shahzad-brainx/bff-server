const operation = `
  query GetPublishedDoorMetaobjects($first: Int!) {
    metaobjects(type: "door", first: $first, query: "status:published") {
      nodes {
        id
        handle
        fields {
          key
          value
          reference {
            ... on Product {
              id
              handle
              title
            }
            ... on Metaobject {
              id
              fields {
                key
                value
              }
            }
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
          references(first: 50) {
            nodes {
              ... on MediaImage @include(if: true) {
                id
                image {
                  url
                }
              }
              ... on Metaobject {
                id
                fields {
                  key
                  value
                  reference {
                    ... on MediaImage {
                      id
                      image {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default operation;
