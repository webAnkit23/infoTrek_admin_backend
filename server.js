const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const eventRoutes = require("./routes/eventRoutes");
dotenv.config();

require("./models/User");
require("./models/Event");
require("./models/Registration");

const registrationRoutes =
    require("./routes/registrationRoutes");

const app = express();

app.use(cors());

app.use(express.json());

// Routes
app.use(
    "/api/admin",
    registrationRoutes
);

// Test route
app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "InfoTrek Admin Backend Running"
    });

});
app.use("/api/events", eventRoutes);


// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log(
            "MongoDB Atlas connected successfully"
        );

        const PORT =
            process.env.PORT || 5000;

        app.listen(PORT, () => {

            console.log(
                `Server running on port ${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error(
            "MongoDB connection failed:",
            error
        );

    });