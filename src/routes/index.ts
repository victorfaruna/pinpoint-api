import express from "express";
import auth from "./auth";
import user from "./user";
import location from "./location";
import post from "./post";
import comment from "./comment";
import story from "./story";
import image from "./image";
import product from "./product";
import service from "./service";
import message from "./message";
import lead from "./lead";
import content from "./content";

const router = express.Router();

router.use("/auths", auth);
router.use("/users", user);
router.use("/locations", location);
router.use("/posts", post);
router.use("/comments", comment);
router.use("/stories", story);
router.use("/images", image);
router.use("/products", product);
router.use("/services", service);
router.use("/leads", lead);
router.use("/messages", message);
router.use("/contents", content);

export default router;
