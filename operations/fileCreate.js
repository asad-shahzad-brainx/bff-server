const operation = `
  mutation ($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
    }
    userErrors {
        code
        field
        message
      }
    }
  }
`;

export default operation;
