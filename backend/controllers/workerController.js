const db = require("../db");

const createWorker = async (req, res) => {
    try {
        const {
            name,
            email,
            password_hash,
            phone
        } = req.body;

        const result = await db.query(
            `INSERT INTO users
            (name, email, password_hash, role, phone)
            VALUES ($1, $2, $3, 'Worker', $4)
            RETURNING id, name, email, role, phone, is_active, created_at`,
            [
                name,
                email,
                password_hash,
                phone
            ]
        );

        res.status(201).json({
            message: "Worker created successfully",
            worker: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE WORKER ERROR:", error);

        res.status(500).json({
            message: "Error creating worker",
            error: error.message
        });
    }
};


const getWorkers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                id,
                name,
                email,
                role,
                phone,
                is_active,
                created_at
             FROM users
             WHERE role = 'Worker'
             ORDER BY id`
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("GET WORKERS ERROR:", error);

        res.status(500).json({
            message: "Error fetching workers",
            error: error.message
        });
    }
};


const getWorkerById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT
                id,
                name,
                email,
                role,
                phone,
                is_active,
                created_at
             FROM users
             WHERE id = $1
             AND role = 'Worker'`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Worker not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("GET WORKER ERROR:", error);

        res.status(500).json({
            message: "Error fetching worker",
            error: error.message
        });
    }
};


const updateWorker = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            email,
            phone,
            is_active
        } = req.body;

        const result = await db.query(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 phone = $3,
                 is_active = $4
             WHERE id = $5
             AND role = 'Worker'
             RETURNING id, name, email, role, phone, is_active, created_at`,
            [
                name,
                email,
                phone,
                is_active,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Worker not found"
            });
        }

        res.status(200).json({
            message: "Worker updated successfully",
            worker: result.rows[0]
        });

    } catch (error) {
        console.error("UPDATE WORKER ERROR:", error);

        res.status(500).json({
            message: "Error updating worker",
            error: error.message
        });
    }
};


const deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `DELETE FROM users
             WHERE id = $1
             AND role = 'Worker'
             RETURNING id, name, email, role, phone, is_active, created_at`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Worker not found"
            });
        }

        res.status(200).json({
            message: "Worker deleted successfully",
            worker: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE WORKER ERROR:", error);

        res.status(500).json({
            message: "Error deleting worker",
            error: error.message
        });
    }
};


module.exports = {
    createWorker,
    getWorkers,
    getWorkerById,
    updateWorker,
    deleteWorker
};