const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { upload, getDocuments, uploadDocument, deleteDocument } = require("../controllers/documentController");

router.get("/", verifyToken, getDocuments);
router.post("/upload", verifyToken, upload.single("file"), uploadDocument);
router.delete("/:id", verifyToken, deleteDocument);

module.exports = router;
