const db = require("../db");

const MATERIAL_CATEGORIES = ["CEMENT", "STEEL", "BRICKS", "SAND", "CONCRETE", "ELECTRICAL_MATERIALS", "PLUMBING_MATERIALS"];

const createInventory = async (req, res) => {
    try {
        const { project_id = null, material_name, category, quantity = 0, unit = "unit", minimum_stock = 0, unit_price = 0, supplier = null } = req.body;
        if (!material_name || !MATERIAL_CATEGORIES.includes(category)) return res.status(400).json({ message: "Material name and valid category are required" });
        const result = await db.query(
            `INSERT INTO inventory (project_id,material_name,category,quantity,unit,minimum_stock,unit_price,supplier)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [project_id, material_name, category, quantity, unit, minimum_stock, unit_price, supplier]
        );
        res.status(201).json({ message: "Inventory item created successfully", inventory: result.rows[0] });
    } catch (error) { console.error(error); res.status(500).json({ message: "Error creating inventory item", error: error.message }); }
};

const getInventory = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM inventory ORDER BY id");
        res.json({ inventory: result.rows, pagination: { page: 1, limit: result.rows.length, total: result.rows.length, total_pages: 1 } });
    } catch (error) { console.error(error); res.status(500).json({ message: "Error fetching inventory", error: error.message }); }
};

const getInventoryById = async (req, res) => {
    try { const result = await db.query("SELECT * FROM inventory WHERE id=$1", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Inventory item not found" }); res.json(result.rows[0]); }
    catch (error) { res.status(500).json({ message: "Error fetching inventory item", error: error.message }); }
};

const updateInventory = async (req, res) => {
    try {
        const allowed = ["project_id","material_name","category","quantity","unit","minimum_stock","unit_price","supplier"];
        const fields = allowed.filter((f) => Object.prototype.hasOwnProperty.call(req.body, f));
        if (!fields.length) return res.status(400).json({ message: "No inventory fields supplied" });
        if (req.body.category && !MATERIAL_CATEGORIES.includes(req.body.category)) return res.status(400).json({ message: "Invalid material category" });
        const values = fields.map((f) => req.body[f]);
        const setSql = fields.map((f, i) => `${f}=$${i+1}`).join(", ");
        const result = await db.query(`UPDATE inventory SET ${setSql}, updated_at=CURRENT_TIMESTAMP WHERE id=$${values.length+1} RETURNING *`, [...values, req.params.id]);
        if (!result.rows.length) return res.status(404).json({ message: "Inventory item not found" });
        res.json({ message: "Inventory item updated successfully", inventory: result.rows[0] });
    } catch (error) { console.error(error); res.status(500).json({ message: "Error updating inventory item", error: error.message }); }
};

const deleteInventory = async (req, res) => {
    try { const result = await db.query("DELETE FROM inventory WHERE id=$1 RETURNING *", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Inventory item not found" }); res.json({ message: "Inventory item deleted successfully", inventory: result.rows[0] }); }
    catch (error) { res.status(500).json({ message: "Error deleting inventory item", error: error.message }); }
};

module.exports = { createInventory, getInventory, getInventoryById, updateInventory, deleteInventory };
