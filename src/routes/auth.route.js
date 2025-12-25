import { Router } from "express";
import {
    loginController,
    registerController,
} from "../controllers/auth.controller.js";

const auhtRoute = Router();

auhtRoute.post("/login", loginController);
auhtRoute.post("/register", registerController);
auhtRoute.get("/me", () => {});

export default auhtRoute;
