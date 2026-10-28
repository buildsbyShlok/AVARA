const errorHandler = (err, req, res, next) => {
    const candidate = err.statusCode || err.status || (err.name === "CastError" || err.name === "ValidationError" ? 400 : 500);
    const statusCode = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599 ? candidate : 500;
    const message = statusCode >= 500 ? "Internal Server Error" :
        err.name === "CastError" ? "Invalid identifier or field value." : (err.message || "Request failed.");
    // Errors can contain database credentials or request values; do not log them.
    if (statusCode >= 500) console.error(`AVARA API error (${statusCode}).`);
    res.status(statusCode).json({
        success: false,
        message,
        error: message,
        statusCode
    });
};

module.exports = errorHandler;
