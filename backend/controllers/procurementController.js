const db = require("../db");

const PROCUREMENT_CATEGORIES = ["RAW_MATERIALS", "EQUIPMENT", "MACHINERY", "SAFETY_EQUIPMENT", "OFFICE_SUPPLIES"];
const PROCUREMENT_STATUSES = ["REQUESTED", "APPROVED", "ORDERED", "DELIVERED", "REJECTED"];

const hasField = (body, field) => Object.prototype.hasOwnProperty.call(body, field);
const isValidId = (value) => (typeof value === "number" || typeof value === "string") && /^[1-9]\d*$/.test(String(value)) && Number(value) <= 2147483647;
const isValidInteger = (value) => /^-?\d+$/.test(String(value)) && Number(value) >= -2147483648 && Number(value) <= 2147483647;
const isValidNumeric = (value, precision, scale) => {
    const pattern = new RegExp(`^-?\\d{1,${precision - scale}}(?:\\.\\d{1,${scale}})?$`);
    return (typeof value === "number" || typeof value === "string") && pattern.test(String(value));
};
const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
const validateProjectId = async (projectId, res) => {
    if (!isValidId(projectId)) {
        res.status(400).json({ message: "Project ID must be a valid positive integer" });
        return false;
    }
    const project = await db.query("SELECT id FROM projects WHERE id = $1", [projectId]);
    if (project.rows.length === 0) {
        res.status(400).json({ message: "Project not found" });
        return false;
    }
    return true;
};
const validateProcurement = (body, isUpdate) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) return "Invalid request body";
    if (!isUpdate && !hasField(body, "project_id")) return "Project ID is required";
    if ((!isUpdate || hasField(body, "item_name")) && (typeof body.item_name !== "string" || body.item_name.trim().length === 0 || body.item_name.length > 200)) return "Item name is required and must not exceed 200 characters";
    if ((!isUpdate || hasField(body, "category")) && !PROCUREMENT_CATEGORIES.includes(body.category)) return "Category must be a valid procurement category";
    if (hasField(body, "quantity") && !isValidInteger(body.quantity)) return "Quantity must be a valid integer";
    if (hasField(body, "estimated_cost") && body.estimated_cost !== null && !isValidNumeric(body.estimated_cost, 14, 2)) return "Estimated cost must be a valid numeric value with up to 14 digits and 2 decimal places";
    if (hasField(body, "actual_cost") && body.actual_cost !== null && !isValidNumeric(body.actual_cost, 14, 2)) return "Actual cost must be a valid numeric value with up to 14 digits and 2 decimal places";
    if (hasField(body, "status") && !PROCUREMENT_STATUSES.includes(body.status)) return "Status must be a valid procurement status";
    if (hasField(body, "vendor_name") && body.vendor_name !== null && (typeof body.vendor_name !== "string" || body.vendor_name.length > 200)) return "Vendor name must not exceed 200 characters";
    if (hasField(body, "request_date") && body.request_date !== null && !isValidDate(body.request_date)) return "Request date must be a valid date in YYYY-MM-DD format";
    if (hasField(body, "expected_delivery_date") && body.expected_delivery_date !== null && !isValidDate(body.expected_delivery_date)) return "Expected delivery date must be a valid date in YYYY-MM-DD format";
    return null;
};

const createProcurement = async (req, res) => {
    try {
        const validationError = validateProcurement(req.body, false);
        if (validationError) return res.status(400).json({ message: validationError });
        if (!(await validateProjectId(req.body.project_id, res))) return;
        const fields = ["project_id", "item_name", "category"];
        const values = [req.body.project_id, req.body.item_name, req.body.category];
        ["vendor_name", "quantity", "estimated_cost", "actual_cost", "status", "request_date", "expected_delivery_date"].forEach((field) => {
            if (hasField(req.body, field)) { fields.push(field); values.push(req.body[field]); }
        });
        const placeholders = values.map((_, index) => `$${index + 1}`);
        const result = await db.query(`INSERT INTO procurements (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`, values);
        res.status(201).json({ message: "Procurement created successfully", procurement: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating procurement" });
    }
};

const getProcurements = async (req, res) => {
    try {
        const pagination = parsePagination(req, res);
        if (!pagination) return;
        const [result, countResult] = await Promise.all([
            db.query("SELECT * FROM procurements ORDER BY id LIMIT $1 OFFSET $2", [pagination.limit, pagination.offset]),
            db.query("SELECT COUNT(*) FROM procurements")
        ]);
        const total = Number(countResult.rows[0].count);
        res.status(200).json({ procurements: result.rows, pagination: { page: pagination.page, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching procurements" });
    }
};

const getProcurementById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Procurement ID must be a valid positive integer" });
        const result = await db.query("SELECT * FROM procurements WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Procurement not found" });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching procurement" });
    }
};

const updateProcurement = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Procurement ID must be a valid positive integer" });
        const validationError = validateProcurement(req.body, true);
        if (validationError) return res.status(400).json({ message: validationError });
        if (hasField(req.body, "project_id") && !(await validateProjectId(req.body.project_id, res))) return;

        const allowedFields = ["project_id", "item_name", "category", "vendor_name", "quantity", "estimated_cost", "actual_cost", "status", "request_date", "expected_delivery_date"];
        const fields = allowedFields.filter((field) => hasField(req.body, field));
        if (fields.length === 0) return res.status(400).json({ message: "At least one procurement field is required" });

        const values = fields.map((field) => req.body[field]);
        const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
        assignments.push("updated_at = CURRENT_TIMESTAMP");
        const result = await db.query(
            `UPDATE procurements SET ${assignments.join(", ")} WHERE id = $${values.length + 1} RETURNING *`,
            [...values, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Procurement not found" });
        res.status(200).json({ message: "Procurement updated successfully", procurement: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating procurement" });
    }
};

const deleteProcurement = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Procurement ID must be a valid positive integer" });
        const result = await db.query("DELETE FROM procurements WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Procurement not found" });
        res.status(200).json({ message: "Procurement deleted successfully", procurement: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting procurement" });
    }
};

module.exports = { createProcurement, getProcurements, getProcurementById, updateProcurement, deleteProcurement };
