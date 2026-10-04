const db = require("../db");

const hasSiteEngineerProjectAssignment = async (userId, projectId) => {
    const result = await db.query(
        `SELECT 1
         FROM workforce_allocations
         WHERE worker_id=$1
           AND project_id=$2
           AND role='Site Engineer'
           AND status='ACTIVE'
         LIMIT 1`,
        [userId, projectId]
    );
    return result.rows.length > 0;
};

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

        if (req.user.role === "Site Engineer" &&
            !(await hasSiteEngineerProjectAssignment(req.user.id, project_id))) {
            return res.status(403).json({ message: "You can only create milestones for projects assigned to you." });
        }

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
        const result = req.user.role === "Site Engineer"
            ? await db.query(
                `SELECT milestone.*
                 FROM project_milestones milestone
                 WHERE EXISTS (
                   SELECT 1
                   FROM workforce_allocations assignment
                   WHERE assignment.worker_id=$1
                     AND assignment.project_id=milestone.project_id
                     AND assignment.role='Site Engineer'
                     AND assignment.status='ACTIVE'
                 )
                 ORDER BY milestone.id`,
                [req.user.id]
            )
            : await db.query("SELECT * FROM project_milestones ORDER BY id");

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

        const result = req.user.role === "Site Engineer"
            ? await db.query(
                `SELECT milestone.*
                 FROM project_milestones milestone
                 WHERE milestone.id=$1
                   AND EXISTS (
                     SELECT 1
                     FROM workforce_allocations assignment
                     WHERE assignment.worker_id=$2
                       AND assignment.project_id=milestone.project_id
                       AND assignment.role='Site Engineer'
                       AND assignment.status='ACTIVE'
                   )`,
                [id, req.user.id]
            )
            : await db.query("SELECT * FROM project_milestones WHERE id = $1", [id]);

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

        if (req.user.role === "Site Engineer") {
            const assignedMilestone = await db.query(
                `SELECT milestone.id
                 FROM project_milestones milestone
                 WHERE milestone.id=$1
                   AND milestone.project_id=$2
                   AND EXISTS (
                     SELECT 1
                     FROM workforce_allocations assignment
                     WHERE assignment.worker_id=$3
                       AND assignment.project_id=milestone.project_id
                       AND assignment.role='Site Engineer'
                       AND assignment.status='ACTIVE'
                   )`,
                [id, project_id, req.user.id]
            );
            if (!assignedMilestone.rows.length) {
                return res.status(403).json({ message: "You can only update milestones for projects assigned to you." });
            }
        }

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

        const result = req.user.role === "Site Engineer"
            ? await db.query(
                `DELETE FROM project_milestones milestone
                 WHERE milestone.id=$1
                   AND EXISTS (
                     SELECT 1
                     FROM workforce_allocations assignment
                     WHERE assignment.worker_id=$2
                       AND assignment.project_id=milestone.project_id
                       AND assignment.role='Site Engineer'
                       AND assignment.status='ACTIVE'
                   )
                 RETURNING milestone.*`,
                [id, req.user.id]
            )
            : await db.query("DELETE FROM project_milestones WHERE id = $1 RETURNING *", [id]);

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