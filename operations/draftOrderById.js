const operation = `
  query GetDraftOrderById($id: ID!, $keys: [String!]!, $includeInvoiceUrl: Boolean!) {
    draftOrder(id: $id) {
      name
      invoiceUrl @include(if: $includeInvoiceUrl)
      totalPriceSet {
        presentmentMoney {
          amount
          currencyCode
        }
      }
      shippingAddress {
        address1
        city
        country
        province
        zip
      }
      billingAddress {
        address1
        city
        country
        province
        zip
      }
      metafields(first: 250, keys: $keys) {
        nodes {
          key
          value
        }
      }
      lineItems(first: 50) {
        edges {
          node {
            name
            quantity
            customAttributes {
              key
              value
            }
            image {
              url
              altText
            }
            priceOverride {
              amount
              currencyCode
            }
            product {
              handle
            }
          }
        }
      }
      note2
    }
  }
`;

export default operation;
