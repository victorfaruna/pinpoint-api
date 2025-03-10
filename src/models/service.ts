import { Schema } from "mongoose";
import Item, { IItem } from "./item";

interface IPriceRange {
  from: number;
  to: number;
}

export interface IService extends IItem {
  priceType: "flat" | "range";
  priceRange?: IPriceRange;
  price?: number;
  duration: string;
  homeService: boolean;
  serviceRadius?: string;
}

const PriceRangeSchema: Schema<IPriceRange> = new Schema({
  from: { type: Number },
  to: { type: Number },
});

// Service Discriminator
const ServiceSchema = new Schema<IService>({
  priceType: { type: String, enum: ["flat", "range"], required: true },
  price: { type: Number },
  priceRange: PriceRangeSchema,
  duration: { type: String, required: true },
  homeService: { type: Boolean, default: false },
  serviceRadius: { type: String },
});

const Service = Item.discriminator<IService>("Service", ServiceSchema);

export default Service;
