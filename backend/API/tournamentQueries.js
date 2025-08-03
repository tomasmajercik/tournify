const pool = require('./pooling'); // Import the database pool
const crypto = require('crypto');
const geolib = require('geolib');
const sendPushNotification = require('./pushNotification'); 

/**
 * @swagger
 * tags:
 *   name: Tournaments
 *   description: Tournament management
 */
/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Image delivery and processing (e.g., category and uploaded images)
 */
// Get IMAGES Documentation
/**
 * @swagger
 * /category/images/{filename}:
 *   get:
 *     summary: Get a category image (optionally in grayscale)
 *     tags: [Images]
 *     description: Serves a tournament category image from the server. Can be converted to grayscale via query parameter.
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         description: Name of the image file to retrieve
 *         schema:
 *           type: string
 *           example: football.jpg
 *       - in: query
 *         name: grayscale
 *         required: false
 *         description: If true, returns the image in grayscale
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Image returned successfully.
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found.
 *       500:
 *         description: Failed to process image.
 */

/**
 * @swagger
 * /uploads/{filename}:
 *   get:
 *     summary: Get a user-uploaded image (optionally in grayscale)
 *     tags: [Images]
 *     description: Serves a user-uploaded profile or content image. Can be converted to grayscale via query parameter.
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         description: Name of the uploaded image file to retrieve
 *         schema:
 *           type: string
 *           example: user123.png
 *       - in: query
 *         name: grayscale
 *         required: false
 *         description: If true, returns the image in grayscale
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Image returned successfully.
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found.
 *       500:
 *         description: Failed to process image.
 */

// GET
/**
 * @swagger
 * /tournaments: 
 *   get:
 *     summary: Get all tournaments with sport category filter excluding user’s assigned and owned tournaments
 *     tags: [Tournaments]
 *     description: Returns a list of tournaments filtered by sport category, excluding tournaments the user is already part of or owns.
 *     parameters:
 *       - in: query
 *         name: category_id
 *         required: true
 *         description: ID of the sport category to filter tournaments.
 *         example: 2
 *         schema:
 *           type: integer
 *       - in: query
 *         name: user_id
 *         required: true
 *         description: ID of the user to exclude tournaments they are already assigned to or own.
 *         example: 1
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of tournaments retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   tournament_name:
 *                     type: string
 *                     example: Summer Basketball Championship
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-07-10T10:00:00Z"
 *                   latitude:
 *                     type: number
 *                     format: float
 *                     example: 34.0522
 *                   longitude:
 *                     type: number
 *                     format: float
 *                     example: -118.2437
 *                   category_image:
 *                     type: string
 *                     example: /images/basketball.png
 *       204:
 *         description: No tournaments found.
 *       500:
 *         description: Internal server error.
 */
