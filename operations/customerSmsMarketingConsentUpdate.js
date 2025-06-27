const customerSmsMarketingConsentUpdate = `
  mutation customerSmsMarketingConsentUpdate($input: CustomerSmsMarketingConsentUpdateInput!) {
    customerSmsMarketingConsentUpdate(input: $input) {
      customer {
        id
        smsMarketingConsent {
          marketingState
          marketingOptInLevel
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default customerSmsMarketingConsentUpdate;
