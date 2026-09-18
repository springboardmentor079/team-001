const db = require("../db");

const RESOURCE_CATEGORIES = ["EXCAVATORS", "CONCRETE_MIXERS", "CRANES", "DUMP_TRUCKS", "GENERATORS", "SAFETY_EQUIPMENT"];
const RESOURCE_STATUSES = ["AVAILABLE", "IN_USE", "UNDER_MAINTENANCE", "OUT_OF_SERVICE"];

const validate = (body, update = false) => {
    if (!update && (!body.name || !body.category)) return "Name and category are required";
    if (body.category && !RESOURCE_CATEGORIES.includes(body.category)) return "Invalid resource category";
    if (body.status && !RESOURCE_STATUSES.includes(body.status)) return "Invalid resource status";
    if (body.quantity !== undefined && (!Number.isInteger(Number(body.quantity)) || Number(body.quantity) < 0)) return "Quantity must be a non-negative integer";
    if (body.utilization_percentage !== undefined && (Number(body.utilization_percentage) < 0 || Number(body.utilization_percentage) > 100)) return "Utilization must be between 0 and 100";
    return null;
};

const createResource = async (req, res) => {
    try {
        const error = validate(req.body);
        if (error) return res.status(400).json({ message: error });
        const { name, category, quantity = 1, project_id = null, status = "AVAILABLE", utilization_percentage = 0, location = null, maintenance_date = null } = req.body;
        const projectCheck = project_id ? await db.query("SELECT id FROM projects WHERE id=$1", [project_id]) : { rows: [1] };
        if (project_id && !projectCheck.rows.length) return res.status(400).json({ message: "Project not found" });
        const result = await db.query(
            `INSERT INTO resources (project_id,name,category,quantity,status,location,maintenance_date,utilization_percentage)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [project_id, name, category, quantity, status, location, maintenance_date || null, utilization_percentage]
        );
        res.status(201).json({ message: "Resource created successfully", resource: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating resource", error: error.message });
    }
};

const getResources = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM resources ORDER BY id");
        res.json({ resources: result.rows, pagination: { page: 1, limit: result.rows.length, total: result.rows.length, total_pages: 1 } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching resources", error: error.message });
    }
};

const getResourceById = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM resources WHERE id=$1", [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ message: "Resource not found" });
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ message: "Error fetching resource", error: error.message }); }
};

const updateResource = async (req, res) => {
    try {
        const error = validate(req.body, true);
        if (error) return res.status(400).json({ message: error });
        const fields = ["project_id","name","category","quantity","status","location","maintenance_date","utilization_percentage"].filter((f) => Object.prototype.hasOwnProperty.call(req.body, f));
        if (!fields.length) return res.status(400).json({ message: "No resource fields supplied" });
        if (req.body.project_id) {
            const project = await db.query("SELECT id FROM projects WHERE id=$1", [req.body.project_id]);
            if (!project.rows.length) return res.status(400).json({ message: "Project not found" });
        }
        const values = fields.map((f) => req.body[f]);
        const setSql = fields.map((f, i) => `${f}=$${i+1}`).join(", ");
        const result = await db.query(`UPDATE resources SET ${setSql} WHERE id=$${values.length+1} RETURNING *`, [...values, req.params.id]);
        if (!result.rows.length) return res.status(404).json({ message: "Resource not found" });
        res.json({ message: "Resource updated successfully", resource: result.rows[0] });
    } catch (error) { console.error(error); res.status(500).json({ message: "Error updating resource", error: error.message }); }
};

const deleteResource = async (req, res) => {
    try {
        const result = await db.query("DELETE FROM resources WHERE id=$1 RETURNING *", [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ message: "Resource not found" });
        res.json({ message: "Resource deleted successfully", resource: result.rows[0] });
    } catch (error) { res.status(500).json({ message: "Error deleting resource", error: error.message }); }
};

module.exports = { createResource, getResources, getResourceById, updateResource, deleteResource };
