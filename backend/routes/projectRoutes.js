const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} = require("../controllers/projectController");


router.post(
    "/",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    createProject
);


router.get(
    "/",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    getProjects
);


router.get(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    getProjectById
);


router.put(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    updateProject
);


router.delete(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    deleteProject
);


module.exports = router;