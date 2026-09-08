const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createWorker,
    getWorkers,
    getWorkerById,
    updateWorker,
    deleteWorker
} = require("../controllers/workerController");


router.post(
    "/",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    createWorker
);


router.get(
    "/",
    verifyToken,
    getWorkers
);


router.get(
    "/:id",
    verifyToken,
    getWorkerById
);


router.put(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    updateWorker
);


router.delete(
    "/:id",
    verifyToken,
    allowRoles("Administrator", "Project Manager"),
    deleteWorker
);


module.exports = router;