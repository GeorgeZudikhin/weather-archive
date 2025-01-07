const { Client } = require("pg");
const { DateTime } = require("luxon");
const Redis = require("ioredis");

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

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  tls: {
    rejectUnauthorized: false 
  }
});

exports.handler = async (event) => {
  try {
    const { topic, date, hour } = event.queryStringParameters || {};
    if (!topic || !date || hour == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    const cacheKey = `weather:${topic}:${date}:${hour}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit for: ", cacheKey);
      return {
        statusCode: 200,
        body: cachedData,
      };
    }

    const startTime = DateTime.fromISO(`${date}T${String(hour).padStart(2, "0")}:00:00Z`);
    const endTime = startTime.plus({ hours: 1 });

    const client = new Client(RDS_CONFIG);
    await client.connect();
    const videoUrl = await getVideoUrl(client, topic, startTime);

    const imagesMetadata = await queryMetadata(client, topic, startTime, endTime);

    await client.end();

    const responseBody = JSON.stringify({
      video_url: videoUrl,
      imagesMetadata,
    });

    await redis.set(cacheKey, responseBody, "EX", 3600);

    return {
      statusCode: 200,
      body: responseBody,
    };
  } catch (error) {
    console.error("Error in getWeather lambda:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error: " + error }),
    };
  }
};

async function getVideoUrl(client, topic, timeStamp) {
  const videoQuery = `
      SELECT video_url
      FROM videos
      WHERE topic = $1
        AND timestamp = $2
      LIMIT 1
  `;
  const videoRes = await client.query(videoQuery, [topic, timeStamp]);

  let videoUrl = null;
  if (videoRes.rows.length > 0) {
    videoUrl = videoRes.rows[0].video_url;
  }
  return videoUrl;
 }

async function queryMetadata(client, topic, startTime, endTime) {
  const imageQuery = `
      SELECT temperature, humidity, air_pressure
      FROM images
      WHERE topic = $1
        AND timestamp >= $2
        AND timestamp < $3
      ORDER BY timestamp ASC
  `;
  const imagesRes = await client.query(imageQuery, [topic, startTime.toISO(), endTime.toISO()]);
  return imagesRes.rows.map((row) => ({
    temperature: row.temperature,
    humidity: row.humidity,
    air_pressure: row.air_pressure,
  }));
}