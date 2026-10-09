const express = require("express");

const router = express.Router();

const {
    getEventRegistrations,
    downloadEventRegistrationsExcel
} = require("../controllers/registrationController");


router.get(
    "/events/:eventId/registrations/:adminKey",
    getEventRegistrations
);


router.get(
    "/events/:eventId/registrations/excel/:adminKey",
    downloadEventRegistrationsExcel
);


module.exports = router;