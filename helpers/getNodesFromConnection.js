// Get nodes from a Shopify connection
export default function getNodesFromConnections(connections) {
  if (!connections) return [];
  return connections.edges.map(({ node }) => node);
}
