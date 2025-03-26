"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const content_1 = require("../controllers/content");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/location/:locationId", content_1.getContentByLocation);
router.get("/user/:userId", content_1.getContentByUser);
router.post("/:id/like", (0, auth_1.auth)(), content_1.likeContent);
exports.default = router;
