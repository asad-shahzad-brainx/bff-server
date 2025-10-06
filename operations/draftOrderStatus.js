const operation = `
  query GetDraftOrderStatus($id: ID!) {
    draftOrder(id: $id) {
      id
      ready
    }
  }
`;

export default operation;

