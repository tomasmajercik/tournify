const pool = require('./pooling'); // Import the database pool

/**
 * @swagger
 * /tournaments/categories:
 *   get:
 *     summary: Retrieve all sport categories
 *     tags: [Tournaments]
 *     description: Fetches a list of all available sport categories, including their names and associated images.
 *     operationId: getAllCategories
 *     responses:
 *       '200':
 *         description: A list of sport categories.
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
 *                   category_name:
 *                     type: string
 *                     example: "Football"
 *                   category_image:
 *                     type: string
 *                     example: "football.png"
 *       '404':
 *         description: Sport categories not found
 *       '500':
 *         description: Internal Server Error - Something went wrong with the server.
 */
const getAllCategories = async (request, response) => {
    try {
        const { rows } = await pool.query(
            `SELECT
                *
            FROM
                sport_category`
        );

        if (rows.length === 0) {
            return response.status(404).json({ message: "Sport categories not found" });
        }

        response.status(200).json(rows);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}


module.exports = {
    getAllCategories
};