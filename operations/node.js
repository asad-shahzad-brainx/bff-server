const operation = `
  query node($id: ID!) {
    node(id: $id) {
      ... on MediaImage {
        image {
          url
        }
      }
      ... on GenericFile {
        fileStatus
        url
      }
    }
  }
`;

export default operation;
