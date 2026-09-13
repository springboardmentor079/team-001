const db = require("../db");

const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            location,
            start_date,
            end_date,
            budget,
            status
        } = req.body;

        const manager_id = req.user.id;

        const result = await db.query(
            `INSERT INTO projects
            (name, description, category, location, start_date, end_date, budget, status, manager_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                name,
                description,
                category,
                location,
                start_date,
                end_date,
                budget,
                status,
                manager_id
            ]
        );

        res.status(201).json({
            message: "Project created successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE PROJECT ERROR:", error);

        res.status(500).json({
            message: "Error creating project",
            error: error.message
        });
    }
};


const getProjects = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM projects ORDER BY id"
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("GET PROJECTS ERROR:", error);

        res.status(500).json({
            message: "Error fetching projects",
            error: error.message
        });
    }
};


const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "SELECT * FROM projects WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("GET PROJECT ERROR:", error);

        res.status(500).json({
            message: "Error fetching project",
            error: error.message
        });
    }
};


const updateProject = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            category,
            location,
            start_date,
            end_date,
            budget,
            status
        } = req.body;

        const result = await db.query(
            `UPDATE projects
             SET name = $1,
                 description = $2,
                 category = $3,
                 location = $4,
                 start_date = $5,
                 end_date = $6,
                 budget = $7,
                 status = $8
             WHERE id = $9
             RETURNING *`,
            [
                name,
                description,
                category,
                location,
                start_date,
                end_date,
                budget,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.status(200).json({
            message: "Project updated successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error("UPDATE PROJECT ERROR:", error);

        res.status(500).json({
            message: "Error updating project",
            error: error.message
        });
    }
};


const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "DELETE FROM projects WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.status(200).json({
            message: "Project deleted successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE PROJECT ERROR:", error);

        res.status(500).json({
            message: "Error deleting project",
            error: error.message
        });
    }
};


module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
};