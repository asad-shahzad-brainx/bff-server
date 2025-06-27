const getMetafieldValue = (metafields, key) => {
  const metafield = metafields.find((metafield) => metafield.key === key);
  return metafield ? metafield.value : undefined;
};

export default getMetafieldValue;
