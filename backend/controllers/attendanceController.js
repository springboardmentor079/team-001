const db = require("../db");

const createAttendance = async (req, res) => {
    try {
        const {
            worker_id,
            project_id,
            attendance_date,
            status,
            check_in,
            check_out,
            remarks
        } = req.body;

        const result = await db.query(
            `INSERT INTO attendance
            (worker_id, project_id, attendance_date, status, check_in, check_out, remarks)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                worker_id,
                project_id,
                attendance_date,
                status,
                check_in,
                check_out,
                remarks
            ]
        );

        res.status(201).json({
            message: "Attendance created successfully",
            attendance: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error creating attendance"
        });
    }
};


const getAttendance = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM attendance ORDER BY attendance_date DESC, id DESC"
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error fetching attendance"
        });
    }
};


const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "SELECT * FROM attendance WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error fetching attendance"
        });
    }
};


const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            worker_id,
            project_id,
            attendance_date,
            status,
            check_in,
            check_out,
            remarks
        } = req.body;

        const result = await db.query(
            `UPDATE attendance
             SET worker_id = $1,
                 project_id = $2,
                 attendance_date = $3,
                 status = $4,
                 check_in = $5,
                 check_out = $6,
                 remarks = $7
             WHERE id = $8
             RETURNING *`,
            [
                worker_id,
                project_id,
                attendance_date,
                status,
                check_in,
                check_out,
                remarks,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.status(200).json({
            message: "Attendance updated successfully",
            attendance: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error updating attendance"
        });
    }
};


const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "DELETE FROM attendance WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.status(200).json({
            message: "Attendance deleted successfully",
            attendance: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error deleting attendance"
        });
    }
};


module.exports = {
    createAttendance,
    getAttendance,
    getAttendanceById,
    updateAttendance,
    deleteAttendance
};