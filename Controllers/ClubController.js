
const Club = require("../Models/ClubModel");
const mongoose = require("mongoose");
const Report = require("../Models/ReportModel");

exports.createClub = async (req, res) => {
  try {
    const {
      clubName,
      description,
      category,
      rules,
      createdBy
    } = req.body;

    // Validate required fields
    if (!clubName || !description || !category || !createdBy) {
      return res.status(400).json({
        message: "All required fields are required"
      });
    }

    // Validate MongoDB user ID
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        message: "Invalid student ID"
      });
    }

    // Check if club already exists
    const existingClub = await Club.findOne({
      clubName: {
        $regex:
          "^" +
          clubName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "$",
        $options: "i"
      },
      status: "active"
    });

    if (existingClub) {
      return res.status(409).json({
        message: "A club with this name already exists"
      });
    }

    // Create club
    const club = await Club.create({
      clubName: clubName.trim(),
      description: description,
      category: category,
      rules: rules || "",
      image: req.file ? `/clubs/${req.file.filename}` : "",
      createdBy: createdBy,
      members: [createdBy],
      status: "active"
    });

    return res.status(201).json({
      message: "Club created successfully",
      club: club
    });

  } catch (error) {
    console.error("Create Club Error:", error);

    return res.status(500).json({
      message: "Unable to create club",
      error: error.message
    });
  }
};


exports.allClub = async (req, res) => {
    try {
        const clubs = await Club.find()
            .populate("createdBy", "name email")
            .populate("members", "name");

        const clubList = await Promise.all(
            clubs.map(async (club) => {
                const reportCount = await Report.countDocuments({
                    clubId: club._id
                });

                return {
                    ...club.toObject(),
                    reports: reportCount
                };
            })
        );

        return res.status(200).json({
            success: true,
            clubs: clubList
        });

    } catch (error) {
        console.error("ALL CLUB ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch clubs",
            error: error.message
        });
    }
};
exports.viewClub = async (req, res) => {
  try {
    const { id } = req.params;

    const club = await Club.findById(id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!club) {
      return res.status(404).json({
        message: "Club not found"
      });
    }

    return res.status(200).json(club);

  } catch (error) {
    console.error("View club error:", error);

    return res.status(500).json({
      message: "Failed to fetch club"
    });
  }
};

exports.joinClub = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Valid user ID is required"
      });
    }

    if (role !== "student") {
      return res.status(403).json({
        message: "Only students can join clubs"
      });
    }

    const club = await Club.findOne({
      _id: id,
      status: "active"
    });

    if (!club) {
      return res.status(404).json({
        message: "Club not found"
      });
    }

    if (club.createdBy.toString() === userId) {
      return res.status(400).json({
        message: "You cannot join your own club"
      });
    }

    if (club.members.some(member => member.toString() === userId)) {
      return res.status(409).json({
        message: "You have already joined this club"
      });
    }

    await Club.findByIdAndUpdate(
      id,
      {
        $addToSet: { members: userId }
      },
      { new: true }
    );

    const updatedClub = await Club.findById(id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    return res.status(200).json({
      message: "Successfully joined the club",
      club: updatedClub
    });

  } catch (error) {
    console.error("Join club error:", error);

    return res.status(500).json({
      message: "Unable to join club",
      error: error.message
    });
  }
};



exports.deleteClub = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent undefined req.body error
        const { userId, role, deletionReason } = req.body || {};

        // Validate club ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid club ID"
            });
        }

        // Validate user ID
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Valid user ID is required"
            });
        }

        // Validate deletion reason
        if (!deletionReason || !deletionReason.trim()) {
            return res.status(400).json({
                message: "Please enter a deletion reason"
            });
        }

        // Find active club
        const club = await Club.findOne({
            _id: id,
            status: "active"
        });

        if (!club) {
            return res.status(404).json({
                message: "Club not found"
            });
        }

        // Check permissions
        const isAdmin = role === "admin";

        const isCreator =
            club.createdBy &&
            club.createdBy.toString() === userId.toString();

        if (!isAdmin && !(role === "student" && isCreator)) {
            return res.status(403).json({
                message: "You are not allowed to delete this club"
            });
        }

        // Save deletion details
        club.status = "deleted";
        club.deletedBy = userId;
        club.deletionReason = deletionReason.trim();
        club.deletedAt = new Date();

        await club.save();

        return res.status(200).json({
            success: true,
            message: "Club deleted successfully"
        });

    } catch (error) {
        console.error("Delete club error:", error);

        return res.status(500).json({
            message: "Unable to delete club",
            error: error.message
        });
    }
};

exports.leaveClub = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const { id } = req.params;

        if (!userId || !role) {
            return res.status(400).json({
                message: "User ID and role are required"
            });
        }

        if (role !== "student") {
            return res.status(403).json({
                message: "Only students can leave clubs"
            });
        }

        const club = await Club.findById(id);

        if (!club || club.status !== "active") {
            return res.status(404).json({
                message: "Active club not found"
            });
        }

        // Creator cannot leave their own club
        if (club.createdBy.toString() === userId) {
            return res.status(400).json({
                message: "Club creator cannot leave their own club"
            });
        }

        // Check whether student is a member
        const isMember = club.members.some(
            member => member.toString() === userId
        );

        if (!isMember) {
            return res.status(400).json({
                message: "You have not joined this club"
            });
        }

        // Remove student from members array
        club.members = club.members.filter(
            member => member.toString() !== userId
        );

        await club.save();

        // Return updated club details
        const updatedClub = await Club.findById(id)
            .populate("createdBy", "name email")
            .populate("members", "name email");

        res.status(200).json({
            message: "You have successfully left the club!",
            club: updatedClub
        });

    } catch (error) {
        console.error("Leave club error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};
exports.reportClub=async(req,res)=>{
  try{
  const {clubId,studentId,ReportMessage}=req.body;
  if(!mongoose.Types.ObjectId.isValid(clubId)||!mongoose.Types.ObjectId.isValid(studentId)){
    return res.status(400).json({message:"Invalid club or student ID"});
  }
  if(!ReportMessage||!ReportMessage.trim()){
    return res.status(400).json({message:"Report message is required"});
  }
  const club=await Club.findById(clubId);
  if(!club||club.status!=="active"){
    return res.status(404).json({message:"Active club not found"});
  }
  await Report.create({clubId,studentId,ReportMessage:ReportMessage.trim()});
  return res.status(201).json({message:"Report submitted successfully"});
  }catch(error){
    console.error("Report club error:",error);
    return res.status(500).json({message:"Unable to submit report",error:error.message});
  }
};

exports.fetchAllClubs = async (req, res) => {
  try {
    // Fetch all active clubs
    const clubs = await Club.find({
      status: "active"
    })
      .populate("createdBy", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch report counts club-wise
    const reportCounts = await Report.aggregate([
      {
        $group: {
          _id: "$clubId",
          totalReports: { $sum: 1 }
        }
      }
    ]);

    // Convert report counts into a map
    const reportMap = {};

    reportCounts.forEach((report) => {
      reportMap[report._id.toString()] = report.totalReports;
    });

    // Attach report count to each club
    const clubsWithReports = clubs.map((club) => ({
      ...club,
      totalReports: reportMap[club._id.toString()] || 0
    }));

    return res.status(200).json({
      message: "Clubs fetched successfully",
      clubs: clubsWithReports
    });

  } catch (error) {
    console.error("Get clubs error:", error);

    return res.status(500).json({
      message: "Unable to fetch clubs"
    });
  }
};

