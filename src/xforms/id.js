import decodeOpaqueIdForNamespace from "@reactioncommerce/api-utils/decodeOpaqueIdForNamespace.js";
import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";

const namespaces = {
  Unit: "reaction/unit",
  Shop: "reaction/shop",
  Tag: "reaction/tag",
};

export const encodeUnitOpaqueId = encodeOpaqueId(namespaces.Unit);
export const encodeShopOpaqueId = encodeOpaqueId(namespaces.Shop);
export const encodeTagOpaqueId = encodeOpaqueId(namespaces.Tag);

export const decodeUnitOpaqueId = decodeOpaqueIdForNamespace(namespaces.Unit);
export const decodeShopOpaqueId = decodeOpaqueIdForNamespace(namespaces.Shop);
export const decodeTagOpaqueId = decodeOpaqueIdForNamespace(namespaces.Tag);
