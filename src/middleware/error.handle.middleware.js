import ApiResponse from "../helpers/api.response.js";
import AppError from "../helpers/error.helpers.js";

const errorHandle = (err, req, res, next) => {
    err.status_code = err.status_code || 500;
    err.status = err.status || "error";

    if (err.Validations && err.Validations.length > 0) {
        return res
            .status(err.status_code)
            .json(
                new ApiResponse(
                    err.status_code,
                    "Errores validacion",
                    err.Validations
                )
            );
    }

    if (err.is_operational) {
        return res
            .status(err.status_code)
            .json(new ApiResponse(err.status_code, err.message));
    }

    console.error("ERROR: 😢 🚩 😖", err);
    return res
        .status(500)
        .json(new ApiResponse(500, "Algo salio mal 😢 🚩 😖"));
};

export default errorHandle;
