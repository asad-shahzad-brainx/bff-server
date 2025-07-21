import client from "../helpers/shopifyAdmin.js";
import customerByEmail from "../operations/customerByEmail.js";
import customerCreate from "../operations/customerCreate.js";
import customerGenerateAccountActivationUrl from "../operations/customerGenerateAccountActivationUrl.js";
import customerSmsMarketingConsentUpdate from "../operations/customerSmsMarketingConsentUpdate.js";

// check if customer exists
const createOrUpdateCustomer = async (contactInformation) => {
  let customer;

  const { email, firstName, lastName, phone, smsConsent } = contactInformation;

  const {
    data: { customerByIdentifier },
  } = await client.request(customerByEmail, {
    variables: {
      email,
    },
  });

  if (customerByIdentifier === null) {
    const { data, errors } = await client.request(customerCreate, {
      variables: {
        input: {
          email,
          firstName,
          lastName,
          phone,
          smsMarketingConsent: smsConsent
            ? {
                marketingState: "SUBSCRIBED",
                marketingOptInLevel: "SINGLE_OPT_IN",
              }
            : null,
        },
      },
    });

    customer = data?.customerCreate?.customer;
    console.log("error", errors);

    if (customer?.id) {
      const { data } = await client.request(
        customerGenerateAccountActivationUrl,
        {
          variables: {
            customerId: customer.id,
          },
        }
      );

      return data?.customerGenerateAccountActivationUrl?.accountActivationUrl;
    }
  } else if (
    customerByIdentifier.defaultPhoneNumber &&
    customerByIdentifier.defaultPhoneNumber?.marketingState !== "SUBSCRIBED" &&
    smsConsent
  ) {
    const { data } = await client.request(customerSmsMarketingConsentUpdate, {
      variables: {
        input: {
          customerId: customerByIdentifier.id,
          smsMarketingConsent: {
            marketingState: "SUBSCRIBED",
            marketingOptInLevel: "SINGLE_OPT_IN",
          },
        },
      },
    });

    console.error(data, data.customerSmsMarketingConsentUpdate.userErrors);
  } else {
    return;
  }

  return customerByIdentifier;
};

export default createOrUpdateCustomer;
