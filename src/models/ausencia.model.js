import mongoose from 'mongoose';

const AusenciaSchema = new mongoose.Schema(
    {
        profesional: {
            type: mongoose.Schema.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        fechaInicio: {
            type: Date,
            required: true,
        },
        fechaFin: {
            type: Date,
            required: true,
        },
        motivo: {
            type: String,
            default: 'Personal',
            enum: ['Feriado', 'Vacaciones', 'Personal', 'Enfermedad', 'Indisponible'],
        },
        nota: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        bloqueoTotal: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

//Fecha Fin no puede ser menor a Inicio
AusenciaSchema.pre('validate', function (next) {
    if (this.fechaInicio > this.fechaFin) {
        next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
    } else {
        next();
    }
});

AusenciaSchema.index({ profesional: 1, fechaInicio: 1, fechaFin: 1 });

export default mongoose.model('Ausencia', AusenciaSchema);
