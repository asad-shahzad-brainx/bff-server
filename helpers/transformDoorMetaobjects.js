import { randomUUID } from "crypto";

const handleize = (str) => {
  return str
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
};

const transformDoorMetaobjects = (metaobjects, isTeamMember) => {
  return metaobjects.map((metaobject) => {
    const fieldsMap = {};

    // Create a map of field keys to their values for easy access
    metaobject.fields.forEach((field) => {
      fieldsMap[field.key] = field;
    });

    // Helper function to convert snake_case to camelCase
    const toCamelCase = (str) => {
      return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    };

    // Helper function to parse JSON strings safely
    const parseJsonSafely = (value) => {
      if (
        typeof value === "string" &&
        (value.startsWith("[") || value.startsWith("{"))
      ) {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    };

    // Helper function to convert string booleans to actual booleans
    const convertToBoolean = (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    };

    // Start building the transformed object
    const transformed = {
      id: randomUUID(),
      name: fieldsMap.product?.reference?.title || "",
      handle: fieldsMap.product?.reference?.handle || "",
      image: fieldsMap.product_image?.reference?.image?.url || "",
      availableColors: [],
      dimensions: {
        single: {},
        double: {},
      },
      pricing: isTeamMember
        ? {
            single: {},
            pair: {},
          }
        : null,
    };

    // Extract available colors from color_swatches references
    if (fieldsMap.color_swatches?.references?.nodes) {
      transformed.availableColors = fieldsMap.color_swatches.references.nodes
        .map((node) => {
          // Create a map of fields for easy access
          const nodeFieldsMap = {};
          node.fields.forEach((field) => {
            nodeFieldsMap[field.key] = field;
          });

          // Extract label from appropriate field (could be 'name', 'title', 'label', etc.)
          const label = nodeFieldsMap.label?.value;

          // Extract swatch URL from reference
          let swatchUrl = "";

          // Look for swatch/image reference in fields
          Object.values(nodeFieldsMap).forEach((field) => {
            if (field.reference?.image?.url) {
              swatchUrl = field.reference.image.url;
            }
          });

          // Only return if we have both label and swatchUrl
          if (label && swatchUrl) {
            return {
              label,
              swatchUrl,
            };
          }

          return null;
        })
        .filter(Boolean);
    }

    // Extract pricing data from pricing reference
    if (fieldsMap.pricing?.reference?.fields && isTeamMember) {
      const pricingFieldsMap = {};
      fieldsMap.pricing.reference.fields.forEach((field) => {
        pricingFieldsMap[field.key] = field;
      });

      // Process single pricing
      if (pricingFieldsMap.single_up_to_30?.value) {
        transformed.pricing.single.upTo30 = parseFloat(
          pricingFieldsMap.single_up_to_30.value
        );
      }
      if (pricingFieldsMap.single_over_30?.value) {
        transformed.pricing.single.over30 = parseFloat(
          pricingFieldsMap.single_over_30.value
        );
      }

      // Process pair pricing
      if (pricingFieldsMap.pair?.value) {
        transformed.pricing.pair.over30 = parseFloat(
          pricingFieldsMap.pair.value
        );
      }
    }

    if (fieldsMap.protection_options?.reference?.fields) {
      const protectionOptionsFieldsMap = {};
      fieldsMap.protection_options.reference.fields.forEach((field) => {
        protectionOptionsFieldsMap[field.key] = field.value;
      });

      transformed.protectionOptions = {
        // allowedTypes: [],
        defaults: {},
      };

      // Transform allowed_types to allowedTypes array with lowercase values
      if (protectionOptionsFieldsMap.allowed_types) {
        const allowedTypesArray = parseJsonSafely(
          protectionOptionsFieldsMap.allowed_types
        );
        if (Array.isArray(allowedTypesArray)) {
          transformed.protectionOptions.allowedTypes = allowedTypesArray.map(
            (type) => handleize(type)
          );
        }
      }

      // Add defaults for non-null values
      if (protectionOptionsFieldsMap.kickplate_height !== null) {
        transformed.protectionOptions.defaults.kickplateHeight =
          protectionOptionsFieldsMap.kickplate_height;
      }
      if (protectionOptionsFieldsMap.bumper_height !== null) {
        transformed.protectionOptions.defaults.bumperHeight =
          protectionOptionsFieldsMap.bumper_height;
      }
      if (protectionOptionsFieldsMap.kickplate_material !== null) {
        transformed.protectionOptions.defaults.kickplateMaterial = handleize(
          protectionOptionsFieldsMap.kickplate_material
        );
      }
      if (protectionOptionsFieldsMap.bumper_material !== null) {
        transformed.protectionOptions.defaults.bumperMaterial = handleize(
          protectionOptionsFieldsMap.bumper_material
        );
      }
    }

    if (fieldsMap.default_window_size?.reference?.fields) {
      const windowSizeFieldsMap = {};
      fieldsMap.default_window_size.reference.fields.forEach((field) => {
        windowSizeFieldsMap[field.key] = field.value;
      });

      transformed.defaultWindowSize = {
        title: "default",
        width: windowSizeFieldsMap.width ? parseFloat(windowSizeFieldsMap.width) : null,
        height: windowSizeFieldsMap.height ? parseFloat(windowSizeFieldsMap.height) : null,
      };
    }

    // Transform all other fields automatically
    Object.keys(fieldsMap).forEach((key) => {
      // Skip fields that are handled specially
      if (
        [
          "product",
          "color_swatches",
          "name",
          "product_image",
          "pricing",
          "protection_options",
          "default_window_size",
        ].includes(key)
      ) {
        return;
      }

      // Handle dimension fields specially
      if (key.startsWith("single") || key.startsWith("double")) {
        const field = fieldsMap[key];
        const value = field.value;

        if (value !== null && value !== undefined) {
          const numericValue = parseFloat(value);

          if (key.startsWith("single")) {
            const dimensionKey = key.replace("single_", "").toLowerCase();
            const camelCaseKey = toCamelCase(dimensionKey);
            transformed.dimensions.single[camelCaseKey] = numericValue;
          } else if (key.startsWith("double")) {
            const dimensionKey = key.replace("double_", "").toLowerCase();
            const camelCaseKey = toCamelCase(dimensionKey);
            transformed.dimensions.double[camelCaseKey] = numericValue;
          }
        }
        return;
      }

      const field = fieldsMap[key];
      let value = field.value;

      // Skip null values
      if (value === null || value === undefined) {
        return;
      }

      // Convert field name to camelCase
      const camelCaseKey = toCamelCase(key);

      // Parse JSON arrays/objects
      value = parseJsonSafely(value);

      // Convert boolean strings
      value = convertToBoolean(value);

      // Handle special case transformations
      if (key === "traffic_types" || key === "environments") {
        // Convert to array and transform specific values
        const camelCaseKey = toCamelCase(key);
        const trafficArray = Array.isArray(value) ? value : [value];
        transformed[camelCaseKey] = trafficArray.map((traffic) => {
          return traffic.replace(/\s+/g, "-").toLowerCase();
        });
      } else if (key === "door_types" || key === "finishes") {
        transformed[camelCaseKey] = handleize(value);
      } else {
        transformed[camelCaseKey] = value;
      }
    });

    return transformed;
  });
};

export default transformDoorMetaobjects;
