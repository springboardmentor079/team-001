require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
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
const userRoutes = require("./routes/userRoutes");

// Middleware
const verifyToken = require("./middleware/authMiddleware");
const allowRoles = require("./middleware/roleMiddleware");

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "BuildTrack backend is running"
  });
});

// Profile
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({
    message: "You accessed a protected API",
    user: req.user
  });
});

// Admin
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

// Root
app.get("/", (req, res) => {
  res.json({
    message: "BuildTrack Backend is running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BuildTrack backend running on http://localhost:${PORT}`);
});