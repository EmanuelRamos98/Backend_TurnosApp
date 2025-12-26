import mongoose from "mongoose";

const AusenciaSchema = new mongoose.Schema({
    profesional: {
        type: mongoose.Schema.ObjectId,
        ref: "Usuario",
        required: true,
    },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    motivo: {
        type: String,
        default: "Indisponible",
        enum: ["Feriado", "Vacaciones", "Personal"],
    },
    bloqueoTotal: { type: Boolean, default: true },
});

export default mongoose.model("Ausencia", AusenciaSchema);
