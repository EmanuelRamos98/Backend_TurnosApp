import mongoose from "mongoose";

const UsuarioSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true },
        apellido: { type: String, required: true },
        email: { type: String, required: true, unique: true },

        dni: { type: Number, unique: true },
        telefono: { type: String },
        password: { type: String, required: true },

        rol: {
            type: String,
            dafult: "cliente",
            enum: ["admin", "administrativo", "profesional", "cliente"],
            required: true,
        },

        verificado: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("Usuario", UsuarioSchema);
