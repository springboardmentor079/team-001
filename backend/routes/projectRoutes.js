const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    closeProject,
    deleteProject
} = require("../controllers/projectController");


router.post(
    "/",
    verifyToken,
    allowRoles("Administrator"),
    createProject
);


router.get(
    "/",
    verifyToken,
    allowRoles("Administrator", "Project Manager", "Site Engineer", "Worker", "Site Worker"),
    getProjects
);


router.get(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager", "Site Engineer", "Worker", "Site Worker"),
    getProjectById
);


router.put(
    "/:id",
    verifyToken,
    allowRoles("Administrator"),
    updateProject
);


router.patch(
    "/:id/close",
    verifyToken,
    allowRoles("Administrator"),
    closeProject
);


router.delete(
    "/:id",
    verifyToken,
    allowRoles("Administrator"),
    deleteProject
);


module.exports = router;