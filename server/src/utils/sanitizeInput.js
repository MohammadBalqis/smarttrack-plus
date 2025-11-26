import sanitizeHtml from "sanitize-html";

/*
  Sanitizes:
  - strings
  - nested objects
  - nested arrays

  Removes scripts, events (onclick), CSS expressions, etc.
*/

export const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: "discard",
    });
  }

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v));
  }

  if (value && typeof value === "object") {
    const cleanObj = {};
    for (const key in value) {
      cleanObj[key] = sanitizeValue(value[key]);
    }
    return cleanObj;
  }

  return value;
};
