class Validations {
    constructor(valor) {
        this.valor = valor;
        this.error = [];
    }

    isRequired(field_name) {
        if (this.valor[field_name] === undefined || this.valor[field_name] === null || this.valor[field_name] === '') {
            this.error.push({
                field: field_name,
                message: `El campo ${field_name} es obligatorio`,
            });
        }
        return this;
    }

    isNumber(field_name) {
        const valor = this.valor[field_name];
        if (valor === undefined) {
            return this;
        }
        if (typeof valor !== 'number') {
            this.error.push({
                field: field_name,
                message: `El valor de ${field_name} debe ser un NUMERO`,
            });
        }
        return this;
    }

    min_max_value(field_name, min, max) {
        const valor = this.valor[field_name];
        if (valor === undefined || typeof valor !== 'number') return this;

        if (valor < min) {
            this.error.push({
                field: field_name,
                message: `El valor de ${field_name} debe ser mayor o igual a ${min}`,
            });
        }
        if (valor > max) {
            this.error.push({
                field: field_name,
                message: `El valor de ${field_name} debe ser menor o igual a ${max}`,
            });
        }
        return this;
    }

    isArray(field_name) {
        const valor = this.valor[field_name];
        if (valor === undefined) {
            return this;
        }
        if (!Array.isArray(valor) || valor.length === 0) {
            this.error.push({
                field: field_name,
                message: `El campo ${field_name} debe ser una lista (array) no vacia`,
            });
        }
        return this;
    }

    isTime(field_name) {
        const valor = this.valor[field_name];
        if (valor === undefined) {
            return this;
        }

        const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!regex.test(valor)) {
            this.error.push({
                field: field_name,
                message: `El formato de ${field_name} debe ser HH:mm (ej: 09:30)`,
            });
        }
        return this;
    }

    isString(field_name) {
        const valor = this.valor[field_name];
        if (valor === undefined) return this;

        if (typeof valor !== 'string') {
            this.error.push({
                field: field_name,
                message: `El valor de ${field_name} debe ser de tipo STRING`,
            });
        }
        return this;
    }

    min_max_length(field_name, min_length, max_length) {
        const valor = this.valor[field_name];
        if (valor === undefined) return this;

        if (valor.length < min_length) {
            this.error.push({
                field: field_name,
                message: `El valor de ${field_name} debe tener un minimo de ${min_length}`,
            });
        }
        if (valor.length > max_length) {
            this.error.push({
                field: field_name,
                message: `El valor de ${field_name} debe tener un maximo de ${max_length}`,
            });
        }
        return this;
    }

    isEmail(field_name) {
        const valor = this.valor[field_name];
        if (valor === undefined) return this;

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(valor)) {
            this.error.push({
                field: field_name,
                message: `El formato del correo electronico no es valido`,
            });
        }
        return this;
    }

    isBefore(field_name, target_field) {
        const start = this.valor[field_name];
        const end = this.valor[target_field];

        if (!start || !end) {
            return this;
        }

        if (start >= end) {
            this.error.push({
                field: field_name,
                message: `El campo ${field_name} debe ser anterior a ${target_field}`,
            });
        }
        return this;
    }

    obtenerErrores() {
        return this.error;
    }
}

export default Validations;
