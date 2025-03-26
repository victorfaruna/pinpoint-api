"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controllers/user");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
// Multer config
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});
// Get logged-in user data route
router.get("/profile", (0, auth_1.auth)(), user_1.getUserData);
router.put("/", (0, auth_1.auth)(), upload.array("media"), user_1.updateUserData);
router.delete("/", (0, auth_1.auth)(), user_1.deleteAccount);
exports.default = router;
