import mongoose from 'mongoose';

const TurnosSchema = new mongoose.Schema(
    {
        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        profesional: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        fecha: { type: Date, required: true },
        hora: { type: String, required: true },
        estado: {
            type: String,
            enum: ['pendiente', 'confirmado', 'cancelado', 'ausente'],
            default: 'pendiente',
        },
        intentosRecordatorio: { type: Number, default: 0 },
        observaciones: { type: String },
    },
    { timestamps: true }
);

TurnosSchema.index({ profesional: 1, fecha: 1, hora: 1 }, { unique: true });

export default mongoose.model('Turnos', TurnosSchema);
