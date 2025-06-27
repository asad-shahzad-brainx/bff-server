const operation = `
  mutation CustomerGenerateAccountActivationUrl($customerId: ID!) {
    customerGenerateAccountActivationUrl(customerId: $customerId) {
      accountActivationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

export default operation;
