const db = require("../db");

const createNotification = async (req, res) => {
    try {
        const {
            user_id,
            title,
            message,
            notification_type
        } = req.body;

        const result = await db.query(
            `INSERT INTO notifications
            (user_id, title, message, notification_type)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                user_id,
                title,
                message,
                notification_type
            ]
        );

        res.status(201).json({
            message: "Notification created successfully",
            notification: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE NOTIFICATION ERROR:", error);

        res.status(500).json({
            message: "Error creating notification",
            error: error.message
        });
    }
};


const getNotifications = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT *
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);

        res.status(500).json({
            message: "Error fetching notifications",
            error: error.message
        });
    }
};


const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT *
             FROM notifications
             WHERE id = $1
             AND user_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("GET NOTIFICATION ERROR:", error);

        res.status(500).json({
            message: "Error fetching notification",
            error: error.message
        });
    }
};


const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_read } = req.body;

        const result = await db.query(
            `UPDATE notifications
             SET is_read = $1
             WHERE id = $2
             AND user_id = $3
             RETURNING *`,
            [
                is_read,
                id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification updated successfully",
            notification: result.rows[0]
        });

    } catch (error) {
        console.error("UPDATE NOTIFICATION ERROR:", error);

        res.status(500).json({
            message: "Error updating notification",
            error: error.message
        });
    }
};


const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `DELETE FROM notifications
             WHERE id = $1
             AND user_id = $2
             RETURNING *`,
            [
                id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification deleted successfully",
            notification: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE NOTIFICATION ERROR:", error);

        res.status(500).json({
            message: "Error deleting notification",
            error: error.message
        });
    }
};


module.exports = {
    createNotification,
    getNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification
};