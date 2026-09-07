const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    createInventory,
    getInventory,
    getInventoryById,
    updateInventory,
    deleteInventory
} = require("../controllers/inventoryController");


router.post(
    "/",
    verifyToken,
    createInventory
);


router.get(
    "/",
    verifyToken,
    getInventory
);


router.get(
    "/:id",
    verifyToken,
    getInventoryById
);


router.put(
    "/:id",
    verifyToken,
    updateInventory
);


router.delete(
    "/:id",
    verifyToken,
    deleteInventory
);


module.exports = router;
