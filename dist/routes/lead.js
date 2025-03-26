"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_1 = require("../controllers/lead");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
// Multer config
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});
router.get("/", (0, auth_1.auth)(), lead_1.getUserLeads);
router.get("/partner", (0, auth_1.auth)(), lead_1.getPartnerLeads);
router.get("/:id", (0, auth_1.auth)(), lead_1.getLeadById);
router.get("/item/:id", (0, auth_1.auth)(), lead_1.getLeadByItem);
router.post("/", (0, auth_1.auth)(), 
// leadValidation,
upload.array("media"), lead_1.createLead);
router.post("/:id/review", (0, auth_1.auth)(), upload.array("media"), lead_1.submitReview);
router.put("/:leadId/status", (0, auth_1.auth)(), lead_1.updateLeadStatus);
router.put("/:leadId/note", (0, auth_1.auth)(), [(0, express_validator_1.check)("note").notEmpty().withMessage("Note is required")], lead_1.addNoteToLead);
exports.default = router;
