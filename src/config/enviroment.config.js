import dotenv from "dotenv";

dotenv.config({ override: true });

const ENVIROMENT = {
    MONGO_URL: process.env.MONGO_URL,
    SECRET_KEY: process.env.SECRET_KEY,
};

export default ENVIROMENT;
