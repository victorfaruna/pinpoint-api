"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_1 = require("../controllers/media");
const router = (0, express_1.Router)();
router.get("/:key", media_1.downloadMedia);
exports.default = router;
