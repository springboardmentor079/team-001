const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const {
    getProjectReport,
    getProgressReport,
    getResourceReport,
    getMaterialReport,
    getWorkforceReport
} = require("../controllers/reportController");


router.get(
    "/projects",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager"
    ),
    getProjectReport
);


router.get(
    "/progress",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    getProgressReport
);


router.get(
    "/resources",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    getResourceReport
);


router.get(
    "/materials",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    getMaterialReport
);


router.get(
    "/workforce",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    getWorkforceReport
);


module.exports = router;