const operation = `
  query GetOrderByName($query: String!) {
    orders(first: 1, query: $query) {
      edges {
        node {
          name
          email
          phone
          customer {
            id
            firstName
            lastName
            email
            phone
            displayName
          }
          shippingAddress {
            firstName
            lastName
            company
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          billingAddress {
            firstName
            lastName
            company
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                name
                title
                quantity
                variant {
                  id
                  title
                  sku
                }
                product {
                  id
                  title
                  handle
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default operation;
