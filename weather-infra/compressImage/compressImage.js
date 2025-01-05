const AWS = require('aws-sdk');
const sharp = require('sharp');
const { Client } = require('pg');

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
  const record = event.Records[0];
  const bucketName = record.s3.bucket.name;
  const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const compressedKey = objectKey.replace('non-compressed-images/', 'compressed-images/');

  if (!objectKey.startsWith('non-compressed-images/')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid object key, it should start with \'non-compressed-images/\'' }),
    };
  }

  try {
    await uploadCompressedImageToS3(bucketName, objectKey, compressedKey);

    const client = new Client(RDS_CONFIG);
    await client.connect();
    await insertCompressedImageRecord(client, bucketName, objectKey, compressedKey);
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Image compressed and database updated successfully.' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};

async function uploadCompressedImageToS3(bucketName, objectKey, compressedKey) {
  const originalImage = await s3.getObject({
    Bucket: bucketName,
    Key: objectKey,
  }).promise();

  const compressedImage = await sharp(originalImage.Body)
    .resize(800) 
    .jpeg({ quality: 80 })
    .toBuffer();

  await s3.putObject({
    Bucket: bucketName,
    Key: compressedKey,
    Body: compressedImage,
    ContentType: 'image/jpeg',
  }).promise();
}

async function insertCompressedImageRecord(client, bucketName, objectKey, compressedKey) {
  const updateQuery = `
    UPDATE images
    SET compressed_link = $1
    WHERE non_compressed_link = $2
  `;

  await client.query(updateQuery, [
    `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${compressedKey}`,
    `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${objectKey}`,
  ]);
}