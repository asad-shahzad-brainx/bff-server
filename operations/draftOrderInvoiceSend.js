const operation = `
  mutation DraftOrderInvoiceSend($id: ID!, $subject: String!, $bcc: [String!]) {
    draftOrderInvoiceSend(id: $id, email: {subject: $subject, bcc: $bcc}) {
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
