
const cron = require("node-cron");
const { DateTime } = require("luxon");
const EventModel = require("../Models/EventModel");

const TIME_ZONE = "Asia/Kolkata";

async function updateEventStatuses() {
    const now = DateTime.now().setZone(TIME_ZONE);

    try {
        const events = await EventModel.find({
            status: { $ne: "cancelled" }
        });

        for (const event of events) {
            const date =
                event.eventDate instanceof Date
                    ? DateTime.fromJSDate(event.eventDate, {
                          zone: TIME_ZONE
                      }).toISODate()
                    : String(event.eventDate).slice(0, 10);

            const start = DateTime.fromISO(
                `${date}T${event.startTime}`,
                { zone: TIME_ZONE }
            );

            const end = DateTime.fromISO(
                `${date}T${event.endTime}`,
                { zone: TIME_ZONE }
            );

            if (!start.isValid || !end.isValid) {
                console.log("Invalid event date/time:", event.title);
                continue;
            }

            let status;

            if (now < start) {
                status = "upcoming";
            } else if (now < end) {
                status = "ongoing";
            } else {
                status = "completed";
            }

            if (event.status !== status) {
                event.status = status;
                await event.save();
            }

            console.log(`${event.title} => ${status}`);
        }

        console.log(
            `[${now.toISO()}] Event statuses updated successfully`
        );
    } catch (error) {
        console.error("Event status update failed:", error);
    }
}

function startEventStatusJob() {
    cron.schedule(
        "* * * * *",
        updateEventStatuses,
        { timezone: TIME_ZONE }
    );

    // Update statuses immediately when the server starts.
    updateEventStatuses();
}

module.exports = {
    startEventStatusJob,
    updateEventStatuses
};