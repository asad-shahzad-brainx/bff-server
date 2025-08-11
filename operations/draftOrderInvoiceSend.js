const operation = `
  mutation DraftOrderInvoiceSend($id: ID!, $subject: String!) {
    draftOrderInvoiceSend(id: $id, email: {subject: $subject}) {
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
