class AppError extends Error {
    constructor(message, status_code, Validations) {
        super(message);
        this.status_code = status_code;
        this.status = String(status_code).startsWith('4') ? 'fail' : 'error';
        this.is_operational = true;
        this.Validations = Validations;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
