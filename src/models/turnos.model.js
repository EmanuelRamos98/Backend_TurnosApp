import mongoose from "mongoose";

const TurnosSchema = new mongoose.Schema(
    {
        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cliente",
            required: true,
        },
        profesional: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true,
        },
        servicio: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio" },
        fechaHoraInicio: { type: Date, required: true },
        fechaHoraFin: { type: Date, required: true },
        estado: {
            type: String,
            enum: ["pendiente", "confirmado", "cancelado", "realizado"],
            default: "pendiente",
        },
        observaciones: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("Turnos", TurnosSchema);
