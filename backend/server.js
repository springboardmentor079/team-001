<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const app = express();
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

const db = require('./db');
app.get('/api/health', (req, res) => {
  res.json({
    message: 'BuildTrack backend is running'
  });
});



const PORT = 5000;

const server = app.listen(PORT, () => {
  console.log(`BuildTrack backend running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('SERVER ERROR:', error);
});

process.on('exit', (code) => {
  console.log('Node process exited with code:', code);
});
=======
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
>>>>>>> 6bf68f18a687edf69dcc4961d4e969ea7d9aaa5b
