import mongoose from "mongoose";

const ClienteSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true },
        apellido: { type: String },
        telefono: { type: String },
        email: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("Clientes", ClienteSchema);
