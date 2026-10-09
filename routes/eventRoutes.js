const express = require("express");
const Event = require("../models/Event");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error("Get events error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch events"
        });
    }
});

module.exports = router;