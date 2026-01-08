import ApiResponse from '../helpers/api.response.js';

const errorHandle = (err, req, res, next) => {
    err.status_code = err.status_code || 500;
    err.status = err.status || 'error';

    if (err.is_operational) {
        return res.status(err.status_code).json(new ApiResponse(err.status_code, err.message, err.Validations));
    }

    console.error('ERROR CRITICO: 😢 🚩 😖 💥', err);
    return res.status(500).json(new ApiResponse(500, 'Algo salio mal con el servidor 😢 🚩 😖 💥'));
};

export default errorHandle;
