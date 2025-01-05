const AWS = require('aws-sdk');
const { Client } = require('pg');
const { execSync } = require('child_process');
const { DateTime } = require('luxon');
const fs = require('fs');

const s3 = new AWS.S3();

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

const BUCKET_NAME = process.env.S3_BUCKET;
const BUCKET_REGION = 'us-east-1';
const topic = 'Vienna';

exports.handler = async () => {
  const PATH = process.env.PATH;
  process.env.PATH = `/opt/bin:${PATH}`;

  const now = DateTime.utc();
  const previousHour = now.minus({ hours: 1 });
  // const dateString = previousHour.toISODate();
  // const hourString = previousHour.hour.toString().padStart(2, '0');

  const dateString = '2025-01-04';
  const hourString = '22';

  const videoKey = `videos/${topic}/${dateString}_${hourString}-00.mp4`;
  const videoPath = `/tmp/${hourString}-00.mp4`;

  try {
    const client = new Client(RDS_CONFIG);
    await client.connect();

    const imageLinks = await getImageLinks(client, dateString, hourString);
    if (!imageLinks.length) {
      return { statusCode: 200, body: `No images found for this hour: ${dateString}-${hourString}.` };
    }

    const imagePaths = await saveS3ImagesToLocalStorage(imageLinks);
    const fileListPath = await createFileWithPathsToLocalImages(imagePaths);
    await generateVideo(fileListPath, videoPath); 
    await uploadVideoToS3(videoPath, videoKey);
    await insertVideoRecord(client, videoKey, `${dateString}T${hourString}:00:00Z`);
    
    await cleanUp(imagePaths, fileListPath, videoPath);
    await client.end();

    return { statusCode: 200, body: 'Video generated and uploaded successfully.' };
  } catch (error) {
    console.error('Error generating video:', error);
    return { statusCode: 500, body: 'Failed to generate video.' };
  }
};

async function getImageLinks(client, dateString, hourString) {
  const query = `
      SELECT compressed_link
      FROM images
      WHERE topic = $1 AND timestamp >= $2 AND timestamp < $3
      ORDER BY timestamp ASC
    `;
  const startTime = `${dateString}T${hourString}:00:00Z`;
  const endTime = `${dateString}T${String(Number(hourString) + 1).padStart(2, '0')}:00:00Z`;
  const { rows } = await client.query(query, [topic, startTime, endTime]);

  return rows;
}

async function saveS3ImagesToLocalStorage(imageLinks) {
  const imagePaths = [];
  for (const [index, { compressed_link }] of imageLinks.entries()) {
    const imagePath = `/tmp/image${index}.jpg`;
    const s3Key = new URL(compressed_link).pathname.substring(1);

    const image = await s3
      .getObject({ Bucket: BUCKET_NAME, Key: s3Key })
      .promise();
    fs.writeFileSync(imagePath, image.Body);
    imagePaths.push(imagePath);
  }
  return imagePaths;
}

async function createFileWithPathsToLocalImages(imagePaths) {
  const fileListPath = '/tmp/filelist.txt';
  let fileListContent = '';
  imagePaths.forEach((imgPath, idx) => {
    fileListContent += `file '${imgPath}'\n`;
    fileListContent += `duration 2\n`;
  });
  fileListContent += `file '${imagePaths[imagePaths.length - 1]}'\n`;

  fs.writeFileSync(fileListPath, fileListContent);
  return fileListPath;
}

async function generateVideo(fileListPath, videoPath) {
  try {
    execSync(
      `ffmpeg -f concat -safe 0 -i ${fileListPath} -vsync vfr ` +
      `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -pix_fmt yuv420p ` +
      `-c:v libx264 -crf 23 -preset veryfast ${videoPath}`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.error('FFmpeg error:', error.message);
    throw error;
  }
}

async function uploadVideoToS3(videoPath, videoKey) {
  const videoBuffer = fs.readFileSync(videoPath);
  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: videoKey,
      Body: videoBuffer,
      ContentType: 'video/mp4',
    })
    .promise();
}

async function insertVideoRecord(client, videoKey, startTime) {
  const insertQuery = `
    INSERT INTO videos (topic, video_url, timestamp)
    VALUES ($1, $2, $3)
  `;
  await client.query(insertQuery, [
    topic,
    `https://${process.env.S3_BUCKET}.s3.${BUCKET_REGION}.amazonaws.com/${videoKey}`,
    startTime,
  ]);
}

async function cleanUp(imagePaths, fileListPath, videoPath) {
  imagePaths.forEach((imgPath) => fs.unlinkSync(imgPath));
  fs.unlinkSync(fileListPath);
  fs.unlinkSync(videoPath);
}