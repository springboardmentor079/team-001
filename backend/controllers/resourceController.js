const db = require("../db");

const createResource = async (req, res) => {
    try {
        const {
            project_id,
            name,
            category,
            quantity,
            status,
            location,
            maintenance_date
        } = req.body;

        const result = await db.query(
            `INSERT INTO resources
            (project_id, name, category, quantity, status, location, maintenance_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                project_id,
                name,
                category,
                quantity,
                status,
                location,
                maintenance_date
            ]
        );

        res.status(201).json({
            message: "Resource created successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE RESOURCE ERROR:", error);

        res.status(500).json({
            message: "Error creating resource",
            error: error.message
        });
    }
};


const getResources = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM resources ORDER BY id"
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("GET RESOURCES ERROR:", error);

        res.status(500).json({
            message: "Error fetching resources",
            error: error.message
        });
    }
};


const getResourceById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "SELECT * FROM resources WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("GET RESOURCE ERROR:", error);

        res.status(500).json({
            message: "Error fetching resource",
            error: error.message
        });
    }
};


const updateResource = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            project_id,
            name,
            category,
            quantity,
            status,
            location,
            maintenance_date
        } = req.body;

        const result = await db.query(
            `UPDATE resources
             SET project_id = $1,
                 name = $2,
                 category = $3,
                 quantity = $4,
                 status = $5,
                 location = $6,
                 maintenance_date = $7
             WHERE id = $8
             RETURNING *`,
            [
                project_id,
                name,
                category,
                quantity,
                status,
                location,
                maintenance_date,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        res.status(200).json({
            message: "Resource updated successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("UPDATE RESOURCE ERROR:", error);

        res.status(500).json({
            message: "Error updating resource",
            error: error.message
        });
    }
};


const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "DELETE FROM resources WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        res.status(200).json({
            message: "Resource deleted successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE RESOURCE ERROR:", error);

        res.status(500).json({
            message: "Error deleting resource",
            error: error.message
        });
    }
};


module.exports = {
    createResource,
    getResources,
    getResourceById,
    updateResource,
    deleteResource
};