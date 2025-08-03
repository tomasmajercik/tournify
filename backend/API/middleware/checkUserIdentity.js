const checkUserIdentity = (request, response, next) => {
    const requestedId = parseInt(request.params.id);
    if (requestedId !== request.user.userId) {
      return response.status(403).json({ message: "Forbidden: You're not allowed to access this data." });
    }
    next();
  };
  
module.exports = checkUserIdentity;