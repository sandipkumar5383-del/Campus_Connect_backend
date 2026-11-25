const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: [
        "Technical",
        "Cultural",
        "Sports",
        "Workshop",
        "Seminar",
        "Other"
      ],
      required: true
    },

    eventType: {
      type: String,
      enum: ["College", "Department", "Club"],
      required: true
    },

    eventDate: {
      type: Date,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },

    startTime: {
      type: String,
      required: true
    },

    endTime: {
      type: String,
      required: true
    },

    venue: {
      type: String,
      required: true
    },

    organizer: {
      type: String,
      required: true
    },

    image: {
      type: String,
      default: ""
    },

    registrationRequired: {
      type: Boolean,
      default: true
    },

    registrationDeadline: {
      type: Date,
      required:true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },

    maxParticipants: {
      type: Number
    },

    status: {
      type: String,
      enum: [
        "upcoming",
        "ongoing",
        "completed",
        "cancelled"
      ],
      default: "upcoming"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Event", eventSchema);