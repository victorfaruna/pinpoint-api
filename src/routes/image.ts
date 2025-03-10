import { Router } from "express";
import { downloadMedia } from "../controllers/media";

const router = Router();

router.get("/:key", downloadMedia);

export default router;
