const db = require("../db");

const createProgress = async (req, res) => {
    try {
        const {
            project_id,
            description,
            progress_percentage,
            status,
            remarks
        } = req.body;

        const reported_by = req.user.id;

        const result = await db.query(
            `INSERT INTO project_milestones
            (project_id, description, progress_percentage, status, remarks, reported_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                project_id,
                description,
                progress_percentage,
                status,
                remarks,
                reported_by
            ]
        );

        res.status(201).json({
            message: "Progress created successfully",
            progress: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error creating progress"
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
        console.error(error);

        res.status(500).json({
            message: "Error fetching progress"
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
        console.error(error);

        res.status(500).json({
            message: "Error fetching progress"
        });
    }
};


const updateProgress = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            project_id,
            description,
            progress_percentage,
            status,
            remarks
        } = req.body;

        const result = await db.query(
            `UPDATE project_milestones
             SET project_id = $1,
                 description = $2,
                 progress_percentage = $3,
                 status = $4,
                 remarks = $5
             WHERE id = $6
             RETURNING *`,
            [
                project_id,
                description,
                progress_percentage,
                status,
                remarks,
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
        console.error(error);

        res.status(500).json({
            message: "Error updating progress"
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
        console.error(error);

        res.status(500).json({
            message: "Error deleting progress"
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