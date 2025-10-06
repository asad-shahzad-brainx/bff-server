const filterDraftOrderCustomAttributes = (draftOrder, excludeKeys = []) => {
  if (!draftOrder?.lineItems?.edges) {
    return draftOrder;
  }

  const defaultExcludeKeys = [
    '_door',
    '_jambGuard',
    '_protectionPlate',
    '_bumper',
    '_aluminumStrip',
    '_unitTotalWithoutMargins',
    '_margin'
  ];

  const keysToExclude = [...defaultExcludeKeys, ...excludeKeys];

  const filteredDraftOrder = {
    ...draftOrder,
    lineItems: {
      ...draftOrder.lineItems,
      edges: draftOrder.lineItems.edges.map(edge => ({
        ...edge,
        node: {
          ...edge.node,
          customAttributes: edge.node.customAttributes?.filter(
            attr => !keysToExclude.includes(attr.key)
          ) || []
        }
      }))
    }
  };

  return filteredDraftOrder;
};

export default filterDraftOrderCustomAttributes;
