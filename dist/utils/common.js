"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJSONField = void 0;
const parseJSONField = (field, fieldName) => {
    if (typeof field === "string") {
        try {
            const parsedField = JSON.parse(field);
            if (typeof parsedField === "object" || Array.isArray(parsedField)) {
                return parsedField;
            }
            else {
                throw new Error();
            }
        }
        catch (error) {
            throw new Error(`Invalid format for ${fieldName}. Expected a valid JSON object or array.`);
        }
    }
    return field;
};
exports.parseJSONField = parseJSONField;
