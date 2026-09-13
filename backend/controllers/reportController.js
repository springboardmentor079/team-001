const db = require("../db");

const getProjectReport = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                COUNT(*) AS total_projects,
                COUNT(*) FILTER (WHERE status = 'planning') AS planning,
                COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed
            FROM projects
        `);

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("PROJECT REPORT ERROR:", error);

        res.status(500).json({
            message: "Error generating project report",
            error: error.message
        });
    }
};


const getProgressReport = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                p.id AS project_id,
                p.name AS project_name,
                COALESCE(MAX(pm.completion_pct), 0) AS completion_pct
            FROM projects p
            LEFT JOIN project_milestones pm
                ON p.id = pm.project_id
            GROUP BY p.id, p.name
            ORDER BY p.id
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("PROGRESS REPORT ERROR:", error);

        res.status(500).json({
            message: "Error generating progress report",
            error: error.message
        });
    }
};


const getResourceReport = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                r.id,
                r.project_id,
                p.name AS project_name,
                r.name,
                r.category,
                r.quantity,
                r.status,
                r.location,
                r.maintenance_date
            FROM resources r
            JOIN projects p
                ON r.project_id = p.id
            ORDER BY r.id
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("RESOURCE REPORT ERROR:", error);

        res.status(500).json({
            message: "Error generating resource report",
            error: error.message
        });
    }
};


const getMaterialReport = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                i.id,
                i.project_id,
                p.name AS project_name,
                i.material_name,
                i.category,
                i.quantity,
                i.unit,
                i.minimum_stock,
                i.unit_price,
                i.supplier,
                i.updated_at
            FROM inventory i
            JOIN projects p
                ON i.project_id = p.id
            ORDER BY i.id
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("MATERIAL REPORT ERROR:", error);

        res.status(500).json({
            message: "Error generating material report",
            error: error.message
        });
    }
};


module.exports = {
    getProjectReport,
    getProgressReport,
    getResourceReport,
    getMaterialReport
};