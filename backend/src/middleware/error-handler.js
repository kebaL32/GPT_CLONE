export const errorHandler = (err, req, res, next) => {
    console.error('Error in request:', err.message);
    return res.status(err.status || 500).json({
    status: false,
    message: 'Something went wrong!',   
});
};