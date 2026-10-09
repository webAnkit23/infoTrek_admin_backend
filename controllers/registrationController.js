const mongoose = require("mongoose");
const ExcelJS = require("exceljs");

const Registration = require("../models/Registration");
const Event = require("../models/Event");


// ============================================================
// GET EVENT REGISTRATIONS
// ============================================================

const getEventRegistrations = async (req, res) => {
    try {

        const { eventId, adminKey } = req.params;

        // ========================================================
        // CHECK ADMIN KEY
        // ========================================================

        if (
            !adminKey ||
            adminKey !== process.env.ADMIN_EXPORT_KEY
        ) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }


        // ========================================================
        // VALIDATE EVENT ID
        // ========================================================

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }


        // ========================================================
        // CHECK EVENT EXISTS
        // ========================================================

        const event = await Event.findById(eventId).lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }


        // ========================================================
        // GET REGISTRATIONS
        // ========================================================

        const registrations = await Registration.find({
            event: eventId,
            status: "registered"
        })
            .populate(
                "leader",
                "userId name email number"
            )
            .populate(
                "players",
                "userId name email number"
            )
            .lean();


        // ========================================================
        // FORMAT TEAMS
        // ========================================================

        const teams = registrations.map(
            (registration, index) => {

                // ------------------------------------------------
                // LEADER
                // ------------------------------------------------

                let leader = null;

                if (registration.leader) {

                    leader = {
                        rollNo: registration.leader.userId,
                        name: registration.leader.name,
                        email: registration.leader.email,
                        phone: registration.leader.number
                    };

                }


                // ------------------------------------------------
                // MEMBERS
                // ------------------------------------------------

                let members = [];

                if (
                    Array.isArray(registration.players)
                ) {

                    members = registration.players
                        .filter((player) => player)
                        .map((player) => {

                            return {
                                rollNo: player.userId,
                                name: player.name,
                                email: player.email,
                                phone: player.number
                            };

                        });

                }


                // ------------------------------------------------
                // TEAM
                // ------------------------------------------------

                return {
                    teamNumber: index + 1,
                    leader: leader,
                    members: members
                };

            }
        );


        // ========================================================
        // RESPONSE
        // ========================================================

        return res.status(200).json({
            success: true,
            totalTeams: teams.length,
            teams: teams
        });


    } catch (error) {

        console.error(
            "Get event registrations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get registrations",
            error: error.message
        });

    }
};



// ============================================================
// DOWNLOAD EVENT REGISTRATIONS AS EXCEL
// ============================================================

