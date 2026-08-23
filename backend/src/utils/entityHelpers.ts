/**
 * Reliably extracts a string ID from a value that may be an ObjectId,
 * a plain string, or a populated Mongoose object ({ _id: ... }).
 */
export const getDocId = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val !== null) {
        if ("_id" in val && val._id) {
            return String((val as { _id: unknown })._id);
        }
        if ("id" in val && val.id) {
            return String((val as { id: unknown }).id);
        }
        return String(val);
    }
    return String(val);
};
