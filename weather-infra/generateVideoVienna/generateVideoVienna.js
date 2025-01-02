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

  const dateString = '2024-12-30';
  const hourString = '11';

  console.log('Current UTC Time:', now.toISO());
  console.log('Previous Hour:', previousHour.toISO());

  const videoKey = `videos/${topic}/${dateString}_${hourString}-00.mp4`;
  const videoPath = `/tmp/${hourString}-00.mp4`;

  try {
    const client = new Client(RDS_CONFIG);
    await client.connect();

    const query = `
      SELECT compressed 
      FROM images
      WHERE topic = $1 AND timestamp >= $2 AND timestamp < $3
      ORDER BY timestamp ASC
    `;
    const startTime = `${dateString}T${hourString}:00:00Z`;
    const endTime = `${dateString}T${String(Number(hourString) + 1).padStart(2, '0')}:00:00Z`;
    const { rows } = await client.query(query, [topic, startTime, endTime]);
    console.log('Query Parameters:', [topic, startTime, endTime]);

    if (!rows.length) {
      console.log('No images found for the previous hour.');
      return { statusCode: 200, body: 'No images to process.' };
    }

    const imagePaths = [];
    for (const [index, { compressed }] of rows.entries()) {
      const imagePath = `/tmp/image${index}.jpg`;
      const s3Key = new URL(compressed).pathname.substring(1);

      const image = await s3
        .getObject({ Bucket: BUCKET_NAME, Key: s3Key })
        .promise();
      fs.writeFileSync(imagePath, image.Body);
      imagePaths.push(imagePath);
      console.log("image path: " + imagePath);
      console.log("s3 key:" + s3Key);
    }

    const fileListPath = '/tmp/filelist.txt';
    let fileListContent = '';
    imagePaths.forEach((imgPath, idx) => {
      fileListContent += `file '${imgPath}'\n`;
      fileListContent += `duration 2\n`;
    });
    fileListContent += `file '${imagePaths[imagePaths.length - 1]}'\n`;

    fs.writeFileSync(fileListPath, fileListContent);
    console.log('File list content:', fileListContent);

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

    console.log('Video generated successfully');

    const videoBuffer = fs.readFileSync(videoPath);
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: videoKey,
        Body: videoBuffer,
        ContentType: 'video/mp4',
      })
      .promise();

    console.log('Video uploaded successfully:', videoKey);

    const insertQuery = `
      INSERT INTO videos (topic, video_url, timestamp)
      VALUES ($1, $2, $3)
    `;
    await client.query(insertQuery, [
      topic,
      `https://${process.env.S3_BUCKET}.s3.${BUCKET_REGION}.amazonaws.com/${videoKey}`,
      startTime,
    ]);

    console.log('Video entry added to the database.');

    imagePaths.forEach((imgPath) => fs.unlinkSync(imgPath));
    fs.unlinkSync(fileListPath);
    fs.unlinkSync(videoPath);

    await client.end();
    return { statusCode: 200, body: 'Video generated and uploaded successfully.' };
  } catch (error) {
    console.error('Error generating video:', error);
    return { statusCode: 500, body: 'Failed to generate video.' };
  }
};