const downloadEventRegistrationsExcel = async (req, res) => {

    try {

        const { eventId, adminKey } = req.params;


        // ========================================================
        // CHECK ADMIN KEY
        // ========================================================

        if (
            !adminKey ||
            adminKey !== process.env.ADMIN_EXPORT_KEY
        ) {

            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });

        }


        // ========================================================
        // VALIDATE EVENT ID
        // ========================================================

        if (!mongoose.Types.ObjectId.isValid(eventId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });

        }


        // ========================================================
        // CHECK EVENT EXISTS
        // ========================================================

        const event = await Event.findById(eventId).lean();

        if (!event) {

            return res.status(404).json({
                success: false,
                message: "Event not found"
            });

        }


        // ========================================================
        // GET REGISTRATIONS
        // ========================================================

        const registrations = await Registration.find({
            event: eventId,
            status: "registered"
        })
            .populate(
                "leader",
                "userId name email number"
            )
            .populate(
                "players",
                "userId name email number"
            )
            .lean();


        // ========================================================
        // CREATE EXCEL WORKBOOK
        // ========================================================

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "InfoTrek 26";
        workbook.created = new Date();


        // ========================================================
        // CREATE WORKSHEET
        // ========================================================

        const worksheet =
            workbook.addWorksheet("Registrations");


        // ========================================================
        // TITLE
        // ========================================================

        worksheet.mergeCells("A1:F1");

        const title = worksheet.getCell("A1");

        title.value = "Team Registrations";

        title.font = {
            bold: true,
            size: 18
        };

        title.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        worksheet.getRow(1).height = 30;


        // ========================================================
        // SUMMARY
        // ========================================================

        worksheet.mergeCells("A2:F2");

        const summary = worksheet.getCell("A2");

        summary.value =
            `Total Teams: ${registrations.length}`;

        summary.font = {
            bold: true
        };

        summary.alignment = {
            horizontal: "center"
        };


        // ========================================================
        // EMPTY ROW
        // ========================================================

        worksheet.addRow([]);


        // ========================================================
        // HEADERS
        // ========================================================

        const header = worksheet.addRow([
            "Team",
            "Role",
            "Roll No",
            "Name",
            "Email",
            "Phone"
        ]);

        header.font = {
            bold: true
        };

        header.alignment = {
            horizontal: "center",
            vertical: "middle"
        };


        // ========================================================
        // ADD TEAMS
        // ========================================================

        registrations.forEach(
            (registration, index) => {

                const teamNumber = index + 1;


                // ------------------------------------------------
                // LEADER
                // ------------------------------------------------

                if (registration.leader) {

                    worksheet.addRow([
                        `Team ${teamNumber}`,
                        "Leader",
                        registration.leader.userId,
                        registration.leader.name,
                        registration.leader.email,
                        registration.leader.number
                    ]);

                }


                // ------------------------------------------------
                // MEMBERS
                // ------------------------------------------------

                if (
                    Array.isArray(registration.players) &&
                    registration.players.length > 0
                ) {

                    registration.players.forEach(
                        (player) => {

                            if (!player) {
                                return;
                            }

                            worksheet.addRow([
                                `Team ${teamNumber}`,
                                "Member",
                                player.userId,
                                player.name,
                                player.email,
                                player.number
                            ]);

                        }
                    );

                }

            }
        );


        // ========================================================
        // COLUMN WIDTHS
        // ========================================================

        worksheet.columns = [

            {
                key: "team",
                width: 15
            },

            {
                key: "role",
                width: 15
            },

            {
                key: "rollNo",
                width: 15
            },

            {
                key: "name",
                width: 25
            },

            {
                key: "email",
                width: 35
            },

            {
                key: "phone",
                width: 18
            }

        ];


        // ========================================================
        // BORDERS
        // ========================================================

        worksheet.eachRow(
            (row, rowNumber) => {

                if (rowNumber >= 4) {

                    row.eachCell(
                        (cell) => {

                            cell.border = {

                                top: {
                                    style: "thin"
                                },

                                left: {
                                    style: "thin"
                                },

                                bottom: {
                                    style: "thin"
                                },

                                right: {
                                    style: "thin"
                                }

                            };

                        }
                    );

                }

            }
        );


        // ========================================================
        // FREEZE HEADER
        // ========================================================

        worksheet.views = [
            {
                state: "frozen",
                ySplit: 4
            }
        ];


        // ========================================================
        // FILTER
        // ========================================================

        worksheet.autoFilter = {
            from: "A4",
            to: "F4"
        };


        // ========================================================
        // FILE NAME
        // ========================================================

        const safeName = event.name
            .replace(/[^a-z0-9]/gi, "_")
            .replace(/_+/g, "_");

        const filename =
            `${safeName}_Registrations.xlsx`;


        // ========================================================
        // RESPONSE HEADERS
        // ========================================================

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );


        // ========================================================
        // WRITE EXCEL
        // ========================================================

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.error(
            "Excel generation error:",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({
                success: false,
                message: "Failed to generate Excel",
                error: error.message
            });

        }

    }

};



// ============================================================
// EXPORT
// ============================================================

module.exports = {
    getEventRegistrations,
    downloadEventRegistrationsExcel
};