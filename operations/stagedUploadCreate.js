const operation = `
  mutation ($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        resourceUrl
      url
      parameters {
        name
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default operation;
