class ApiResponse {
    constructor(status_code, message, data = null) {
        this.status_code = status_code;
        this.ok = status_code >= 200 && status_code < 300;
        this.message = message;

        if (data) {
            this.data = data;
        }
    }
}

export default ApiResponse;
