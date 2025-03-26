"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const item_1 = __importDefault(require("./item"));
const PriceRangeSchema = new mongoose_1.Schema({
    from: { type: Number },
    to: { type: Number },
});
// Service Discriminator
const ServiceSchema = new mongoose_1.Schema({
    priceType: { type: String, enum: ["flat", "range"], required: true },
    price: { type: Number },
    priceRange: PriceRangeSchema,
    duration: { type: String, required: true },
    homeService: { type: Boolean, default: false },
    serviceRadius: { type: String },
});
const Service = item_1.default.discriminator("Service", ServiceSchema);
exports.default = Service;
