import { Schema, model, Document } from "mongoose";

export enum UserRole {
  CUSTOMER = "customer",
  PARTNER = "partner",
  ADMIN = "admin",
}

// Base fields for both types of users
interface UserBase extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  city: string;
  state: string;
  avatarUrl?: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  isVerified: boolean;
  follower: Schema.Types.ObjectId[];
  following: Schema.Types.ObjectId[];
  delected: boolean;
  notification: object;
}

// Customer-specific fields
interface Customer extends UserBase {
  followingStores: Schema.Types.ObjectId[];
  likedProducts: Schema.Types.ObjectId[];
  reportedStores: Schema.Types.ObjectId[];
  reportedProducts: Schema.Types.ObjectId[];
}

// Partner-specific fields
interface Partner extends UserBase {
  businessLegalName: string;
  businessAddress: string;
  suite: string;
  zipCode: string;
  businessType: string;
  einSsn: string;
  products: Schema.Types.ObjectId[];
  services: Schema.Types.ObjectId[];
  locations: Schema.Types.ObjectId[];
}

// Unified User schema
const UserSchema = new Schema<UserBase | Customer | Partner>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    avatarUrl: {
      type: String,
      default:
        "06450da9-903c-46ca-abd0-59864e8dc266_1729665407294-586722170.jpg",
    }, // Optional profile picture
    verificationCode: { type: String }, // Field to store the verification code
    verificationCodeExpires: { type: Date }, // New field for expiration
    isVerified: { type: Boolean, default: false },
    follower: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // Customer-specific fields
    followingStores: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    likedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    reportedStores: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    reportedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],

    // Partner-specific fields
    businessLegalName: { type: String },
    businessAddress: { type: String },
    suite: { type: String },
    zipCode: { type: String },
    businessType: {
      type: String,
      enum: ["products", "services", "products & services"],
    },
    einSsn: { type: String },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    locations: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    delected: { type: Boolean, default: false },
    notification: { type: Object },
  },
  {
    timestamps: true,
    discriminatorKey: "role",
  }
);

// Add validation for partner-specific fields when role is 'partner'
UserSchema.pre("save", function (next) {
  // Type assertion to ensure proper typing for this
  const user = this as UserBase | Partner;

  if (user.role === UserRole.PARTNER) {
    const partner = user as Partner; // Cast to Partner type

    if (
      !partner.businessLegalName ||
      !partner.businessAddress ||
      !partner.zipCode ||
      !partner.einSsn ||
      !partner.businessType
    ) {
      return next(new Error("All business fields are required for partners."));
    }
  }
  next();
});

const User = model<UserBase | Customer | Partner>("User", UserSchema);

export default User;
