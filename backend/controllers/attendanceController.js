const db = require("../db");

const createAttendance = async (req, res) => {
    try {
        const { worker_id, attendance_date, status, check_in = null, check_out = null } = req.body;
        const result = await db.query(
            `INSERT INTO attendance (worker_id,attendance_date,status,check_in,check_out)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [worker_id, attendance_date, status, check_in, check_out]
        );
        res.status(201).json({ message: "Attendance created successfully", attendance: result.rows[0] });
    } catch (error) { console.error(error); res.status(500).json({ message: "Error creating attendance", error: error.message }); }
};

const getAttendance = async (req, res) => {
    try { const result = await db.query("SELECT * FROM attendance ORDER BY attendance_date DESC, id DESC"); res.json(result.rows); }
    catch (error) { res.status(500).json({ message: "Error fetching attendance", error: error.message }); }
};

const getAttendanceById = async (req, res) => {
    try { const result = await db.query("SELECT * FROM attendance WHERE id=$1", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Attendance record not found" }); res.json(result.rows[0]); }
    catch (error) { res.status(500).json({ message: "Error fetching attendance", error: error.message }); }
};

const updateAttendance = async (req, res) => {
    try {
        const { worker_id, attendance_date, status, check_in, check_out } = req.body;
        const result = await db.query(
            `UPDATE attendance SET worker_id=$1, attendance_date=$2, status=$3, check_in=$4, check_out=$5 WHERE id=$6 RETURNING *`,
            [worker_id, attendance_date, status, check_in || null, check_out || null, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ message: "Attendance record not found" });
        res.json({ message: "Attendance updated successfully", attendance: result.rows[0] });
    } catch (error) { res.status(500).json({ message: "Error updating attendance", error: error.message }); }
};

const deleteAttendance = async (req, res) => {
    try { const result = await db.query("DELETE FROM attendance WHERE id=$1 RETURNING *", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Attendance record not found" }); res.json({ message: "Attendance deleted successfully", attendance: result.rows[0] }); }
    catch (error) { res.status(500).json({ message: "Error deleting attendance", error: error.message }); }
};

module.exports = { createAttendance, getAttendance, getAttendanceById, updateAttendance, deleteAttendance };
