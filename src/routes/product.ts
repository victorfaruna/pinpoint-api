import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsForLocation,
  submitReview,
  updateProduct,
} from "../controllers/product";
import {
  productReviewValidation,
  productValidation,
} from "../utils/validations";
import { auth } from "../middleware/auth";
import multer from "multer";
import path from "path";

const router = Router();

const storage = multer.memoryStorage();

// Multer config
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
});

router.get("/", getAllProducts);

router.get("/:id", getProductById);
router.get("/location/:locationId", getProductsForLocation);

router.post(
  "/",
  auth(),
  // productValidation,
  upload.array("media"),
  createProduct
);

router.post("/:id/review", auth(), productReviewValidation, submitReview);

router.put("/:id", auth(), productValidation, updateProduct);

router.delete("/:id", auth(), deleteProduct);

export default router;
