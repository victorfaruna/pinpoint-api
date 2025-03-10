import { Response } from "express";
import Location, { LocationDocument } from "../models/location";
import { validationResult } from "express-validator";
import { CustomRequest } from "../middleware/auth";
import { deleteMediaFromSupabase, uploadMediaToSupabase } from "../utils/media";
import Service from "../models/service";
import Product from "../models/product";
import mongoose, { ObjectId } from "mongoose";
import User from "../models/user";

// Create a new Location
export const createLocation = async (req: CustomRequest, res: Response) => {
  const partnerId = req.user!._id;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const {
    locationName,
    address,
    description,
    categories,
    hoursOfOperation,
    menu,
    coordinates,
    poll,
  } = req.body;

  try {
    const parseJSONField = (field: any, fieldName: string) => {
      if (typeof field === "string") {
        try {
          const parsedField = JSON.parse(field);
          return parsedField;
        } catch (error) {
          throw new Error(
            `Invalid format for ${fieldName}. Expected a valid JSON object or array.`
          );
        }
      }
      return field;
    };

    const parsedHoursOfOperation = parseJSONField(
      hoursOfOperation,
      "hoursOfOperation"
    );
    const parsedMenu = parseJSONField(menu, "menu");
    const parsedPoll = parseJSONField(poll, "poll");
    const parsedCategories = parseJSONField(categories, "categories");
    const parsedCoordinates = parseJSONField(coordinates, "coordinates");

    // Parse coordinates (should be an object with latitude and longitude)
    if (
      !parsedCoordinates ||
      !parsedCoordinates.latitude ||
      !parsedCoordinates.longitude
    ) {
      res.status(400).json({ message: "Invalid coordinates provided" });
      return;
    }

    // Convert parsedCoordinates into GeoJSON format for MongoDB geospatial queries
    const geoCoordinates = {
      type: "Point",
      coordinates: [parsedCoordinates.longitude, parsedCoordinates.latitude],
    };

    // Handle media files (if any)
    const mediaUploadPromises: Promise<any>[] = [];
    console.log(req.files);
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
        mediaUploadPromises.push(
          uploadMediaToSupabase(file.buffer, file.filename, mediaType)
        );
      }
    }

    // Wait for all media to be uploaded (if applicable)
    const mediaUploadResults = await Promise.all(mediaUploadPromises);

    // Create the location object and save it
    const location = new Location({
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

    await location.save();

    res
      .status(201)
      .json({ message: "Location created successfully", location });
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get all Locations
export const getUserAllLocations = async (
  req: CustomRequest,
  res: Response
) => {
  const partnerId = req.user!._id;
  try {
    const locations = await Location.find({ partnerId });
    res.status(200).json(locations);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get Nearby Locations with optional filters
export const getNearbyLocations = async (req: CustomRequest, res: Response) => {
  try {
    const { latitude, longitude, radius, category, businessType } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        message: "Please provide both latitude and longitude",
      });
      return;
    }

    const userLatitude = parseFloat(latitude as string);
    const userLongitude = parseFloat(longitude as string);
    const searchRadius = radius ? parseFloat(radius as string) : undefined;

    const userLocation = {
      type: "Point",
      coordinates: [userLongitude, userLatitude],
    };

    // Build the query to find nearby locations
    const query: any = {
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

    let locations: LocationDocument[] = await Location.find(
      searchRadius ? query : {}
    );

    // Filter by businessType (service, product, or both) if provided
    if (businessType) {
      let locationIds: string[] = [];

      if (businessType === "service" || businessType === "both") {
        // Get locations that are linked to services
        const services = await Service.find({
          location: { $in: locations.map((l) => l._id) },
        }).select("locations");
        locationIds.push(
          ...services.flatMap(
            (service) => service.location as unknown as string
          )
        );
      }

      if (businessType === "product" || businessType === "both") {
        // Get locations that are linked to products
        const products = await Product.find({
          location: { $in: locations.map((l) => l._id) },
        }).select("locations");
        locationIds.push(
          ...products.flatMap(
            (product) => product.location as unknown as string
          )
        );
      }

      // Filter locations based on the selected location IDs
      locations = locations.filter((location) =>
        locationIds.includes((location._id as any).toString())
      );
    }

    // If no radius is provided, fetch all locations
    if (!searchRadius) {
      const allLocations = await Location.find();
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
  } catch (error) {
    console.error("Error fetching nearby locations:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get a single Location by ID
export const getLocationById = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;

  try {
    const location = await Location.findById(id).populate(
      "partnerId",
      "username"
    );
    if (!location) {
      res.status(404).json({ message: "Location not found" });
      return;
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Update a Location
export const updateLocation = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const {
    locationName,
    address,
    description,
    categories,
    hoursOfOperation,
    menu,
    coordinates,
    poll,
  } = req.body;

  try {
    const location = await Location.findById(id);
    if (!location) {
      res.status(404).json({ message: "Location not found" });
      return;
    }

    // Check if the user is the owner of the location
    if (location.partnerId.toString() !== req.user!._id.toString()) {
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

    await location.save();
    res
      .status(200)
      .json({ message: "Location updated successfully", location });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const deleteLocation = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;

  try {
    const location = await Location.findById(id);
    if (!location) {
      res.status(404).json({ message: "Location not found" });
      return;
    }

    // Check if the user is the owner of the location
    if (location.partnerId.toString() !== req.user!._id.toString()) {
      res
        .status(403)
        .json({ message: "You are not authorized to delete this location" });
      return;
    }

    if (location.images && location.images.length > 0) {
      await Promise.all(
        location.images.map(async (media) => {
          await deleteMediaFromSupabase(media); // Function to delete the file from S3
        })
      );
    }

    await location.deleteOne();
    res.status(200).json({ message: "Location deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const followLocation = async (req: CustomRequest, res: Response) => {
  const { locationId } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(locationId)) {
    res.status(400).json({ error: "Invalid location ID." });
    return;
  }

  try {
    const location = await Location.findById(locationId);
    if (!location) {
      res.status(404).json({ error: "Location not found." });
      return;
    }

    const user: any = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const isFollowing = location.followers.includes(
      userId as unknown as ObjectId
    );

    if (isFollowing) {
      // Unfollow: Remove the user from followers
      location.followers = location.followers.filter(
        (followerId) => followerId !== (userId as unknown as ObjectId)
      );
      user.followingStores = user.followingStores.filter(
        (followerId: any) => followerId !== location._id
      );

      await location.save();
      await user.save();

      res.status(200).json({
        message: "Successfully unfollowed the location.",
        locationId,
        followerCount: location.followers.length,
      });
    } else {
      // Follow: Add the user to followers
      location.followers.push(userId as unknown as ObjectId);
      user.followingStores.push(location._id);

      await location.save();
      await user.save();

      res.status(200).json({
        message: "Successfully followed the location.",
        locationId,
        followerCount: location.followers.length,
      });
    }
  } catch (error) {
    console.error("Error following location:", error);
    res
      .status(500)
      .json({ error: "An error occurred while following the location." });
  }
};
