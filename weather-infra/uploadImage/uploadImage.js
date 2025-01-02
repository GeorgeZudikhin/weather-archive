const AWS = require('aws-sdk');
const { Client } = require('pg');
const busboy = require('busboy');
const { DateTime } = require("luxon");

const s3 = new AWS.S3();
const bucketRegion = 'us-east-1';

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
    const { fields, fileBuffer } = await parseFormData(event);

    const { topic, temperature, humidity, air_pressure } = fields;
    if (!topic || !temperature || !humidity || !air_pressure || !fileBuffer) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields or image" }),
      };
    }
    const nowUtc = DateTime.utc();
    const timestamp = nowUtc.toISO();

    const imageKey = `non-compressed-images/${topic}/${timestamp}.jpg`;
    const s3Url = `https://${process.env.S3_BUCKET}.s3.${bucketRegion}.amazonaws.com/${imageKey}`;
    await uploadToS3(fileBuffer, imageKey);

    const client = new Client(RDS_CONFIG);
    await client.connect();

    await insertImageRecord({
      client,
      topic,
      timestamp,
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      air_pressure: parseFloat(air_pressure),
      non_compressed_link: s3Url,
    });

    await client.end();

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Image uploaded successfully', imageUrl: s3Url }),
      };      
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

async function parseFormData(event) {
  const bb = busboy({
    headers: { "content-type": event.headers["content-type"] },
  });

  let fields = {};
  let fileBuffer = null;

  return new Promise((resolve, reject) => {
    bb.on("file", (fieldname, file) => {
      if (fieldname === "image") {
        const chunks = [];
        file.on("data", (chunk) => chunks.push(chunk));
        file.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
      }
    });

    bb.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    bb.on("finish", () => resolve({ fields, fileBuffer }));
    bb.on("error", reject);

    bb.write(Buffer.from(event.body, "base64"));
    bb.end();
  });
}

async function uploadToS3(fileBuffer, key) {
  return s3
    .putObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "image/jpeg",
    })
    .promise();
}

async function insertImageRecord({
  client,
  topic,
  timestamp,
  temperature,
  humidity,
  air_pressure,
  non_compressed_link,
}) {
  const insertQuery = `
    INSERT INTO images (
      topic, timestamp, temperature, humidity, air_pressure, non_compressed_link
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;

  await client.query(insertQuery, [
    topic,
    timestamp,
    temperature,
    humidity,
    air_pressure,
    non_compressed_link,
  ]);
}