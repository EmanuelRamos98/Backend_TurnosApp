import mongoose from "mongoose";

const ServicioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    duracion: { type: Number, required: true },
    descripcion: { type: String },
});

export default mongoose.model("Servicio", ServicioSchema);
