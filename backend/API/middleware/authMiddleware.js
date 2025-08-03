const jwt = require('jsonwebtoken');
const JWT_SECRET = 'fbce145f629cbac3bf16fd7fe6d28cb96246396da7f20ca58293f397a04decab7746cd06afe308f71166dba2977eb9d6f1c059a7eee285f27060b408d36a6948';  // For JWT tokenization, it should typically be stored in an environment variable for security reasons. 

const verifyToken = (request, response, next) => {
    const token = request.header('Authorization').replace('Bearer ', '');

    // Token is sent as: Authorization: Bearer <token>
    if (!token) {
        return response.status(401).json({ message: 'Authorization token missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        request.user = decoded; // Save user info into request
        next(); 
    } catch (error) {
        return response.status(403).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyToken;