const pool = require('../pooling');
const checkUserIdentityTournament = async (request, response, next) => {
    const requestedId = request.user.userId;
    try {
        const row = await pool.query(
            'SELECT owner_id FROM tournaments WHERE id = $1',
            [request.params.id]
        );
        if (requestedId !== row.rows[0].owner_id) {
          return response.status(403).json({ message: "Forbidden: You're not allowed to access this data." });
        }
        next();
    }
    catch (error) {
        console.error('Error checking user identity:', error);
        return response.status(500).json({ message: 'Internal server error' });
    }
  };

module.exports = checkUserIdentityTournament;