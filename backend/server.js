const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const progressRoutes = require("./routes/milestoneRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const workerRoutes = require("./routes/workerRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const procurementRoutes = require("./routes/procurementRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const milestone2Routes = require("./routes/milestone2Routes");
const documentRoutes = require("./routes/documentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const verifyToken = require("./middleware/authMiddleware");
const allowRoles = require("./middleware/roleMiddleware");
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", milestone2Routes);

app.get("/", (req, res) => {
    res.json({
        message: "BuildTrack Backend is running"
    });
});

app.get("/api/profile", verifyToken, async (req, res) => {
    try {
        const result = await require("./db").query(
            `SELECT id, name, email, phone, role, is_active
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Profile retrieved successfully",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("PROFILE ERROR:", error);
        res.status(500).json({
            message: "Error fetching profile",
            error: error.message
        });
    }
});

app.get(
    "/api/admin",
    verifyToken,
    allowRoles("Administrator"),
    (req, res) => {
        res.json({
            message: "Welcome Administrator"
        });
    }
);

// Existing users table is the source for active Project Managers.
// This is read-only and is used by the Admin workforce/project assignment UI.
app.get(
    "/api/admin/project-managers",
    verifyToken,
    allowRoles("Administrator"),
    async (req, res) => {
        try {
            const result = await require("./db").query(
                `SELECT id, name, email, role, is_active
                 FROM users
                 WHERE role = 'Project Manager' AND is_active = true
                 ORDER BY name, id`
            );
            res.json({ project_managers: result.rows });
        } catch (error) {
            console.error("PROJECT MANAGERS ERROR:", error);
            res.status(500).json({ message: "Error fetching Project Managers", error: error.message });
        }
    }
);

app.get(
    "/api/site-engineers",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    async (req, res) => {
        try {
            const result = await require("./db").query(
                `SELECT id, name, email, role, phone, is_active
                 FROM users
                 WHERE role = 'Site Engineer' AND is_active = true
                 ORDER BY name, id`
            );
            res.json(result.rows);
        } catch (error) {
            console.error("SITE ENGINEERS ERROR:", error);
            res.status(500).json({ message: "Error fetching Site Engineers", error: error.message });
        }
    }
);

module.exports = app;
