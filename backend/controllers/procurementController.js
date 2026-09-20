const db = require("../db");

const VALID_STATUSES = [
  "REQUESTED",
  "APPROVED",
  "ORDERED",
  "DELIVERED",
  "REJECTED"
];
const createProcurement = async (req, res) => {
  try {
    const {
      project_id,
      item_name,
      category,
      quantity,
      unit_price,
      supplier,
      status,
      order_date,
      delivery_date
    } = req.body;

    if (!project_id || !item_name || quantity == null || unit_price == null) {
      return res.status(400).json({
        message: "project_id, item_name, quantity and unit_price are required"
      });
    }

    const procurementStatus = status || "REQUESTED";

    if (!VALID_STATUSES.includes(procurementStatus)) {
      return res.status(400).json({
        message: "Invalid procurement status"
      });
    }

    const result = await db.query(
      `INSERT INTO procurements
       (project_id, item_name, category, quantity, unit_price,
        supplier, status, order_date, delivery_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        project_id,
        item_name,
        category || null,
        quantity,
        unit_price,
        supplier || null,
        procurementStatus,
        order_date || null,
        delivery_date || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create procurement error:", error);
    res.status(500).json({
      message: "Failed to create procurement"
    });
  }
};
const getProcurements = async (req, res) => {
  try {
    const {
      project_id,
      status,
      supplier,
      category
    } = req.query;

    let query = `
      SELECT
        p.*,
        pr.name AS project_name,
        (p.quantity * p.unit_price) AS total_cost
      FROM procurements p
      LEFT JOIN projects pr ON pr.id = p.project_id
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (project_id) {
      query += ` AND p.project_id = $${index++}`;
      values.push(project_id);
    }

    if (status) {
      query += ` AND p.status = $${index++}`;
      values.push(status);
    }

    if (supplier) {
      query += ` AND LOWER(p.supplier) LIKE LOWER($${index++})`;
      values.push(`%${supplier}%`);
    }

    if (category) {
      query += ` AND p.category = $${index++}`;
      values.push(category);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Get procurements error:", error);
    res.status(500).json({
      message: "Failed to fetch procurements"
    });
  }
};

const getProcurementById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         p.*,
         pr.name AS project_name,
         (p.quantity * p.unit_price) AS total_cost
       FROM procurements p
       LEFT JOIN projects pr ON pr.id = p.project_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Procurement not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get procurement error:", error);
    res.status(500).json({
      message: "Failed to fetch procurement"
    });
  }
};
const updateProcurement = async (req, res) => {
  try {
    const {
      project_id,
      item_name,
      category,
      quantity,
      unit_price,
      supplier,
      status,
      order_date,
      delivery_date
    } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid procurement status"
      });
    }

    const result = await db.query(
      `UPDATE procurements
       SET
         project_id = COALESCE($1, project_id),
         item_name = COALESCE($2, item_name),
         category = COALESCE($3, category),
         quantity = COALESCE($4, quantity),
         unit_price = COALESCE($5, unit_price),
         supplier = COALESCE($6, supplier),
         status = COALESCE($7, status),
         order_date = COALESCE($8, order_date),
         delivery_date = COALESCE($9, delivery_date)
       WHERE id = $10
       RETURNING *`,
      [
        project_id,
        item_name,
        category,
        quantity,
        unit_price,
        supplier,
        status,
        order_date,
        delivery_date,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Procurement not found"
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update procurement error:", error);
    res.status(500).json({
      message: "Failed to update procurement"
    });
  }
};
const updateProcurementStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Valid status is required"
      });
    }
    const result = await db.query(
      `UPDATE procurements
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Procurement not found"
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update procurement status error:", error);
    res.status(500).json({
      message: "Failed to update procurement status"
    });
  }
};
const deleteProcurement = async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM procurements
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Procurement not found"
      });
    }

    res.json({
      message: "Procurement deleted successfully"
    });
  } catch (error) {
    console.error("Delete procurement error:", error);
    res.status(500).json({
      message: "Failed to delete procurement"
    });
  }
};
const getProcurementSummary = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'REQUESTED') AS requested,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE status = 'ORDERED') AS ordered,
        COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
        COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
        COALESCE(SUM(quantity * unit_price), 0) AS total_cost
      FROM procurements
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Procurement summary error:", error);
    res.status(500).json({
      message: "Failed to generate procurement summary"
    });
  }
};

module.exports = {
  createProcurement,
  getProcurements,
  getProcurementById,
  updateProcurement,
  updateProcurementStatus,
  deleteProcurement,
  getProcurementSummary
};