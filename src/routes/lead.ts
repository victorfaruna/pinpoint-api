import { Router } from "express";
import {
  addNoteToLead,
  createLead,
  getLeadById,
  getLeadByItem,
  getPartnerLeads,
  getUserLeads,
  submitReview,
  updateLeadStatus,
} from "../controllers/lead";
import { leadValidation } from "../utils/validations";
import { auth } from "../middleware/auth";
import { check } from "express-validator";
import multer from "multer";
import path from "path";

const router = Router();

const storage = multer.memoryStorage();

// Multer config
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", auth(), getUserLeads);
router.get("/partner", auth(), getPartnerLeads);
router.get("/:id", auth(), getLeadById);
router.get("/item/:id", auth(), getLeadByItem);

router.post(
  "/",
  auth(),
  // leadValidation,
  upload.array("media"),
  createLead
);
router.post("/:id/review", auth(), upload.array("media"), submitReview);
router.put("/:leadId/status", auth(), updateLeadStatus);
router.put(
  "/:leadId/note",
  auth(),
  [check("note").notEmpty().withMessage("Note is required")],
  addNoteToLead
);

export default router;
