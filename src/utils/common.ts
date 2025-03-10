export const parseJSONField = (field: any, fieldName: string) => {
  if (typeof field === "string") {
    try {
      const parsedField = JSON.parse(field);
      if (typeof parsedField === "object" || Array.isArray(parsedField)) {
        return parsedField;
      } else {
        throw new Error();
      }
    } catch (error) {
      throw new Error(
        `Invalid format for ${fieldName}. Expected a valid JSON object or array.`
      );
    }
  }
  return field;
};
