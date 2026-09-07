const db = require("../db");

const RESOURCE_CATEGORIES = ["EXCAVATORS", "CONCRETE_MIXERS", "CRANES", "DUMP_TRUCKS", "GENERATORS", "SAFETY_EQUIPMENT"];
const AVAILABILITY_STATUSES = ["AVAILABLE", "IN_USE", "UNDER_MAINTENANCE", "OUT_OF_SERVICE"];

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
        res.status(400).json({ message: "Assigned project ID must be a valid positive integer" });
        return false;
    }
    const project = await db.query("SELECT id FROM projects WHERE id = $1", [projectId]);
    if (project.rows.length === 0) {
        res.status(400).json({ message: "Assigned project not found" });
        return false;
    }
    return true;
};
const validateResource = (body, isUpdate) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) return "Invalid request body";
    if ((!isUpdate || hasField(body, "name")) && (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 150)) return "Name is required and must not exceed 150 characters";
    if ((!isUpdate || hasField(body, "category")) && !RESOURCE_CATEGORIES.includes(body.category)) return "Category must be a valid resource category";
    if (hasField(body, "quantity") && !isValidInteger(body.quantity)) return "Quantity must be a valid integer";
    if (hasField(body, "availability_status") && !AVAILABILITY_STATUSES.includes(body.availability_status)) return "Availability status must be valid";
    if (hasField(body, "utilization_percentage") && !isValidNumeric(body.utilization_percentage, 5, 2)) return "Utilization percentage must be a valid numeric value with up to 5 digits and 2 decimal places";
    if (hasField(body, "maintenance_date") && body.maintenance_date !== null && !isValidDate(body.maintenance_date)) return "Maintenance date must be a valid date in YYYY-MM-DD format";
    return null;
};

const createResource = async (req, res) => {
    try {
        const validationError = validateResource(req.body, false);
        if (validationError) return res.status(400).json({ message: validationError });
        if (hasField(req.body, "assigned_project_id") && req.body.assigned_project_id !== null && !(await validateProjectId(req.body.assigned_project_id, res))) return;

        const fields = ["name", "category"];
        const values = [req.body.name, req.body.category];
        ["quantity", "availability_status", "utilization_percentage", "assigned_project_id", "maintenance_date"].forEach((field) => {
            if (hasField(req.body, field)) { fields.push(field); values.push(req.body[field]); }
        });
        const placeholders = values.map((_, index) => `$${index + 1}`);
        const result = await db.query(`INSERT INTO resources (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`, values);
        res.status(201).json({ message: "Resource created successfully", resource: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating resource" });
    }
};

const getResources = async (req, res) => {
    try {
        const pagination = parsePagination(req, res);
        if (!pagination) return;
        const [result, countResult] = await Promise.all([
            db.query("SELECT * FROM resources ORDER BY id LIMIT $1 OFFSET $2", [pagination.limit, pagination.offset]),
            db.query("SELECT COUNT(*) FROM resources")
        ]);
        const total = Number(countResult.rows[0].count);
        res.status(200).json({ resources: result.rows, pagination: { page: pagination.page, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching resources" });
    }
};

const getResourceById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Resource ID must be a valid positive integer" });
        const result = await db.query("SELECT * FROM resources WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Resource not found" });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching resource" });
    }
};

const updateResource = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Resource ID must be a valid positive integer" });
        const validationError = validateResource(req.body, true);
        if (validationError) return res.status(400).json({ message: validationError });
        if (hasField(req.body, "assigned_project_id") && req.body.assigned_project_id !== null && !(await validateProjectId(req.body.assigned_project_id, res))) return;

        const allowedFields = ["name", "category", "quantity", "availability_status", "utilization_percentage", "assigned_project_id", "maintenance_date"];
        const fields = allowedFields.filter((field) => hasField(req.body, field));
        if (fields.length === 0) return res.status(400).json({ message: "At least one resource field is required" });

        const values = fields.map((field) => req.body[field]);
        const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
        assignments.push("updated_at = CURRENT_TIMESTAMP");
        const result = await db.query(
            `UPDATE resources SET ${assignments.join(", ")} WHERE id = $${values.length + 1} RETURNING *`,
            [...values, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Resource not found" });
        res.status(200).json({ message: "Resource updated successfully", resource: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating resource" });
    }
};

const deleteResource = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Resource ID must be a valid positive integer" });
        const result = await db.query("DELETE FROM resources WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Resource not found" });
        res.status(200).json({ message: "Resource deleted successfully", resource: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting resource" });
    }
};

module.exports = { createResource, getResources, getResourceById, updateResource, deleteResource };
