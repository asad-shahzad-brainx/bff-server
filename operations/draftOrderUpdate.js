const operation = `
  mutation DraftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder {
        id
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default operation;
