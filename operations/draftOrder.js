const operation = `
  query GetDraftOrderById($id: ID!) {
    draftOrder(id: $id) {
      id
      name
      status
      createdAt
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      customer {
        id
        email
        firstName
        lastName
      }
      lineItems(first: 20) {
        edges {
          node {
            id
            title
            quantity
            originalUnitPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            discountedTotalSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            variant {
              id
              sku
              title
            }
          }
        }
      }
      shippingAddress {
        address1
        address2
        city
        province
        country
        zip
        phone
      }
      billingAddress {
        address1
        address2
        city
        province
        country
        zip
        phone
      }
      tags
      note
      appliedDiscount {
        title
        value
        valueType
      }
      invoiceUrl
      ready
    }
  }
`;

export default operation;
