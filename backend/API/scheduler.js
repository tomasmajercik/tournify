const cron = require('node-cron');
const pool = require('./pooling'); 
const { DateTime } = require('luxon');
const sendPushNotification = require('./pushNotification'); 

cron.schedule('* * * * *', async () => {
  const oneHourLater = DateTime.now().plus({ hours: 1 }).toISO();
  console.log('Running cron job');

  try {
    // Tournaments that will start in exactly one hour (with a tolerance of ±1 minute)
    const { rows: tournaments } = await pool.query(`
      SELECT id, tournament_name, date
      FROM tournaments
      WHERE date BETWEEN NOW() + INTERVAL '59 minutes' AND NOW() + INTERVAL '61 minutes'
    `);

    console.log('Tournaments to notify:', tournaments);

    for (const tournament of tournaments) {
    // Fetch users registered for this tournament
      const { rows: users } = await pool.query(`
        SELECT DISTINCT u.id, u.first_name, pt.token
        FROM users u
        JOIN team_members tm ON tm.user_id = u.id
        JOIN teams t ON t.id = tm.team_id
        JOIN push_tokens pt ON pt.user_id = u.id
        WHERE t.tournament_id = $1 AND pt.token IS NOT NULL
      `, [tournament.id]);

      console.log('Users to notify:', users);

      for (const user of users) {
        await sendPushNotification(
          user.token,
          `Tournament "${tournament.tournament_name}" will start in 1 hour.`,
          `Get ready, ${user.first_name}!`
        );

        console.log(`Notification sent to user ${user.id} for tournament ${tournament.id}`);
      }
    }
  } catch (err) {
    console.error('Error while sending notification:', err);
  }
});
