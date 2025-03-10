import { Schema } from "mongoose";
import Item, { IItem } from "./item";

interface IProduct extends IItem {
  price: number;
  availableOnline: boolean;
  productUrl?: string;
  ships: boolean;
  pickupAvailable: boolean;
  inShopOnly: boolean;
}

const ProductOptionSchema: Schema = new Schema({
  optionCategory: { type: String, required: true },
  optionName: { type: String, required: true },
});
// Product Discriminator
const ProductSchema = new Schema<IProduct>({
  price: { type: Number, required: true },
  availableOnline: { type: Boolean, default: false },
  productUrl: { type: String },
  ships: { type: Boolean, default: false },
  pickupAvailable: { type: Boolean, default: false },
  inShopOnly: { type: Boolean, default: false },
});

const Product = Item.discriminator<IProduct>("Product", ProductSchema);

export default Product;
