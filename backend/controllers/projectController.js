const db = require("../db");

const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            location,
            status,
            start_date,
            end_date
        } = req.body;

        const manager_id = req.user.id;

        const result = await db.query(
            `INSERT INTO projects
            (name, description, location, status, start_date, end_date, manager_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                name,
                description,
                location,
                status,
                start_date,
                end_date,
                manager_id
            ]
        );

        res.status(201).json({
            message: "Project created successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error creating project"
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
        console.error(error);

        res.status(500).json({
            message: "Error fetching projects"
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
        console.error(error);

        res.status(500).json({
            message: "Error fetching project"
        });
    }
};


const updateProject = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            location,
            status,
            start_date,
            end_date
        } = req.body;

        const result = await db.query(
            `UPDATE projects
             SET name = $1,
                 description = $2,
                 location = $3,
                 status = $4,
                 start_date = $5,
                 end_date = $6
             WHERE id = $7
             RETURNING *`,
            [
                name,
                description,
                location,
                status,
                start_date,
                end_date,
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
        console.error(error);

        res.status(500).json({
            message: "Error updating project"
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
        console.error(error);

        res.status(500).json({
            message: "Error deleting project"
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