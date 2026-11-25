
const EventModel = require("../Models/EventModel");
const Registerevent = require("../Models/RegisterEvent");

exports.createEvent = async (req, res) => {
    try {
        const body = req.body;
        const file = req.file;

        console.log("BODY:", body);
        console.log("FILE:", file);

        if (
            !body.title ||
            !body.description ||
            !body.eventDate ||
            !body.startTime ||
            !body.endTime ||
            !body.venue ||
            !body.organizer ||
            !body.maxParticipants ||
            !body.createdBy ||
            !body.registrationDeadline ||
            !file
        ) {
            return res.status(400).json({
                message: "All Fields Are Required"
            });
        }

        const isValidDate = (value) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
                return false;
            }

            const date = new Date(`${value}T00:00:00Z`);

            return (
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        };

        if (
            !isValidDate(body.eventDate) ||
            !isValidDate(body.registrationDeadline)
        ) {
            return res.status(400).json({
                message: "Please enter valid dates in YYYY-MM-DD format"
            });
        }

        const maxParticipants = Number(body.maxParticipants);

        if (
            !Number.isInteger(maxParticipants) ||
            maxParticipants <= 0
        ) {
            return res.status(400).json({
                message: "Max participants must be a positive integer"
            });
        }

        await EventModel.create({
            title: body.title,
            description: body.description,
            category: body.category,
            eventType: body.eventType,
            eventDate: body.eventDate,
            startTime: body.startTime,
            endTime: body.endTime,
            venue: body.venue,
            organizer: body.organizer,
            registrationRequired:
                body.registrationRequired === "true" ||
                body.registrationRequired === true,
            image: `events/${file.filename}`,
            maxParticipants: maxParticipants,
            registrationDeadline: body.registrationDeadline,
            createdBy: body.createdBy
        });

        return res.json({
            message: "Event Created Successfully"
        });

    } catch (error) {
        console.log("CREATE EVENT ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// Get All Events
exports.allEvent = async (req, res) => {
    try {
        const events = await EventModel.find().populate("createdBy");

        return res.json(events);

    } catch (error) {
        console.log("ALL EVENT ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const id = req.params.id;

        const event = await EventModel.findById(id);

        if (!event) {
            return res.status(404).json({
                message: "Event Not Found"
            });
        }

        if (
            event.status !== "completed" &&
            event.status !== "ongoing" &&
            event.status !== "cancelled"
        ) {
            await EventModel.findByIdAndDelete(id);

            return res.json({
                message: "Event Deleted Successfully"
            });
        }

        return res.status(400).json({
            message: "Cannot Delete This Event"
        });

    } catch (error) {
        console.log("DELETE EVENT ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// Register Event
exports.registerEvent = async (req, res) => {
    try {
        const eventId = req.body.eventId;
        const userId = req.body.userId;

        if (!eventId || !userId) {
            return res.status(400).json({
                message: "Event ID and User ID are required"
            });
        }

        if (
            !/^[0-9a-fA-F]{24}$/.test(eventId) ||
            !/^[0-9a-fA-F]{24}$/.test(userId)
        ) {
            return res.status(400).json({
                message: "Invalid Event ID or User ID"
            });
        }

        const event = await EventModel.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event Not Found"
            });
        }

        const isRegister = await Registerevent.findOne({
            eventId: eventId,
            userId: userId
        });

        if (isRegister) {
            return res.json({
                message: "You Are Already Register For The Event"
            });
        }

        const maxParticipants = Number(event.maxParticipants);

        const totalRegister = await Registerevent.countDocuments({
            eventId: eventId
        });

        if (totalRegister >= maxParticipants) {
            return res.status(400).json({
                message: "Total Seat Filledup"
            });
        }

        await Registerevent.create({
            eventId: eventId,
            userId: userId
        });

        return res.json({
            message: "Successfully Register For The Event"
        });

    } catch (error) {
        console.log("REGISTER EVENT ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};

exports.getRegisteredStudentsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await Registerevent.find({ eventId })
      .populate("userId", "name email")
      .sort({ registeredAt: -1 });

    res.status(200).json({
      count: registrations.length,
      students: registrations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch registered students",
    });
  }
};


// Add this function below your existing controllers
exports.myRegisteredEvents = async (req, res) => {
  try {
    const userid = req.params.userid;

    const registrations = await Registerevent.find({
      userId: userid
    })
      .populate("eventId")
      .sort({ registeredAt: -1 });

    return res.status(200).json(registrations);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch registered events"
    });
  }
};




