const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    createResource,
    getResources,
    getResourceById,
    updateResource,
    deleteResource
} = require("../controllers/resourceController");


router.post(
    "/",
    verifyToken,
    createResource
);


router.get(
    "/",
    verifyToken,
    getResources
);


router.get(
    "/:id",
    verifyToken,
    getResourceById
);


router.put(
    "/:id",
    verifyToken,
    updateResource
);


router.delete(
    "/:id",
    verifyToken,
    deleteResource
);


module.exports = router;
