const db = require("../db");

const createProgress = async (req, res) => {
    try {
        const {
            project_id,
            name,
            description,
            due_date,
            completed_date,
            status,
            completion_pct
        } = req.body;

        const result = await db.query(
            `INSERT INTO project_milestones
            (project_id, name, description, due_date, completed_date, status, completion_pct)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                project_id,
                name,
                description,
                due_date,
                completed_date,
                status,
                completion_pct
            ]
        );

        res.status(201).json({
            message: "Progress created successfully",
            progress: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE PROGRESS ERROR:", error);

        res.status(500).json({
            message: "Error creating progress",
            error: error.message
        });
    }
};


const getProgress = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM project_milestones ORDER BY id"
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("GET PROGRESS ERROR:", error);

        res.status(500).json({
            message: "Error fetching progress",
            error: error.message
        });
    }
};


const getProgressById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "SELECT * FROM project_milestones WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Progress record not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("GET PROGRESS ERROR:", error);

        res.status(500).json({
            message: "Error fetching progress",
            error: error.message
        });
    }
};


const updateProgress = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            project_id,
            name,
            description,
            due_date,
            completed_date,
            status,
            completion_pct
        } = req.body;

        const result = await db.query(
            `UPDATE project_milestones
             SET project_id = $1,
                 name = $2,
                 description = $3,
                 due_date = $4,
                 completed_date = $5,
                 status = $6,
                 completion_pct = $7
             WHERE id = $8
             RETURNING *`,
            [
                project_id,
                name,
                description,
                due_date,
                completed_date,
                status,
                completion_pct,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Progress record not found"
            });
        }

        res.status(200).json({
            message: "Progress updated successfully",
            progress: result.rows[0]
        });

    } catch (error) {
        console.error("UPDATE PROGRESS ERROR:", error);

        res.status(500).json({
            message: "Error updating progress",
            error: error.message
        });
    }
};


const deleteProgress = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "DELETE FROM project_milestones WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Progress record not found"
            });
        }

        res.status(200).json({
            message: "Progress deleted successfully",
            progress: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE PROGRESS ERROR:", error);

        res.status(500).json({
            message: "Error deleting progress",
            error: error.message
        });
    }
};


module.exports = {
    createProgress,
    getProgress,
    getProgressById,
    updateProgress,
    deleteProgress
};