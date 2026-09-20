const db = require("../db");

const getDashboardAnalytics = async (req, res) => {
  try {
    const [
      projects,
      progress,
      resources,
      inventory,
      procurement,
      workforce,
      attendance
    ] = await Promise.all([

      db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
          COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed,
          COALESCE(SUM(budget), 0) AS total_budget
        FROM projects
      `),

      db.query(`
        SELECT
          COALESCE(AVG(completion_pct), 0) AS average_completion,
          COUNT(*) AS total_milestones
        FROM project_milestones
      `),

      db.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(AVG(utilization_percentage), 0)
            AS average_utilization,
          COUNT(*) FILTER (WHERE status = 'AVAILABLE')
            AS available,
          COUNT(*) FILTER (WHERE status = 'MAINTENANCE')
            AS maintenance
        FROM resources
      `),

      db.query(`
        SELECT
          COUNT(*) AS total_items,
          COUNT(*) FILTER (
            WHERE quantity <= minimum_stock
            AND quantity > 0
          ) AS low_stock,
          COUNT(*) FILTER (
            WHERE quantity <= 0
          ) AS out_of_stock
        FROM inventory
      `),

      db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'REQUESTED')
            AS requested,
          COUNT(*) FILTER (WHERE status = 'APPROVED')
            AS approved,
          COUNT(*) FILTER (WHERE status = 'ORDERED')
            AS ordered,
          COUNT(*) FILTER (WHERE status = 'DELIVERED')
            AS delivered,
          COUNT(*) FILTER (WHERE status = 'REJECTED')
            AS rejected,
          COALESCE(SUM(quantity * unit_price), 0)
            AS total_cost
        FROM procurements
      `),

      db.query(`
        SELECT COUNT(*) AS total_workers
        FROM users
        WHERE role IN (
          'Engineer',
          'Supervisor',
          'Contractor',
          'Skilled Worker',
          'Unskilled Worker',
          'Consultant'
        )
      `),

      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'PRESENT')
            AS present,
          COUNT(*) FILTER (WHERE status = 'ABSENT')
            AS absent,
          COUNT(*) FILTER (WHERE status = 'LATE')
            AS late,
          COUNT(*) AS total_records
        FROM attendance
      `)
    ]);

    res.json({
      projects: projects.rows[0],
      progress: progress.rows[0],
      resources: resources.rows[0],
      inventory: inventory.rows[0],
      procurement: procurement.rows[0],
      workforce: workforce.rows[0],
      attendance: attendance.rows[0]
    });

  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      message: "Failed to generate dashboard analytics"
    });
  }
};

module.exports = {
  getDashboardAnalytics
};