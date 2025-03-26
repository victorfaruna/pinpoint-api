"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const location_1 = require("../controllers/location");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
// Use memory storage for multer
const storage = multer_1.default.memoryStorage();
// Multer config
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});
// Create a new location
router.post("/", upload.array("media"), (0, auth_1.auth)(), location_1.createLocation);
router.post("/:locationId/follow", (0, auth_1.auth)(), location_1.followLocation);
// Get all locations
router.get("/user", (0, auth_1.auth)(), location_1.getUserAllLocations);
router.get("/nearby", (0, auth_1.auth)(), location_1.getNearbyLocations);
// Get a location by ID
router.get("/:id", location_1.getLocationById);
// Update a location by ID
router.put("/:id", (0, auth_1.auth)(), location_1.updateLocation);
// Delete a location by ID
router.delete("/:id", (0, auth_1.auth)(), location_1.deleteLocation);
exports.default = router;
