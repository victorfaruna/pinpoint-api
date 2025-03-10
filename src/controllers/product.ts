import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Product from "../models/product";
import { CustomRequest } from "../middleware/auth";
import { deleteMediaFromSupabase, uploadMediaToSupabase } from "../utils/media";
import { ObjectId } from "mongoose";

// Create Product Controller
export const createProduct = async (req: CustomRequest, res: Response) => {
  const userId = req.user?._id;
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    });
    // return;
  }
  try {
    const imageUploadPromises: Promise<any>[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
        imageUploadPromises.push(
          uploadMediaToSupabase(file.buffer, file.filename, mediaType)
        );
      }
    }

    const imageUploadResults = await Promise.all(imageUploadPromises);
    console.log(imageUploadResults);

    const {
      name,
      description,
      price,
      location,
      mainCategory,
      category,
      subCategory,
      options,
      availableOnline,
      productUrl,
      ships,
      pickupAvailable,
      inShopOnly,
    } = req.body;

    // Create a new Product instance
    const newProduct = new Product({
      user: userId,
      name,
      description,
      price,
      images: imageUploadResults.map((image) => image.url),
      location,
      mainCategory,
      category,
      subCategory,
      options,
      availableOnline,
      productUrl,
      ships,
      pickupAvailable,
      inShopOnly,
    });

    // Save the product to the database
    const savedProduct = await newProduct.save();

    // Respond with the saved product
    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Server error while creating product",
      error: error.message,
    });
  }
};

// Update Product Controller
export const updateProduct = async (req: CustomRequest, res: Response) => {
  const userId = req.user?._id;
  const productId = req.params.id;

  const {
    name,
    description,
    price,
    location,
    mainCategory,
    category,
    existingImages,
    subCategory,
    options,
    availableOnline,
    productUrl,
    ships,
    pickupAvailable,
    inShopOnly,
  } = req.body;

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
    });
    return;
  }

  try {
    // Find the product by ID
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

    // Check if the user is the owner of the product
    if (product.user.toString() !== userId) {
      res.status(403).json({
        message: "You are not authorized to update this product",
      });
      return;
    }

    // Handle media update
    const currentImage = product.images || [];
    const newImageUrls = existingImages || [];

    // Identify media to delete
    const imageToDelete = currentImage.filter(
      (image) => !newImageUrls.includes(image)
    );

    // Delete image from S3
    await Promise.all(
      imageToDelete.map(async (image) => {
        await deleteMediaFromSupabase(image); // Function to delete the file from S3
      })
    );

    // Handle media uploads if any files are provided
    const imageUploadPromises: Promise<any>[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
        imageUploadPromises.push(
          uploadMediaToSupabase(file.buffer, file.filename, mediaType)
        );
      }
    }

    const imageUploadResults = await Promise.all(imageUploadPromises);
    const uploadedImages = imageUploadResults.map((media) => media.url);

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    if (uploadedImages.length > 0) {
      product.images = [...newImageUrls, ...uploadedImages];
    } else {
      product.images = newImageUrls;
    }
    product.location = location || product.location;
    product.mainCategory = mainCategory || product.mainCategory;
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.options = options || product.options;
    product.availableOnline =
      availableOnline !== undefined ? availableOnline : product.availableOnline;
    product.productUrl = productUrl || product.productUrl;
    product.ships = ships !== undefined ? ships : product.ships;
    product.pickupAvailable =
      pickupAvailable !== undefined ? pickupAvailable : product.pickupAvailable;
    product.inShopOnly =
      inShopOnly !== undefined ? inShopOnly : product.inShopOnly;

    // Save the updated product
    const updatedProduct = await product.save();

    // Respond with the updated product
    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    res.status(500).json({
      message: "Server error while updating product",
      error: error.message,
    });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = [],
      subCategory = [],
      minPrice,
      maxPrice,
      inShopOnly,
      availableOnline,
      options,
    } = req.query;

    // Convert page and limit to integers
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);

    // Build query for filtering
    let query: any = {};

    // Search by product name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { mainCategory: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { subCategory: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category (if it's an array)
    if (category && Array.isArray(category) && category.length > 0) {
      query.category = { $in: category }; // Matches any of the categories
    }

    // Filter by subCategory (if it's an array)
    if (subCategory && Array.isArray(subCategory) && subCategory.length > 0) {
      query.subCategory = { $in: subCategory }; // Matches any of the subcategories
    }

    if (inShopOnly) query.inShopOnly = inShopOnly === "true";
    if (availableOnline) query.availableOnline = availableOnline === "true";

    if (options) {
      const optionFilters = JSON.parse(options as string);
      query.options = { $elemMatch: optionFilters };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice); // Minimum price filter
      if (maxPrice) query.price.$lte = Number(maxPrice); // Maximum price filter
    }

    // Get total number of products that match the query
    const totalProducts = await Product.countDocuments(query);

    // Fetch paginated results with filtering, sorting, and population
    const products = await Product.find(query)
      .populate("location")
      .populate("user", "username")
      .skip((pageNumber - 1) * pageSize) // Skip for pagination
      .limit(pageSize) // Limit for pagination
      .sort({ createdAt: -1 }); // Sort by most recent products

    res.status(200).json({
      message: "Products retrieved successfully",
      products,
      pagination: {
        totalProducts,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProducts / pageSize),
        pageSize,
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Server error while fetching products",
      error: error.message,
    });
  }
};

// Controller to get all products for a specific location
export const getProductsForLocation = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;

    // Fetch products related to the locationId
    const products = await Product.find({ location: locationId });

    res.status(200).json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching products for location:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get Product by ID Controller
export const getProductById = async (req: Request, res: Response) => {
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId)
      .populate("location")
      .populate("user", "username");

    if (!product) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      message: "Product retrieved successfully",
      product,
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      message: "Server error while fetching product",
      error: error.message,
    });
  }
};

export const submitReview = async (req: CustomRequest, res: Response) => {
  const productId = req.params.id;
  const userId = req.user!._id;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
    });
    return;
  }

  const { rating, content } = req.body;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const newReview = {
      userId: userId as unknown as ObjectId,
      content,
      rating,
    };

    product.reviews?.push(newReview);

    // Recalculate the average rating
    const totalRatings = product.reviews!.reduce(
      (acc, review) => acc + review.rating,
      0
    );
    product.rating = totalRatings / product.reviews!.length;

    // Save the updated product
    await product.save();

    res.status(201).json({
      message: "Review submitted successfully",
      product,
    });
  } catch (error: any) {
    console.error("Error submitting review:", error);
    res.status(500).json({
      message: "Server error while submitting review",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req: CustomRequest, res: Response) => {
  const productId = req.params.id;
  const userId = req.user!._id;

  try {
    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

    // Check if the authenticated user is the owner of the product
    if (product.user.toString() !== userId.toString()) {
      res.status(403).json({
        message: "You are not authorized to delete this product",
      });
      return;
    }

    // Check if the authenticated user is the owner of the product
    if (product.user.toString() !== userId.toString()) {
      res.status(403).json({
        message: "You are not authorized to delete this product",
      });
      return;
    }

    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(async (image) => {
          await deleteMediaFromSupabase(image); // Function to delete the file from S3
        })
      );
    }

    await product.deleteOne();

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      message: "Server error while deleting product",
      error: error.message,
    });
  }
};
