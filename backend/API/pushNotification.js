const axios = require('axios');

async function sendPushNotification(expoPushToken, title, body) {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,     
      body: body,        
      data: {           
        someKey: 'someValue',
      },
    };

    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Push notification sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending push notification:', error.response ? error.response.data : error.message);
  }
}


module.exports = sendPushNotification;