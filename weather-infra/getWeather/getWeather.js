const { Client } = require("pg");
const { DateTime } = require("luxon");

const RDS_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
};

exports.handler = async (event) => {
  try {
    // 1) Parse the query params
    const { topic, date, hour } = event.queryStringParameters || {};
    if (!topic || !date || hour == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    // 2) Build the start/end times using Luxon
    //    (assuming date is like "2024-12-30", hour is "1" or "01")
    const startTime = DateTime.fromISO(`${date}T${String(hour).padStart(2, "0")}:00:00Z`);
    if (!startTime.isValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid date or hour format" }),
      };
    }
    const endTime = startTime.plus({ hours: 1 }); // next hour

    // 3) Connect to Postgres
    const client = new Client(RDS_CONFIG);
    await client.connect();

    // 4) Query for the video that falls within the hour
    const videoQuery = `
      SELECT video_url
      FROM videos
      WHERE topic = $1
        AND timestamp >= $2
        AND timestamp < $3
      LIMIT 1
    `;
    const videoRes = await client.query(videoQuery, [topic, startTime.toISO(), endTime.toISO()]);
    // In your DB, if you store timestamp in local time or UTC, adapt accordingly

    let videoUrl = null;
    if (videoRes.rows.length > 0) {
      videoUrl = videoRes.rows[0].video_url;
    }

    // 5) Query for the images in the same time range
    const imageQuery = `
      SELECT timestamp, temperature, humidity, air_pressure
      FROM images
      WHERE topic = $1
        AND timestamp >= $2
        AND timestamp < $3
      ORDER BY timestamp ASC
    `;
    const imagesRes = await client.query(imageQuery, [topic, startTime.toISO(), endTime.toISO()]);
    const images = imagesRes.rows.map((row) => ({
      timestamp: row.timestamp, // or row.timestamp.toISOString() if needed
      temperature: row.temperature,
      humidity: row.humidity,
      air_pressure: row.air_pressure,
    }));

    await client.end();

    // 6) Return the combined result
    return {
      statusCode: 200,
      body: JSON.stringify({
        video_url: videoUrl,
        images,
      }),
    };
  } catch (error) {
    console.error("Error in getVideo lambda:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
