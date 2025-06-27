const operation = `
  mutation DraftOrderInvoiceSend($id: ID!) {
    draftOrderInvoiceSend(id: $id) {
      draftOrder {
        id
        invoiceSentAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default operation;
