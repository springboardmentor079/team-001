const db = require("../db");

const MATERIAL_CATEGORIES = ["CEMENT", "STEEL", "BRICKS", "SAND", "CONCRETE", "ELECTRICAL_MATERIALS", "PLUMBING_MATERIALS"];
const hasField = (body, field) => Object.prototype.hasOwnProperty.call(body, field);
const isValidId = (value) => (typeof value === "number" || typeof value === "string") && /^[1-9]\d*$/.test(String(value)) && Number(value) <= 2147483647;
const isValidNumeric = (value, precision, scale) => {
    const pattern = new RegExp(`^-?\\d{1,${precision - scale}}(?:\\.\\d{1,${scale}})?$`);
    return (typeof value === "number" || typeof value === "string") && pattern.test(String(value));
};
const parsePagination = (req, res) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (!Number.isInteger(page) || page < 1 || page > 1000000 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        res.status(400).json({ message: "Page must be between 1 and 1000000 and limit must be between 1 and 100" });
        return null;
    }
    return { page, limit, offset: (page - 1) * limit };
};
const validateInventory = (body, isUpdate) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) return "Invalid request body";
    if ((!isUpdate || hasField(body, "material_name")) && (typeof body.material_name !== "string" || body.material_name.trim().length === 0 || body.material_name.length > 150)) return "Material name is required and must not exceed 150 characters";
    if ((!isUpdate || hasField(body, "category")) && !MATERIAL_CATEGORIES.includes(body.category)) return "Category must be a valid material category";
    if (hasField(body, "quantity_available") && !isValidNumeric(body.quantity_available, 12, 2)) return "Quantity available must be a valid numeric value with up to 12 digits and 2 decimal places";
    if (hasField(body, "minimum_stock_level") && !isValidNumeric(body.minimum_stock_level, 12, 2)) return "Minimum stock level must be a valid numeric value with up to 12 digits and 2 decimal places";
    if (hasField(body, "unit") && (typeof body.unit !== "string" || body.unit.trim().length === 0 || body.unit.length > 20)) return "Unit must be between 1 and 20 characters";
    if (hasField(body, "location") && body.location !== null && (typeof body.location !== "string" || body.location.length > 255)) return "Location must not exceed 255 characters";
    return null;
};

const createInventory = async (req, res) => {
    try {
        const validationError = validateInventory(req.body, false);
        if (validationError) return res.status(400).json({ message: validationError });
        const fields = ["material_name", "category"];
        const values = [req.body.material_name, req.body.category];
        ["quantity_available", "minimum_stock_level", "unit", "location"].forEach((field) => {
            if (hasField(req.body, field)) { fields.push(field); values.push(req.body[field]); }
        });
        const placeholders = values.map((_, index) => `$${index + 1}`);
        const result = await db.query(`INSERT INTO inventory (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`, values);
        res.status(201).json({ message: "Inventory item created successfully", inventory: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating inventory item" });
    }
};

const getInventory = async (req, res) => {
    try {
        const pagination = parsePagination(req, res);
        if (!pagination) return;
        const [result, countResult] = await Promise.all([
            db.query("SELECT * FROM inventory ORDER BY id LIMIT $1 OFFSET $2", [pagination.limit, pagination.offset]),
            db.query("SELECT COUNT(*) FROM inventory")
        ]);
        const total = Number(countResult.rows[0].count);
        res.status(200).json({ inventory: result.rows, pagination: { page: pagination.page, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching inventory" });
    }
};

const getInventoryById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Inventory ID must be a valid positive integer" });
        const result = await db.query("SELECT * FROM inventory WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Inventory item not found" });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching inventory item" });
    }
};

const updateInventory = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Inventory ID must be a valid positive integer" });
        const validationError = validateInventory(req.body, true);
        if (validationError) return res.status(400).json({ message: validationError });

        const allowedFields = ["material_name", "category", "quantity_available", "minimum_stock_level", "unit", "location"];
        const fields = allowedFields.filter((field) => hasField(req.body, field));
        if (fields.length === 0) return res.status(400).json({ message: "At least one inventory field is required" });

        const values = fields.map((field) => req.body[field]);
        const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
        assignments.push("last_updated = CURRENT_TIMESTAMP", "updated_at = CURRENT_TIMESTAMP");
        const result = await db.query(
            `UPDATE inventory SET ${assignments.join(", ")} WHERE id = $${values.length + 1} RETURNING *`,
            [...values, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Inventory item not found" });
        res.status(200).json({ message: "Inventory item updated successfully", inventory: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating inventory item" });
    }
};

const deleteInventory = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Inventory ID must be a valid positive integer" });
        const result = await db.query("DELETE FROM inventory WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Inventory item not found" });
        res.status(200).json({ message: "Inventory item deleted successfully", inventory: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting inventory item" });
    }
};

module.exports = { createInventory, getInventory, getInventoryById, updateInventory, deleteInventory };
