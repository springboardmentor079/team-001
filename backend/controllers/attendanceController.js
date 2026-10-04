const db = require("../db");

const isWorkerRole = (role) => role === "Worker" || role === "Site Worker";

const findOrCreateWorkerRecord = async (workerUserId, projectId) => {
    const existing = await db.query(
        `SELECT worker_record.id
         FROM workers worker_record
         WHERE worker_record.user_id=$1
           AND ($2::bigint IS NULL OR worker_record.project_id=$2 OR worker_record.project_id IS NULL)
         ORDER BY CASE WHEN worker_record.project_id=$2 THEN 0 ELSE 1 END, worker_record.id
         LIMIT 1`,
        [workerUserId, projectId || null]
    );
    if (existing.rows.length) return existing.rows[0].id;

    const created = await db.query(
        `INSERT INTO workers (user_id, project_id, worker_type, phone, joining_date, status)
         SELECT id, $2, role, phone, CURRENT_DATE, 'ACTIVE'
         FROM users
         WHERE id=$1 AND role='Worker'
         RETURNING id`,
        [workerUserId, projectId || null]
    );
    return created.rows[0]?.id || null;
};

const withWorkerUserId = (attendance, workerUserId) => ({
    ...attendance,
    worker_id: workerUserId
});

const createAttendance = async (req, res) => {
    try {
        const { worker_id, attendance_date, check_in = null, check_out = null } = req.body;
        const status = String(req.body.status || "").toUpperCase();
        const projectId = req.body.project_id || null;
        const isSiteEngineer = req.user.role === "Site Engineer";
        if (!worker_id || (!isSiteEngineer && !attendance_date) || !["PRESENT", "ABSENT", "LEAVE"].includes(status)) {
            return res.status(400).json({ message: "A Worker, attendance date, and valid attendance status are required." });
        }
        if (isSiteEngineer) {
            if (!projectId) {
                return res.status(400).json({ message: "Select a project before recording attendance." });
            }
            const assignedWorker = await db.query(
                `SELECT worker_assignment.worker_id
                 FROM workforce_allocations engineer_assignment
                 JOIN workforce_allocations worker_assignment
                   ON worker_assignment.project_id = engineer_assignment.project_id
                 JOIN users worker ON worker.id = worker_assignment.worker_id AND worker.role = 'Worker'
                 WHERE engineer_assignment.worker_id = $1
                   AND engineer_assignment.project_id = $3
                   AND UPPER(BTRIM(engineer_assignment.status)) = 'ACTIVE'
                   AND worker_assignment.worker_id = $2
                   AND UPPER(BTRIM(worker_assignment.status)) = 'ACTIVE'
                 LIMIT 1`,
                [req.user.id, worker_id, projectId]
            );
            if (!assignedWorker.rows.length) {
                return res.status(403).json({ message: "You can only record attendance for Workers assigned to your projects." });
            }
        }
        const workerRecordId = await findOrCreateWorkerRecord(worker_id, projectId);
        if (!workerRecordId) {
            return res.status(400).json({ message: "The selected account does not have a linked Worker record." });
        }
        const existing = await db.query(
            `SELECT id FROM attendance
             WHERE worker_id=$1
               AND attendance_date=${isSiteEngineer ? "CURRENT_DATE" : "$2"}
             ORDER BY id DESC LIMIT 1`,
            isSiteEngineer ? [workerRecordId] : [workerRecordId, attendance_date]
        );
        const result = existing.rows.length
            ? await db.query(
                `UPDATE attendance
                 SET status=$1, check_in=COALESCE($2, check_in), check_out=COALESCE($3, check_out)
                 WHERE id=$4 RETURNING *`,
                [status, check_in, check_out, existing.rows[0].id]
            )
            : isSiteEngineer
                ? await db.query(
                    `INSERT INTO attendance (worker_id,attendance_date,status,check_in,check_out)
                     VALUES ($1,CURRENT_DATE,$2,$3,$4) RETURNING *`,
                    [workerRecordId, status, check_in, check_out]
                )
                : await db.query(
                    `INSERT INTO attendance (worker_id,attendance_date,status,check_in,check_out)
                     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
                    [workerRecordId, attendance_date, status, check_in, check_out]
                );
        res.status(existing.rows.length ? 200 : 201).json({
            message: existing.rows.length ? "Attendance updated successfully" : "Attendance created successfully",
            attendance: withWorkerUserId(result.rows[0], worker_id)
        });
    } catch (error) { console.error(error); res.status(500).json({ message: "Error creating attendance", error: error.message }); }
};

const getAttendance = async (req, res) => {
    try {
        const result = req.user.role === "Site Engineer"
            ? await db.query(
                `SELECT attendance.*, worker_record.user_id AS worker_user_id
                 FROM attendance
                 JOIN workers worker_record ON worker_record.id=attendance.worker_id
                 JOIN users worker ON worker.id=worker_record.user_id AND worker.role='Worker'
                 WHERE EXISTS (
                   SELECT 1
                   FROM workforce_allocations engineer_assignment
                   JOIN workforce_allocations worker_assignment
                     ON worker_assignment.project_id=engineer_assignment.project_id
                     AND worker_assignment.worker_id=worker_record.user_id
                     AND UPPER(BTRIM(worker_assignment.status))='ACTIVE'
                   WHERE engineer_assignment.worker_id=$1
                     AND UPPER(BTRIM(engineer_assignment.status))='ACTIVE'
                 )
                 ORDER BY attendance.attendance_date DESC, attendance.id DESC`,
                [req.user.id]
            )
            : isWorkerRole(req.user.role)
                ? await db.query(
                    `SELECT attendance.*, worker_record.user_id AS worker_user_id
                     FROM attendance
                     JOIN workers worker_record ON worker_record.id=attendance.worker_id
                     WHERE worker_record.user_id=$1
                     ORDER BY attendance.attendance_date DESC, attendance.id DESC`,
                    [req.user.id]
                )
            : await db.query(
                `SELECT attendance.*, worker_record.user_id AS worker_user_id
                 FROM attendance
                 JOIN workers worker_record ON worker_record.id=attendance.worker_id
                 ORDER BY attendance.attendance_date DESC, attendance.id DESC`
            );
        res.json(result.rows.map(({ worker_user_id, ...record }) => withWorkerUserId(record, worker_user_id)));
    }
    catch (error) { res.status(500).json({ message: "Error fetching attendance", error: error.message }); }
};

const getAttendanceById = async (req, res) => {
    try {
        const result = req.user.role === "Site Engineer"
            ? await db.query(
                `SELECT attendance.*, worker_record.user_id AS worker_user_id
                 FROM attendance
                 JOIN workers worker_record ON worker_record.id=attendance.worker_id
                 JOIN users worker ON worker.id=worker_record.user_id AND worker.role='Worker'
                 WHERE attendance.id=$1
                   AND EXISTS (
                     SELECT 1
                     FROM workforce_allocations engineer_assignment
                     JOIN workforce_allocations worker_assignment
                       ON worker_assignment.project_id=engineer_assignment.project_id
                       AND worker_assignment.worker_id=worker_record.user_id
                      AND UPPER(BTRIM(worker_assignment.status))='ACTIVE'
                     WHERE engineer_assignment.worker_id=$2
                       AND UPPER(BTRIM(engineer_assignment.status))='ACTIVE'
                   )`,
                [req.params.id, req.user.id]
            )
            : await db.query(
                `SELECT attendance.*, worker_record.user_id AS worker_user_id
                 FROM attendance
                 JOIN workers worker_record ON worker_record.id=attendance.worker_id
                 WHERE attendance.id=$1`,
                [req.params.id]
            );
        if (!result.rows.length) return res.status(404).json({ message: "Attendance record not found" });
        const { worker_user_id, ...record } = result.rows[0];
        res.json(withWorkerUserId(record, worker_user_id));
    }
    catch (error) { res.status(500).json({ message: "Error fetching attendance", error: error.message }); }
};

const updateAttendance = async (req, res) => {
    try {
        const { worker_id, attendance_date, status, check_in, check_out } = req.body;
        const normalizedStatus = String(status || "").toUpperCase();
        const isSiteEngineer = req.user.role === "Site Engineer";
        if (!worker_id || (!isSiteEngineer && !attendance_date) || !["PRESENT", "ABSENT", "LEAVE"].includes(normalizedStatus)) {
            return res.status(400).json({ message: "A Worker, attendance date, and valid attendance status are required." });
        }
        if (isSiteEngineer) {
            const assignedWorker = await db.query(
                `SELECT attendance.id
                 FROM attendance
                 JOIN workers current_worker ON current_worker.id=attendance.worker_id
                 WHERE attendance.id=$1
                   AND attendance.attendance_date=CURRENT_DATE
                   AND current_worker.user_id=$2
                   AND EXISTS (
                     SELECT 1
                     FROM workforce_allocations engineer_assignment
                     JOIN workforce_allocations worker_assignment
                       ON worker_assignment.project_id=engineer_assignment.project_id
                      AND worker_assignment.worker_id=current_worker.user_id
                     WHERE engineer_assignment.worker_id=$3
                       AND engineer_assignment.project_id=$4
                       AND UPPER(BTRIM(engineer_assignment.status))='ACTIVE'
                       AND UPPER(BTRIM(worker_assignment.status))='ACTIVE'
                   )`,
                [req.params.id, worker_id, req.user.id, req.body.project_id || null]
            );
            if (!assignedWorker.rows.length) {
                return res.status(403).json({ message: "You can only update attendance for Workers assigned to your selected project." });
            }
        }
        const workerRecordId = await findOrCreateWorkerRecord(worker_id, req.body.project_id);
        if (!workerRecordId) {
            return res.status(400).json({ message: "The selected account does not have a linked Worker record." });
        }
        const result = await db.query(
            isSiteEngineer
                ? `UPDATE attendance SET worker_id=$1, attendance_date=CURRENT_DATE, status=$2, check_in=$3, check_out=$4 WHERE id=$5 RETURNING *`
                : `UPDATE attendance SET worker_id=$1, attendance_date=$2, status=$3, check_in=$4, check_out=$5 WHERE id=$6 RETURNING *`,
            isSiteEngineer
                ? [workerRecordId, normalizedStatus, check_in || null, check_out || null, req.params.id]
                : [workerRecordId, attendance_date, normalizedStatus, check_in || null, check_out || null, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ message: "Attendance record not found" });
        res.json({
            message: "Attendance updated successfully",
            attendance: withWorkerUserId(result.rows[0], worker_id)
        });
    } catch (error) { res.status(500).json({ message: "Error updating attendance", error: error.message }); }
};

const deleteAttendance = async (req, res) => {
    try { const result = await db.query("DELETE FROM attendance WHERE id=$1 RETURNING *", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Attendance record not found" }); res.json({ message: "Attendance deleted successfully", attendance: result.rows[0] }); }
    catch (error) { res.status(500).json({ message: "Error deleting attendance", error: error.message }); }
};

module.exports = { createAttendance, getAttendance, getAttendanceById, updateAttendance, deleteAttendance };
