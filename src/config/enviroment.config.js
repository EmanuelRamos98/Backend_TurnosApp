import dotenv from "dotenv";

dotenv.config({ override: true });

const ENVIROMENT = {
    MONGO_URL: process.env.MONGO_URL,
    SECRET_KEY: process.env.SECRET_KEY,
    EMAIL: process.env.EMAIL,
    KEY_EMAIL: process.env.KEY_EMAIL,
    URL_API: process.env.URL_API,
};

export default ENVIROMENT;
