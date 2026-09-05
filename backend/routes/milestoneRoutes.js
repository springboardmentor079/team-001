const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const {
    createProgress,
    getProgress,
    getProgressById,
    updateProgress,
    deleteProgress
} = require("../controllers/milestoneController");


router.post(
    "/",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    createProgress
);


router.get(
    "/",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    getProgress
);


router.get(
    "/:id",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    getProgressById
);


router.put(
    "/:id",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager",
        "Site Engineer"
    ),
    updateProgress
);


router.delete(
    "/:id",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager"
    ),
    deleteProgress
);


module.exports = router;