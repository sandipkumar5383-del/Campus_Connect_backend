const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "./events");
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }

});
const uploadEvent = multer({ storage });
module.exports = uploadEvent;