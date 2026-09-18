const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const c = require("../controllers/milestone2Controller");

router.get("/material-requests", verifyToken, c.list("material_requests"));
router.post("/material-requests", verifyToken, c.createMaterialRequest);
router.put("/material-requests/:id", verifyToken, c.updateMaterialRequest);
router.delete("/material-requests/:id", verifyToken, c.deleteMaterialRequest);

router.get("/material-allocations", verifyToken, c.list("material_allocations"));
router.post("/material-allocations", verifyToken, c.createMaterialAllocation);
router.delete("/material-allocations/:id", verifyToken, c.deleteMaterialAllocation);

router.get("/workforce-allocations", verifyToken, c.list("workforce_allocations"));
router.post("/workforce-allocations", verifyToken, allowRoles("Administrator", "Project Manager"), c.createWorkforceAllocation);
router.put("/workforce-allocations/:id", verifyToken, allowRoles("Administrator", "Project Manager"), c.updateWorkforceAllocation);
router.delete("/workforce-allocations/:id", verifyToken, allowRoles("Administrator", "Project Manager"), c.deleteWorkforceAllocation);

router.get("/shifts", verifyToken, c.list("shifts"));
router.post("/shifts", verifyToken, allowRoles("Administrator", "Project Manager", "Site Engineer"), c.createShift);
router.put("/shifts/:id", verifyToken, allowRoles("Administrator", "Project Manager", "Site Engineer"), c.updateShift);
router.delete("/shifts/:id", verifyToken, allowRoles("Administrator", "Project Manager", "Site Engineer"), c.deleteShift);

router.get("/payroll", verifyToken, c.list("payroll"));
router.post("/payroll", verifyToken, allowRoles("Administrator", "Project Manager"), c.createPayroll);
router.put("/payroll/:id", verifyToken, allowRoles("Administrator", "Project Manager"), c.updatePayroll);
router.delete("/payroll/:id", verifyToken, allowRoles("Administrator", "Project Manager"), c.deletePayroll);

module.exports = router;
