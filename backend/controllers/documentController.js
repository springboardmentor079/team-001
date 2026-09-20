const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads");
const documentsFile = path.join(uploadDir, "documents.json");

const ensureStorage = () => {
    fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(documentsFile)) {
        fs.writeFileSync(documentsFile, JSON.stringify([], null, 2));
    }
};

const readDocuments = () => {
    ensureStorage();
    try {
        const raw = fs.readFileSync(documentsFile, "utf-8");
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
};

const writeDocuments = (documents) => {
    ensureStorage();
    fs.writeFileSync(documentsFile, JSON.stringify(documents, null, 2));
};

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        ensureStorage();
        cb(null, uploadDir);
    },
    filename: function (_req, file, cb) {
        const safeName = file.originalname.replace(/\s+/g, "_");
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${safeName}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

const getDocuments = (req, res) => {
    try {
        const docs = readDocuments();
        res.status(200).json(docs);
    } catch (error) {
        console.error("GET_DOCUMENTS_ERROR:", error);
        res.status(500).json({ message: "Unable to load documents", error: error.message });
    }
};

const uploadDocument = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please choose a document to upload." });
        }

        const title = (req.body.title || req.file.originalname.replace(/\.[^.]+$/, "") || "Milestone 3 Document").trim();
        const category = req.body.category || "Procurement";
        const owner = req.body.owner || req.user?.name || "Team";
        const status = req.body.status || "Draft";
        const revision = req.body.revision || "v1.0";

        const docs = readDocuments();
        const doc = {
            id: Date.now(),
            title,
            category,
            owner,
            status,
            revision,
            updated: new Date().toISOString().slice(0, 10),
            fileType: (req.file.originalname.split(".").pop() || "FILE").toUpperCase(),
            originalName: req.file.originalname,
            fileName: req.file.filename,
            fileUrl: `/uploads/${req.file.filename}`,
            size: req.file.size,
        };

        docs.unshift(doc);
        writeDocuments(docs);

        return res.status(201).json(doc);
    } catch (error) {
        console.error("UPLOAD_DOCUMENT_ERROR:", error);
        return res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

const deleteDocument = (req, res) => {
    try {
        const docs = readDocuments();
        const docId = Number(req.params.id);
        const doc = docs.find((item) => Number(item.id) === docId);

        if (!doc) {
            return res.status(404).json({ message: "Document not found." });
        }

        if (doc.fileName) {
            const filePath = path.join(uploadDir, doc.fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const nextDocs = docs.filter((item) => Number(item.id) !== docId);
        writeDocuments(nextDocs);

        return res.status(200).json({ message: "Document deleted successfully." });
    } catch (error) {
        console.error("DELETE_DOCUMENT_ERROR:", error);
        return res.status(500).json({ message: "Unable to delete document", error: error.message });
    }
};

module.exports = {
    upload,
    getDocuments,
    uploadDocument,
    deleteDocument,
};
