const operation = `
  query GetDraftOrdersByCustomerId($first: Int, $after: String, $query: String) {
    draftOrders(query: $query, first: $first, after: $after, sortKey: ID, reverse: true) {
      edges {
        cursor
        node {
          id
          name
          createdAt
          invoiceUrl
          totalLineItemsPriceSet {
            shopMoney {
              amount
              currencyCode
            }
            presentmentMoney {
              amount
              currencyCode
            }
          }
          tags
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export default operation;
