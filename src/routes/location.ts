import express from "express";
import {
  createLocation,
  getUserAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  getNearbyLocations,
  followLocation,
} from "../controllers/location";
import { auth } from "../middleware/auth";
import multer from "multer";

const router = express.Router();

// Use memory storage for multer
const storage = multer.memoryStorage();

// Multer config
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Create a new location
router.post("/", upload.array("media"), auth(), createLocation);
router.post("/:locationId/follow", auth(), followLocation);

// Get all locations
router.get("/user", auth(), getUserAllLocations);

router.get("/nearby", auth(), getNearbyLocations);

// Get a location by ID
router.get("/:id", getLocationById);

// Update a location by ID
router.put("/:id", auth(), updateLocation);

// Delete a location by ID
router.delete("/:id", auth(), deleteLocation);

export default router;
