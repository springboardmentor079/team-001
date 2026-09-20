const db = require("../db");

const getProjectReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT *
       FROM projects
       WHERE id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const project = result.rows[0];

    const milestones = await db.query(
      `SELECT *
       FROM project_milestones
       WHERE project_id = $1
       ORDER BY due_date`,
      [projectId]
    );

    res.json({
      project,
      milestones: milestones.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate project report"
    });
  }
};
const getProgressReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT
         id,
         name,
         description,
         due_date,
         completed_date,
         status,
         completion_pct
       FROM project_milestones
       WHERE project_id = $1
       ORDER BY due_date`,
      [projectId]
    );

    res.json({
      project_id: projectId,
      milestones: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate progress report"
    });
  }
};
const getResourceReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT
         id,
         name,
         category,
         quantity,
         status,
         location,
         maintenance_date,
         utilization_percentage
       FROM resources
       WHERE project_id = $1
       ORDER BY category, name`,
      [projectId]
    );

    res.json({
      project_id: projectId,
      resources: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate resource report"
    });
  }
};
const getInventoryReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT
         id,
         material_name,
         category,
         quantity,
         unit,
         minimum_stock,
         unit_price,
         supplier,
         CASE
           WHEN quantity <= 0 THEN 'OUT_OF_STOCK'
           WHEN quantity <= minimum_stock THEN 'LOW_STOCK'
           ELSE 'AVAILABLE'
         END AS stock_status
       FROM inventory
       WHERE project_id = $1
       ORDER BY material_name`,
      [projectId]
    );

    res.json({
      project_id: projectId,
      inventory: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate inventory report"
    });
  }
};
const getProcurementReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT
         p.*,
         (p.quantity * p.unit_price) AS total_cost
       FROM procurements p
       WHERE p.project_id = $1
       ORDER BY p.created_at DESC`,
      [projectId]
    );

    const summary = await db.query(
      `SELECT
         COUNT(*) AS total_records,
         COALESCE(SUM(quantity * unit_price), 0) AS total_cost,
         COUNT(*) FILTER (WHERE status = 'REQUESTED') AS requested,
         COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
         COUNT(*) FILTER (WHERE status = 'ORDERED') AS ordered,
         COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
         COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected
       FROM procurements
       WHERE project_id = $1`,
      [projectId]
    );

    res.json({
      project_id: projectId,
      summary: summary.rows[0],
      procurements: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate procurement report"
    });
  }
};
const getWorkforceReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.phone,
         u.is_active
       FROM users u
       WHERE u.role IN (
         'Engineer',
         'Supervisor',
         'Contractor',
         'Skilled Worker',
         'Unskilled Worker',
         'Consultant'
       )
       ORDER BY u.name`
    );

    res.json({
      project_id: projectId,
      workers: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate workforce report"
    });
  }
};
const getAttendanceReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT
         a.id,
         a.worker_id,
         u.name AS worker_name,
         a.attendance_date,
         a.status,
         a.check_in,
         a.check_out
       FROM attendance a
       LEFT JOIN users u ON u.id = a.worker_id
       ORDER BY a.attendance_date DESC`
    );

    res.json({
      project_id: projectId,
      attendance: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate attendance report"
    });
  }
};
const getAnalyticalReport = async (req, res) => {
  try {
    const projects = await db.query(`
      SELECT
        p.id,
        p.name,
        p.category,
        p.status,
        p.budget,
        COALESCE(AVG(pm.completion_pct), 0) AS average_progress,
        COUNT(pm.id) AS milestone_count
      FROM projects p
      LEFT JOIN project_milestones pm
        ON pm.project_id = p.id
      GROUP BY
        p.id,
        p.name,
        p.category,
        p.status,
        p.budget
      ORDER BY p.id
    `);

    res.json({
      projects: projects.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate analytical report"
    });
  }
};

module.exports = {
  getProjectReport,
  getProgressReport,
  getResourceReport,
  getInventoryReport,
  getProcurementReport,
  getWorkforceReport,
  getAttendanceReport,
  getAnalyticalReport
};