const errorHandler = (err, req, res, next) =>{
    console.log("Middleware: Error handling")
    const errStatus = err.statusCode || 500 
    console.log(err)
    const errMsg = err.message || 'Something went wrong';
    res.status(errStatus).json({
        success: false,
        status: errStatus,
        message: errMsg,
        stack: process.env.ENV === "development" ? err.stack : {}
    })
}

export default errorHandler