const db = require("../db");

const STATUSES = ["REQUESTED", "APPROVED", "ORDERED", "DELIVERED", "REJECTED"];

const createProcurement = async (req, res) => {
    try {
        const { project_id, item_name, category, quantity = 0, unit_price = 0, supplier = null, status = "REQUESTED", order_date = null, delivery_date = null } = req.body;
        if (!project_id || !item_name || !category) return res.status(400).json({ message: "Project, item and category are required" });
        if (!STATUSES.includes(status)) return res.status(400).json({ message: "Invalid procurement status" });
        const result = await db.query(
            `INSERT INTO procurements (project_id,item_name,category,quantity,unit_price,supplier,status,order_date,delivery_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [project_id, item_name, category, quantity, unit_price, supplier, status, order_date || null, delivery_date || null]
        );
        res.status(201).json({ message: "Procurement created successfully", procurement: result.rows[0] });
    } catch (error) { console.error(error); res.status(500).json({ message: "Error creating procurement", error: error.message }); }
};

const getProcurements = async (req, res) => {
    try { const result = await db.query("SELECT * FROM procurements ORDER BY id DESC"); res.json({ procurements: result.rows }); }
    catch (error) { res.status(500).json({ message: "Error fetching procurements", error: error.message }); }
};

const getProcurementById = async (req, res) => {
    try { const result = await db.query("SELECT * FROM procurements WHERE id=$1", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Procurement not found" }); res.json(result.rows[0]); }
    catch (error) { res.status(500).json({ message: "Error fetching procurement", error: error.message }); }
};

const updateProcurement = async (req, res) => {
    try {
        const fields = ["project_id","item_name","category","quantity","unit_price","supplier","status","order_date","delivery_date"].filter((f) => Object.prototype.hasOwnProperty.call(req.body, f));
        if (!fields.length) return res.status(400).json({ message: "No procurement fields supplied" });
        if (req.body.status && !STATUSES.includes(req.body.status)) return res.status(400).json({ message: "Invalid procurement status" });
        const values = fields.map((f) => req.body[f]);
        const result = await db.query(`UPDATE procurements SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(", ")} WHERE id=$${values.length+1} RETURNING *`, [...values, req.params.id]);
        if (!result.rows.length) return res.status(404).json({ message: "Procurement not found" });
        res.json({ message: "Procurement updated successfully", procurement: result.rows[0] });
    } catch (error) { res.status(500).json({ message: "Error updating procurement", error: error.message }); }
};

const deleteProcurement = async (req, res) => {
    try { const result = await db.query("DELETE FROM procurements WHERE id=$1 RETURNING *", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Procurement not found" }); res.json({ message: "Procurement deleted successfully", procurement: result.rows[0] }); }
    catch (error) { res.status(500).json({ message: "Error deleting procurement", error: error.message }); }
};

module.exports = { createProcurement, getProcurements, getProcurementById, updateProcurement, deleteProcurement };
