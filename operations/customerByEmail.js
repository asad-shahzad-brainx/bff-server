const operation = `
  query GetCustomerByEmail($email: String!) {
    customerByIdentifier(identifier: { emailAddress: $email }) {
      id
      defaultPhoneNumber {
        marketingState
      }
    }
  }
`;

export default operation;
