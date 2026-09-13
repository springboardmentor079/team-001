const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createAttendance,
    getAttendance,
    getAttendanceById,
    updateAttendance,
    deleteAttendance
} = require("../controllers/attendanceController");


router.post(
    "/",
    verifyToken,
    allowRoles("Administrator", "Project Manager", "Site Engineer"),
    createAttendance
);


router.get(
    "/",
    verifyToken,
    getAttendance
);


router.get(
    "/:id",
    verifyToken,
    getAttendanceById
);


router.put(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager", "Site Engineer"),
    updateAttendance
);


router.delete(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    deleteAttendance
);


module.exports = router;