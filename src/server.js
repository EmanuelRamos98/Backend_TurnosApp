import express from "express";
import db from "./config/db.config.js";
import cors from "cors";
import auhtRoute from "./routes/auth.route.js";
import turnoRoute from "./routes/turnos.route.js";
import clienteRoute from "./routes/cliente.routes.js";
import disponibilidadRoute from "./routes/disponibilidad.route.js";
import errorHandle from "./middleware/error.handle.middleware.js";

const PORT = 9090;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", auhtRoute);
app.use("/api/turnos", turnoRoute);
app.use("/api/disponibilidad", disponibilidadRoute);
app.use("/api/clientes", clienteRoute);

app.use(errorHandle);

app.listen(PORT, () => {
    console.log(`El servidor se esta ejecutando en http://localhost:${PORT}`);
});
