import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true },
        apellido: { type: String, required: true },
        email: { type: String, required: true, unique: true },

        dni: { type: Number, unique: true },
        telefono: { type: String },
        password: { type: String, required: true },
        hasSetPassword: { type: Boolean, default: false },

        verificationCode: { type: String },
        verificationCodeExpires: { type: Date },

        rol: {
            type: String,
            dafult: 'cliente',
            enum: ['admin', 'administrativo', 'profesional', 'cliente'],
            required: true,
        },

        verificado: { type: Boolean, default: false },
        tokenRestauracion: { type: String, default: null },
    },
    { timestamps: true }
);

export default mongoose.model('Usuario', UsuarioSchema);