const getTournaments = async (request, response) => {
    try {
        const {category_id, user_id} = request.query;
        const { rows } = await pool.query(
            `SELECT
                t.id,
                t.tournament_name,
                t.date,
                t.latitude,
                t.longitude,
                sc.category_image
            FROM
                tournaments t
            JOIN sport_category sc ON t.category_id = sc.id
            WHERE
                t.category_id = $1
                AND t.id NOT IN (
                    SELECT tm.tournament_id
                    FROM team_members tm
                    WHERE tm.user_id = $2
                ) AND t.owner_id <> $2`, [category_id, user_id]
        );

        if (rows.length === 0) {
            return response.status(204).json([]); // ← return empty array, it is not error, just empty tournaments
        }

        const tournaments = rows;

        const userResult = await pool.query(
            `SELECT preferred_longitude, preferred_latitude FROM users WHERE id = $1`,
            [user_id]
        )
        if (userResult.rows.length === 0){
            return response.status(404).json({ message: 'User not found' });
        }
        const userLat = userResult.rows[0].preferred_latitude;
        const userLong = userResult.rows[0].preferred_longitude;
        
        const tournamentsWithDistance = tournaments.map(t => {
            const tournamentLat = parseFloat(t.latitude); 
            const tournamentLong = parseFloat(t.longitude); 

            const distance = geolib.getDistance(
                { latitude: userLat, longitude: userLong },
                { latitude: tournamentLat, longitude: tournamentLong }
            );

            return {
                ...t, // include all tournament data
                distance: (distance / 1000).toFixed(2) // convert to kilometers
            };
        });

        const sortedTournaments = tournamentsWithDistance.sort((a, b) => {
            return parseFloat(a.distance) - parseFloat(b.distance);
        });
          
        response.status(200).json(tournamentsWithDistance); // Return all tournaments
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /tournaments/{id}/teams/count: 
 *   get:
 *     summary: Get the count of teams enrolled in a tournament
 *     tags: [Tournaments]
 *     description: Retrieves the total number of teams that are enrolled in a specific tournament.
 *     parameters:
 *       - name: id  # Path parameter for tournament ID
 *         in: path
 *         required: true
 *         type: integer
 *         description: The ID of the tournament.
 *     responses:
 *       200:
 *         description: Successfully retrieved the number of teams for the tournament
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   team_count:
 *                     type: integer
 *                     description: The total number of teams in the tournament
 *                     example: 10
 *       204:
 *         description: No teams found for the specified tournament
 *       500:
 *         description: Internal server error, failed to retrieve data.
 */
const getTeamCount = async (request, response) => {
    const tournament_id = request.params.id;
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*) AS team_count
            FROM
                teams t
            WHERE
                t.tournament_id = $1
            GROUP BY t.tournament_id`, [tournament_id]
        );

        if (result.rowCount === 0) {
            return response.status(204).json({ message: "No teams found for this tournament" });
        }

        response.status(200).json(result.rows);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
} 


/**
 * @swagger
 * /tournaments/{id}/info: 
 *   get:
 *     summary: Get tournament info by ID
 *     tags: [Tournaments]
 *     description: Returns detailed information about a specific tournament based on its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The unique ID of the tournament.
 *         example: 1
 *     responses:
 *       200:
 *         description: Tournament details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 tournament_name:
 *                   type: string
 *                   example: Summer Basketball Championship
 *                 location_name:
 *                   type: string
 *                   example: Los Angeles Sports Arena
 *                 latitude:
 *                   type: number
 *                   format: float
 *                   example: 34.0522
 *                 longitude:
 *                   type: number
 *                   format: float
 *                   example: -118.2437
 *                 level:
 *                   type: string
 *                   example: Amateur
 *                 max_team_size:
 *                   type: integer
 *                   example: 5
 *                 game_setting:
 *                   type: string
 *                   example: Outdoor
 *                 entry_fee:
 *                   type: number
 *                   format: float
 *                   example: 20.00
 *                 prize_description:
 *                   type: string
 *                   example: Trophy and cash prize
 *                 is_public:
 *                   type: boolean
 *                   example: true
 *                 additional_info:
 *                   type: string
 *                   example: Bring your own jerseys
 *                 status:
 *                   type: string
 *                   example: Upcoming
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-10T10:00:00Z"
 *                 category_name:
 *                   type: string
 *                   example: Basketball
 *       404:
 *         description: Tournament not found.
 *       500:
 *         description: Internal server error.
 */
const getTournamentInfo = async (request, response) => {
    try {
        const tournamentID = request.params.id;
        const { rows } = await pool.query(
            `SELECT
                t.id,
                t.tournament_name,
                t.location_name,
                t.latitude,
                t.longitude,
                t.level,
                t.max_team_size,
                t.game_setting,
                t.entry_fee,
                t.prize_description,
                t.is_public,
                t.additional_info,
                t.status,
                t.date,
                sc.category_image,
                sc.id as category_id 
            FROM
                tournaments t
            JOIN sport_category sc ON t.category_id = sc.id
            WHERE
                t.id = $1`, [tournamentID]
        );
        if (rows.length === 0) {
            return response.status(404).json({ message: "Tournament not found" });
        }

        response.status(200).json(rows[0]);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}

/**
 * @swagger
 * /tournaments/{id}/leaderboard:
 *   get:
 *     summary: Get leaderboard for a specific tournament
 *     tags: [Tournaments]
 *     description: Retrieves all leaderboard records for a given tournament by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the tournament whose leaderboard records are to be fetched.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved leaderboard records for the tournament
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tournament_id:
 *                     type: integer
 *                     description: ID of the tournament
 *                   team_id:
 *                     type: integer
 *                     description: ID of the team
 *                   position:
 *                     type: integer
 *                     description: Position of the team in the leaderboard
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Internal server error
 */
const getLeaderboardByTournament = async (request, response) =>{
    const tournament_id = request.params.id;

    try {
        const result = await pool.query(
            `SELECT
                l.*,
                t.team_name as name
            FROM
                leaderboard l
                JOIN teams t ON l.team_id = t.id
            WHERE
                l.tournament_id = $1
            ORDER BY l.position
            `,[tournament_id]
        );
        
        // if (result.rowCount === 0){
        //     return response.status(404).json({ message: "Tournament not found" });
        // }
        response.status(200).json( result.rows )
    } catch (error) {
        response.status(500).json({ error: error.message })
    }
}

/**
 * @swagger
 * /tournaments/{id}/enrolled:
 *   get:
 *     summary: Get a list of teams enrolled in a tournament
 *     tags: [Tournaments]
 *     description: Retrieves a list of teams enrolled in a specific tournament, along with the number of members in each team.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the tournament.
 *         example: 1
 *     responses:
 *       200:
 *         description: Successfully retrieved list of teams and their members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 team_name:
 *                   type: string
 *                   description: The name of the team
 *                   example: "Team A"
 *                 number_of_members:
 *                   type: integer
 *                   description: The number of members in the team
 *                   example: 5
 *       404:
 *         description: No teams found for this tournament
 *       500:
 *         description: Internal server error, failed to retrieve data.
 */
const getEnrolledTeams = async (request, response) => {
    const tournament_id = request.params.id;

    try {
        const result = await pool.query(
            `SELECT
                t.id,
                t.team_name,
                COUNT(*) AS number_of_members
            FROM
                teams t
                JOIN team_members tm ON t.id = tm.team_id
            WHERE
                t.tournament_id = $1
            GROUP BY t.team_name, t.id`, [tournament_id]
        );

        if (result.rowCount === 0) {
            return response.status(404).json({ message: "No teams found for this tournament" });
        }

        response.status(200).json(result.rows);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}


// POST
/**
 * @swagger
 * /tournaments:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Tournaments]
 *     description: Adds a new tournament to the database and returns its ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - owner_id
 *               - tournament_name
 *               - category_id
 *               - location_name
 *               - latitude
 *               - longitude
 *               - level
 *               - max_team_size
 *               - game_setting
 *               - entry_fee
 *               - prize_description
 *               - is_public
 *               - additional_info
 *               - status
 *               - date
 *             properties:
 *               owner_id:
 *                 type: integer
 *                 description: ID of the tournament owner.
 *                 example: 5
 *               tournament_name:
 *                 type: string
 *                 example: Summer Basketball Championship
 *               category_id:
 *                 type: integer
 *                 description: ID of the sport category.
 *                 example: 2
 *               location_name:
 *                 type: string
 *                 example: Los Angeles Sports Arena
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 34.0522
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: -118.2437
 *               level:
 *                 type: string
 *                 example: Amateur
 *               max_team_size:
 *                 type: integer
 *                 example: 5
 *               game_setting:
 *                 type: string
 *                 example: Outdoor
 *               entry_fee:
 *                 type: number
 *                 format: float
 *                 example: 20.00
 *               prize_description:
 *                 type: string
 *                 example: Trophy and cash prize
 *               is_public:
 *                 type: boolean
 *                 example: true
 *               additional_info:
 *                 type: string
 *                 example: Bring your own jerseys
 *               status:
 *                 type: string
 *                 example: Upcoming
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-10T10:00:00Z"
 *     responses:
 *       201:
 *         description: Tournament created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Bad request, missing required fields.
 *       500:
 *         description: Internal server error.
 */
const createTournament = async (request, response) => {
    const { tournament_name, category_id, location_name, latitude, longitude, level, max_team_size, game_setting, entry_fee, prize_description, is_public, additional_info, status, date } = request.body;
    const owner_id = request.user.userId; // from token

    try {
        const { rows } = await pool.query(
            `INSERT INTO
                tournaments (
                    owner_id,
                    tournament_name,
                    category_id,
                    location_name,
                    latitude,
                    longitude,
                    level,
                    max_team_size,
                    game_setting,
                    entry_fee,
                    prize_description,
                    is_public,
                    additional_info,
                    status,
                    date
                )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING
                id`, [owner_id, tournament_name, category_id, location_name, latitude, longitude, level, max_team_size, game_setting, entry_fee, prize_description, is_public, additional_info, status, date]
        );

        response.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { //PostgreSQL unique_violation error code
            return response.status(400).json({ message: 'A tournament with this name already exists.' });
        }
    
        response.status(500).json({ error: error.message });
    }
}

/**
 * @swagger
 * /tournaments/leaderboard/add:
 *   post:
 *     summary: Add a new record to the leaderboard
 *     tags: [Tournaments]
 *     description: Adds a new team record to the leaderboard for a specific tournament and position.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournament_id
 *               - team_id
 *               - position
 *             properties:
 *               tournament_id:
 *                 type: integer
 *                 description: The ID of the tournament.
 *                 example: 1
 *               team_id:
 *                 type: integer
 *                 description: The ID of the team.
 *                 example: 3
 *               position:
 *                 type: integer
 *                 description: The position of the team in the tournament.
 *                 example: 2
 *     responses:
 *       200:
 *         description: Record added to the leaderboard.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Record added to leaderboard
 *       400:
 *         description: Invalid input, missing required fields or invalid data.
 *       500:
 *         description: Internal server error, failed to add record.
 */
const addRecordToLeaderboard = async (request, response) => {
    const { tournament_id, team_id, position} = request.body;

    try {
        await pool.query(
            `DELETE FROM leaderboard WHERE tournament_id = $1 AND position = $2`,
            [tournament_id, position]
        );

        const result = await pool.query(
            `INSERT INTO leaderboard (tournament_id, team_id, position)
            VALUES ($1, $2, $3)
            ON CONFLICT (tournament_id, team_id) 
            DO UPDATE SET position = EXCLUDED.position;`, [tournament_id, team_id, position]
        );

        if (result.rowCount === 0) {
            return response.status(400).json({ message: "Invalid input, missing required fields or invalid data" });
        }

        response.status(200).json({ message: "Record added to leaderboard" })
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}

// this function generates random codes
const generateCode = (byte_length) => {
    return crypto.randomBytes(byte_length).toString('hex').toUpperCase();
};

/**
 * @swagger
 * /tournaments/{id}/register:
 *   post:
 *     summary: Register a team for a tournament
 *     tags: [Tournaments]
 *     description: Registers a team with a name and a user for a specific tournament. Generates a unique team code and a ticket for the user.
 *     parameters:
 *       - name: id  # Path parameter for tournament ID
 *         in: path
 *         required: true
 *         type: integer
 *         description: The ID of the tournament.
 *     requestBody:
 *       required: true  # Body parameters are required
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_name  # Required parameter for team name
 *             properties:
 *               team_name:
 *                 type: string
 *                 description: The name of the team.
 *                 example: "Team A"
 *     responses:
 *       200:
 *         description: Successfully registered team and user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team and member registered"
 *                 team_code:
 *                   type: string
 *                   description: The unique code generated for the team
 *                   example: "U8ED45NH"
 *                 ticket:
 *                   type: string
 *                   description: The unique ticket hash for the user
 *                   example: "TICKET123456"
 *       400:
 *         description: Invalid input, missing required fields or invalid data.
 *       500:
 *         description: Internal server error, failed to register team.
 */
const addTeamToTournament = async (request, response) => {
    const { team_name } = request.body;
    const user_id = request.user.userId; // from token
    const tournament_id = request.params.id;
    const code = generateCode(4);
    const ticket_hash = generateCode(6);

    try {
        // 1. Insert team and return its id
        const teamResult = await pool.query(
            `INSERT INTO teams (team_name, code, tournament_id) 
             VALUES ($1, $2, $3)
             RETURNING id`, 
            [team_name, code, tournament_id]
        );

        const team_id = teamResult.rows[0].id;

        // 2. Insert into team_members
        const memberResult = await pool.query(
            `INSERT INTO team_members (user_id, team_id, tournament_id, ticket) 
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [user_id, team_id, tournament_id, ticket_hash]
        );

        const ticket_id = memberResult.rows[0].id;

        const io = request.app.get('io');
        io.to(`tournament-${tournament_id}`).emit('enrolled_updated', { tournament_id });


        response.status(200).json({ 
            message: "Team and member registered",
            team_code: code,
            ticket: ticket_hash,
            ticketId: ticket_id
        });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /tournaments/{id}/join_team:
 *   post:
 *     summary: Join a team at a tournament
 *     tags: [Tournaments]
 *     description: Adds a user to an existing team in a tournament by providing the team code.
 *     parameters:
 *       - name: id  # Path parameter for tournament ID
 *         in: path
 *         required: true
 *         type: integer
 *         description: The ID of the tournament.
 *     requestBody:
 *       required: true  # Body parameters are required
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code     # Required parameter for team code
 *             properties:
 *               code:
 *                 type: string
 *                 description: The code of the team the user wants to join.
 *                 example: "ABCD123"
 *     responses:
 *       200:
 *         description: Successfully added user to the team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User added to the team"
 *       400:
 *         description: The team is already full
 *       404:
 *         description: Team or tournament not found
 *       500:
 *         description: Internal server error, failed to add user to the team.
 */
const joinTeamAtTournament = async (request, response) => {
    const { code } = request.body;
    const user_id = request.user.userId; // from token
    const tournament_id = request.params.id;
    const ticket_hash = generateCode(6);

    try {
        // 1. Check if the team code exists
        const teamResult = await pool.query(
            `SELECT id FROM teams WHERE code = $1 AND tournament_id = $2`, 
            [code, tournament_id]
        );

        if (teamResult.rowCount === 0) {
            return response.status(404).json({ message: "Team not found" + code });
        }

        const team_id = teamResult.rows[0].id;

        // 2. Get the max team size from the tournaments table
        const tournamentResult = await pool.query(
            `SELECT max_team_size FROM tournaments WHERE id = $1`,
            [tournament_id]
        );

        if (tournamentResult.rowCount === 0) {
            return response.status(404).json({ message: "Tournament not found" });
        }

        const maxTeamSize = tournamentResult.rows[0].max_team_size;

        // 3. Count the current number of members in the team
        const membersCountResult = await pool.query(
            `SELECT COUNT(*) FROM team_members WHERE team_id = $1`,
            [team_id]
        );

        const currentMembersCount = parseInt(membersCountResult.rows[0].count, 10);

        // 4. Check if the team is already full
        if (currentMembersCount >= maxTeamSize) {
            return response.status(400).json({ message: "Team is already full" });
        }

        // 5. Insert the new member into the team_members table
        const memberResult = await pool.query(
            `INSERT INTO team_members (user_id, team_id, tournament_id, ticket) 
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [user_id, team_id, tournament_id, ticket_hash]
        );

        const ticket_id = memberResult.rows[0].id;

        response.status(200).json({ message: "User added to the team",  
            team_code: code,
            ticket: ticket_hash,
            ticketId: ticket_id 
        });
        const io = request.app.get('io');
        io.to(`tournament-${tournament_id}`).emit('enrolled_updated', { tournament_id });
        
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}; // Chat GPT generated

/**
 * @swagger
 * /tournaments/{id}/check-tickets:
 *   post:
 *     summary: "Check if a ticket exists for a tournament"
 *     tags: [Tournaments]
 *     description: "This endpoint checks whether a ticket exists for the provided tournament."
 *     parameters:
 *       - name: id
 *         in: path
 *         description: "The tournament ID to check against."
 *         required: true
 *         type: string
 *       - name: ticket
 *         in: body
 *         description: "The ticket code to check."
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             ticket:
 *               type: string
 *               example: 9HFBDAS24
 *     responses:
 *       200:
 *         description: "Ticket found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 11
 *                 user_id:
 *                   type: integer
 *                   example: 60
 *                 team_id:
 *                   type: integer
 *                   example: 14
 *                 tournament_id:
 *                   type: integer
 *                   example: 62
 *                 ticket:
 *                   type: string
 *                   example: 9HFBDAS24
 *       404:
 *         description: "Ticket not found"
 *       500:
 *         description: "Internal server error"
 */
const checkTickets = async (request, response) => {
    const tournament_id = request.params.id;
    const { code } = request.body;

    try {
        const result = await pool.query(
            `SELECT
                *
            FROM
                team_members
            WHERE
                tournament_id = $1 AND ticket = $2`, [tournament_id, code]
        );

        if (result.rowCount === 0) {
            return response.status(404).json({ message: "Ticket not found" });
        }

        response.status(200).json(result.rows[0]);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}

// PUT
/**
 * @swagger
 * /tournaments/{id}/edit:
 *   put:
 *     summary: Edit an existing tournament
 *     tags: [Tournaments]
 *     description: Updates the information of an existing tournament.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the tournament to be updated.
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournament_name
 *               - category_id
 *               - location_name
 *               - latitude
 *               - longitude
 *               - level
 *               - max_team_size
 *               - game_setting
 *               - entry_fee
 *               - prize_description
 *               - is_public
 *               - additional_info
 *             properties:
 *               tournament_name:
 *                 type: string
 *                 example: Summer Basketball Championship
 *               category_id:
 *                 type: integer
 *                 description: ID of the sport category.
 *                 example: 2
 *               location_name:
 *                 type: string
 *                 example: Los Angeles Sports Arena
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 34.0522
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: -118.2437
 *               level:
 *                 type: string
 *                 example: Amateur
 *               max_team_size:
 *                 type: integer
 *                 example: 5
 *               game_setting:
 *                 type: string
 *                 example: Outdoor
 *               entry_fee:
 *                 type: number
 *                 format: float
 *                 example: 20.00
 *               prize_description:
 *                 type: string
 *                 example: Trophy and cash prize
 *               is_public:
 *                 type: boolean
 *                 example: true
 *               additional_info:
 *                 type: string
 *                 example: Bring your own jerseys
 *     responses:
 *       200:
 *         description: Tournament updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tournament updated successfully
 *       404:
 *         description: Tournament not found.
 *       500:
 *         description: Internal server error.
 */
const editTournament = async (request, response) => {
    const tournament_id = request.params.id;
    const { tournament_name, category_id, location_name, latitude, longitude, level, max_team_size, game_setting, entry_fee, prize_description, is_public, additional_info } = request.body;

    try {
        const { rowCount } = await pool.query(
        `UPDATE tournaments 
        SET
            tournament_name = $2,
            category_id = $3,
            location_name = $4,
            latitude = $5,
            longitude = $6,
            level = $7,
            max_team_size = $8,
            game_setting = $9,
            entry_fee = $10,
            prize_description = $11,
            is_public = $12,
            additional_info = $13
        WHERE id = $1
            `, [tournament_id, tournament_name, category_id, location_name, latitude, longitude, level, max_team_size, game_setting, entry_fee, prize_description, is_public, additional_info]
        );
        
        if (rowCount === 0) {
            return response.status(404).json({ message: "Tournament not found." });
        }

        response.status(200).json({ message: "Tournament updated successfully" });
        
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}

/**
 * @swagger
 * /tournaments/{id}/start:
 *   put:
 *     summary: Start a tournament
 *     tags: [Tournaments]
 *     description: Updates the status of a tournament to "Ongoing" based on the tournament ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the tournament to start
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Tournament started successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tournament started successfully
 *       404:
 *         description: Tournament not found.
 *       500:
 *         description: Internal server error.
 */
const startTournament = async (request, response) => {
    const tournament_id = request.params.id;

    try {
        const result = await pool.query(
            `UPDATE tournaments
             SET status = 'Ongoing'
             WHERE id = $1`,
            [tournament_id]
        );

        if (result.rowCount === 0) {
            return response.status(404).json({ message: "Tournament not found" });
        }

        response.status(200).json({ message: "Tournament started successfully" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /tournaments/{id}/notify-start:
 *   post:
 *     summary: Send start notifications to all users in a tournament
 *     tags: [Tournaments]
 *     description: Sends push notifications to all users registered in the tournament that it has started.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the tournament
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Notifications sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notifications sent to 8 users
 *                 total:
 *                   type: integer
 *                   example: 8
 *       404:
 *         description: Tournament not found.
 *       500:
 *         description: Failed to send notifications.
 */
const sendTournamentStartNotifications = async (request, response) => {
    const tournament_id = request.params.id;

    try {
        // Get the tournament name
        const { rows: [tournament] } = await pool.query(
            `SELECT tournament_name FROM tournaments WHERE id = $1`,
            [tournament_id]
        );

        if (!tournament) {
            console.warn(`Tournament with ID ${tournament_id} not found.`);
            return response.status(404).json({ message: 'Tournament not found' });
        }

        // Get users with push tokens
        const { rows: users } = await pool.query(`
            SELECT DISTINCT u.id, u.first_name, pt.token
            FROM users u
            JOIN team_members tm ON tm.user_id = u.id
            JOIN teams t ON t.id = tm.team_id
            JOIN push_tokens pt ON pt.user_id = u.id
            WHERE t.tournament_id = $1 AND pt.token IS NOT NULL
        `, [tournament_id]);

        let successCount = 0;
        for (const user of users) {
            try {
                await sendPushNotification(
                    user.token,
                    `🏁 ${tournament.tournament_name} has started!`,
                    `Good luck, ${user.first_name}!`
                );
                successCount++;
            } catch (err) {
                console.error(`Failed to notify user ${user.id}:`, err.message);
            }
        }

        console.log(`Sent ${successCount}/${users.length} notifications for tournament: ${tournament.tournament_name}`);

        return response.status(200).json({
            message: `Notifications sent to ${successCount} users`,
            total: users.length,
        });

    } catch (err) {
        console.error('Error sending start notifications:', err);
        return response.status(500).json({ error: 'Failed to send notifications' });
    }
};


/**
 * @swagger
 * /tournaments/{id}/stop:
 *   put:
 *     summary: Stop a tournament
 *     tags: [Tournaments]
 *     description: Updates the status of a tournament to "Closed" based on the tournament ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the tournament to stop
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Tournament stopped successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tournament stopped successfully
 *       404:
 *         description: Tournament not found.
 *       500:
 *         description: Internal server error.
 */
const stopTournament = async (request, response) => {
    const tournament_id = request.params.id;

    try {
        const result = await pool.query(
            `UPDATE tournaments
             SET status = 'Closed'
             WHERE id = $1`,
            [tournament_id]
        );

        if (result.rowCount === 0) {
            return response.status(404).json({ message: "Tournament not found" });
        }

        response.status(200).json({ message: "Tournament stopped successfully" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};


// DELETE
/**
 * @swagger
 * /tournaments/{id}/leaderboard/remove:
 *   delete:
 *     summary: Remove a team from the leaderboard
 *     tags: [Tournaments]
 *     description: Removes a team from the leaderboard for a specific tournament by the provided tournament ID and team ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournament_id
 *               - team_id
 *             properties:
 *               tournament_id:
 *                 type: integer
 *                 description: The ID of the tournament.
 *                 example: 1
 *               team_id:
 *                 type: integer
 *                 description: The ID of the team to be removed.
 *                 example: 5
 *     responses:
 *       200:
 *         description: Record removed from leaderboard
 *       404:
 *         description: Leaderboard record not found
 *       500:
 *         description: Internal server error, failed to remove record.
 */
const removeFromLeaderboard = async (request, response) => {
    const { tournament_id, position } = request.body;

    console.log(`Attempting to delete leaderboard entry: tournament_id=${tournament_id}, position=${position}`);

    try {
        const result = await pool.query(
            `DELETE FROM leaderboard WHERE tournament_id = $1 AND position = $2`,
            [tournament_id, position]
        );

        if (result.rowCount === 0) {
            console.log("No leaderboard entry found to delete.");
            return response.status(200).json({ message: "No record to delete (already absent)." });
        }

        console.log("Leaderboard entry deleted.");
        response.status(200).json({ message: "Record removed from leaderboard" });
    } catch (error) {
        console.error("Error deleting leaderboard entry:", error.message);
        response.status(500).json({ error: error.message });
    }
};


module.exports = {
    getTournaments,
    getTournamentInfo,
    createTournament,
    editTournament,
    startTournament,
    stopTournament,
    addRecordToLeaderboard,
    getLeaderboardByTournament,
    removeFromLeaderboard,
    addTeamToTournament,
    joinTeamAtTournament,
    getEnrolledTeams,
    checkTickets,
    getTeamCount,
    sendTournamentStartNotifications,
};