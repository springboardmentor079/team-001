const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    createProcurement,
    getProcurements,
    getProcurementById,
    updateProcurement,
    deleteProcurement
} = require("../controllers/procurementController");


router.post(
    "/",
    verifyToken,
    createProcurement
);


router.get(
    "/",
    verifyToken,
    getProcurements
);


router.get(
    "/:id",
    verifyToken,
    getProcurementById
);


router.put(
    "/:id",
    verifyToken,
    updateProcurement
);


router.delete(
    "/:id",
    verifyToken,
    deleteProcurement
);


module.exports = router;
