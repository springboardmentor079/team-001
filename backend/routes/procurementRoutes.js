const express = require("express");

const {
  createProcurement,
  getProcurements,
  getProcurementById,
  updateProcurement,
  updateProcurementStatus,
  deleteProcurement,
  getProcurementSummary
} = require("../controllers/procurementController");

const router = express.Router();

router.get("/summary", getProcurementSummary);

router.get("/", getProcurements);

router.get("/:id", getProcurementById);

router.post("/", createProcurement);

router.put("/:id", updateProcurement);

router.patch("/:id/status", updateProcurementStatus);

router.delete("/:id", deleteProcurement);

module.exports = router;