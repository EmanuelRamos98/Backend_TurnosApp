import mongoose from "mongoose";

const DisponibilidadSchema = mongoose.Schema({
    profesional: {
        type: mongoose.Schema.ObjectId,
        ref: "Usuario",
        required: true,
    },
    diaSemana: { type: Number, required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
    duracionTurno: { type: Number, required: true },
});

export default mongoose.model("Disponibilidad", DisponibilidadSchema);
