"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const item_1 = __importDefault(require("./item"));
const ProductOptionSchema = new mongoose_1.Schema({
    optionCategory: { type: String, required: true },
    optionName: { type: String, required: true },
});
// Product Discriminator
const ProductSchema = new mongoose_1.Schema({
    price: { type: Number, required: true },
    availableOnline: { type: Boolean, default: false },
    productUrl: { type: String },
    ships: { type: Boolean, default: false },
    pickupAvailable: { type: Boolean, default: false },
    inShopOnly: { type: Boolean, default: false },
});
const Product = item_1.default.discriminator("Product", ProductSchema);
exports.default = Product;
