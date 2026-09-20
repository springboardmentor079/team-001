const express = require("express");

const {
  getProjectReport,
  getProgressReport,
  getResourceReport,
  getInventoryReport,
  getProcurementReport,
  getWorkforceReport,
  getAttendanceReport,
  getAnalyticalReport
} = require("../controllers/reportController");

const router = express.Router();

router.get("/analytical", getAnalyticalReport);

router.get("/project/:projectId", getProjectReport);

router.get("/progress/:projectId", getProgressReport);

router.get("/resources/:projectId", getResourceReport);

router.get("/inventory/:projectId", getInventoryReport);

router.get("/procurement/:projectId", getProcurementReport);

router.get("/workforce/:projectId", getWorkforceReport);

router.get("/attendance/:projectId", getAttendanceReport);

module.exports = router;