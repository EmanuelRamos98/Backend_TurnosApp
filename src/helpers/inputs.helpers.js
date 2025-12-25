import Validations from "./validation.helpers.js";

export const validaInput = (data, schema) => {
    const validation = new Validations(data);

    for (const field in schema) {
        const reglas = schema[field];

        if (reglas.required) {
            validation.isRequired(field);
        }

        if (reglas.type === "string") {
            validation.isString(field);
            if (reglas.min || reglas.max) {
                validation.min_max_length(
                    field,
                    reglas.min || 0,
                    reglas.max || Infinity
                );
            }
        }

        if (reglas.type === "email") {
            validation.isEmail(field);
        }

        if (reglas.type === "number") {
            validation.isNumber(field);
            if (reglas.min || reglas.max) {
                validation.min_max_value(
                    field,
                    reglas.min || -Infinity,
                    reglas.max || Infinity
                );
            }
        }

        if (reglas.type === "time") {
            validation.isString(field);
            validation.isTime(field);
        }

        if (reglas.type === "array") {
            validation.isArray(field);
        }
    }

    return validation.obtenerErrores();
};
