const express = require("express");

const app = express();

app.use(express.json());

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

const verifyToken = require("./middleware/authMiddleware");
const allowRoles = require("./middleware/roleMiddleware");

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

app.get("/", (req, res) => {
    res.json({
        message: "BuildTrack Backend is running"
    });
});

app.get("/api/profile", verifyToken, (req, res) => {
    res.json({
        message: "You accessed a protected API",
        user: req.user
    });
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

module.exports = app;