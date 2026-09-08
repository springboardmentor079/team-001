const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const {
    createNotification,
    getNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification
} = require("../controllers/notificationController");


router.post(
    "/",
    verifyToken,
    allowRoles(
        "Administrator",
        "Project Manager"
    ),
    createNotification
);


router.get(
    "/",
    verifyToken,
    getNotifications
);


router.get(
    "/:id",
    verifyToken,
    getNotificationById
);


router.put(
    "/:id",
    verifyToken,
    updateNotification
);


router.delete(
    "/:id",
    verifyToken,
    deleteNotification
);


module.exports = router;