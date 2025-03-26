"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followLocation = exports.deleteLocation = exports.updateLocation = exports.getLocationById = exports.getNearbyLocations = exports.getUserAllLocations = exports.createLocation = void 0;
const location_1 = __importDefault(require("../models/location"));
const express_validator_1 = require("express-validator");
const media_1 = require("../utils/media");
const service_1 = __importDefault(require("../models/service"));
const product_1 = __importDefault(require("../models/product"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("../models/user"));
const supabase_1 = __importDefault(require("../config/supabase"));
// Create a new Location
const createLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const partnerId = req.user._id;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { locationName, address, description, categories, hoursOfOperation, menu, coordinates, poll, } = req.body;
    try {
        const parseJSONField = (field, fieldName) => {
            if (typeof field === "string") {
                try {
                    const parsedField = JSON.parse(field);
                    return parsedField;
                }
                catch (error) {
                    throw new Error(`Invalid format for ${fieldName}. Expected a valid JSON object or array.`);
                }
            }
            return field;
        };
        const parsedHoursOfOperation = parseJSONField(hoursOfOperation, "hoursOfOperation");
        const parsedMenu = parseJSONField(menu, "menu");
        const parsedPoll = parseJSONField(poll, "poll");
        const parsedCategories = parseJSONField(categories, "categories");
        const parsedCoordinates = parseJSONField(coordinates, "coordinates");
        // Parse coordinates (should be an object with latitude and longitude)
        if (!parsedCoordinates ||
            !parsedCoordinates.latitude ||
            !parsedCoordinates.longitude) {
            res.status(400).json({ message: "Invalid coordinates provided" });
            return;
        }
        // Convert parsedCoordinates into GeoJSON format for MongoDB geospatial queries
        const geoCoordinates = {
            type: "Point",
            coordinates: [parsedCoordinates.longitude, parsedCoordinates.latitude],
        };
        // Handle media files (if any)
        const mediaUploadPromises = [];
        console.log(req.files);
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
                mediaUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
            }
        }
        // Wait for all media to be uploaded (if applicable)
        const mediaUploadResults = yield Promise.all(mediaUploadPromises);
        // Create the location object and save it
        const location = new location_1.default({
            partnerId,
            images: mediaUploadResults.map((media) => media.url),
            locationName,
            address,
            description,
            categories: parsedCategories,
            hoursOfOperation: parsedHoursOfOperation,
            menu: parsedMenu,
            coordinates: geoCoordinates,
            poll: parsedPoll,
        });
        yield location.save();
        res
            .status(201)
            .json({ message: "Location created successfully", location });
    }
    catch (error) {
        console.error("Error creating location:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.createLocation = createLocation;
// Get all Locations
const getUserAllLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const partnerId = req.user._id;
    try {
        const { data: locations, error: findError } = yield supabase_1.default
            .from("locations")
            .select("*")
            .eq("partnerId", partnerId);
        // if (findError) {
        //   res.status(500).json({ message: "Internal server error" });
        //   return;
        // }
        res.status(200).json(locations);
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getUserAllLocations = getUserAllLocations;
// Get Nearby Locations with optional filters
const getNearbyLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { latitude, longitude, radius, category, businessType } = req.query;
        if (!latitude || !longitude) {
            res.status(400).json({
                message: "Please provide both latitude and longitude",
            });
            return;
        }
        const userLatitude = parseFloat(latitude);
        const userLongitude = parseFloat(longitude);
        const searchRadius = radius ? parseFloat(radius) : undefined;
        const userLocation = {
            type: "Point",
            coordinates: [userLongitude, userLatitude],
        };
        // Build the query to find nearby locations
        const query = {
            coordinates: {
                $near: {
                    $geometry: userLocation,
                    $maxDistance: searchRadius,
                },
            },
        };
        if (category) {
            query.categories = { $in: [category] };
        }
        let locations = yield location_1.default.find(searchRadius ? query : {});
        // Filter by businessType (service, product, or both) if provided
        if (businessType) {
            let locationIds = [];
            if (businessType === "service" || businessType === "both") {
                // Get locations that are linked to services
                const services = yield service_1.default.find({
                    location: { $in: locations.map((l) => l._id) },
                }).select("locations");
                locationIds.push(...services.flatMap((service) => service.location));
            }
            if (businessType === "product" || businessType === "both") {
                // Get locations that are linked to products
                const products = yield product_1.default.find({
                    location: { $in: locations.map((l) => l._id) },
                }).select("locations");
                locationIds.push(...products.flatMap((product) => product.location));
            }
            // Filter locations based on the selected location IDs
            locations = locations.filter((location) => locationIds.includes(location._id.toString()));
        }
        // If no radius is provided, fetch all locations
        if (!searchRadius) {
            const allLocations = yield location_1.default.find();
            res.status(200).json({
                message: "All locations fetched successfully",
                locations: allLocations,
            });
            return;
        }
        // Return the filtered results
        res.status(200).json({
            message: "Nearby locations fetched successfully",
            locations,
        });
    }
    catch (error) {
        console.error("Error fetching nearby locations:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getNearbyLocations = getNearbyLocations;
// Get a single Location by ID
const getLocationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const location = yield location_1.default.findById(id).populate("partnerId", "username");
        if (!location) {
            res.status(404).json({ message: "Location not found" });
            return;
        }
        res.status(200).json(location);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getLocationById = getLocationById;
// Update a Location
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { locationName, address, description, categories, hoursOfOperation, menu, coordinates, poll, } = req.body;
    try {
        const location = yield location_1.default.findById(id);
        if (!location) {
            res.status(404).json({ message: "Location not found" });
            return;
        }
        // Check if the user is the owner of the location
        if (location.partnerId.toString() !== req.user._id.toString()) {
            res
                .status(403)
                .json({ message: "You are not authorized to update this location" });
            return;
        }
        // Update the location fields
        location.locationName = locationName || location.locationName;
        location.address = address || location.address;
        location.description = description || location.description;
        location.categories = categories || location.categories;
        location.hoursOfOperation = hoursOfOperation || location.hoursOfOperation;
        location.menu = menu || location.menu;
        location.coordinates = coordinates || location.coordinates;
        location.poll = poll || location.poll;
        yield location.save();
        res
            .status(200)
            .json({ message: "Location updated successfully", location });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.updateLocation = updateLocation;
const deleteLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const location = yield location_1.default.findById(id);
        if (!location) {
            res.status(404).json({ message: "Location not found" });
            return;
        }
        // Check if the user is the owner of the location
        if (location.partnerId.toString() !== req.user._id.toString()) {
            res
                .status(403)
                .json({ message: "You are not authorized to delete this location" });
            return;
        }
        if (location.images && location.images.length > 0) {
            yield Promise.all(location.images.map((media) => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, media_1.deleteMediaFromSupabase)(media); // Function to delete the file from S3
            })));
        }
        yield location.deleteOne();
        res.status(200).json({ message: "Location deleted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.deleteLocation = deleteLocation;
const followLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { locationId } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(locationId)) {
        res.status(400).json({ error: "Invalid location ID." });
        return;
    }
    try {
        const location = yield location_1.default.findById(locationId);
        if (!location) {
            res.status(404).json({ error: "Location not found." });
            return;
        }
        const user = yield user_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found." });
            return;
        }
        const isFollowing = location.followers.includes(userId);
        if (isFollowing) {
            // Unfollow: Remove the user from followers
            location.followers = location.followers.filter((followerId) => followerId !== userId);
            user.followingStores = user.followingStores.filter((followerId) => followerId !== location._id);
            yield location.save();
            yield user.save();
            res.status(200).json({
                message: "Successfully unfollowed the location.",
                locationId,
                followerCount: location.followers.length,
            });
        }
        else {
            // Follow: Add the user to followers
            location.followers.push(userId);
            user.followingStores.push(location._id);
            yield location.save();
            yield user.save();
            res.status(200).json({
                message: "Successfully followed the location.",
                locationId,
                followerCount: location.followers.length,
            });
        }
    }
    catch (error) {
        console.error("Error following location:", error);
        res
            .status(500)
            .json({ error: "An error occurred while following the location." });
    }
});
exports.followLocation = followLocation;
