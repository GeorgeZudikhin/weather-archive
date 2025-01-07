const AWS = require('aws-sdk');
const axios = require('axios');
const { randomUUID } = require('crypto');
const FormData = require('form-data');

const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    const topic = event.topic;
    console.log("Topic: ", topic);
    if (!topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic is required' }),
      };
    }

    const imageKey = await getRandomImageKey(topic);
    const imageBuffer = await getImageBuffer(imageKey);

    const temperature = getRandomNumberWithinRange(-5, 35);
    const humidity = getRandomNumberWithinRange(80, 120);
    const air_pressure = getRandomNumberWithinRange(900, 1100);
    const form = createFormData(topic, temperature, humidity, air_pressure, imageBuffer);
    const response = await axios.post(
      process.env.UPLOAD_URL,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    console.log('Upload response:', response.data);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Image uploaded successfully' }),
    };
  } catch (error) {
    console.error('Error in webcam Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error }),
    };
  }
};

async function getRandomImageKey(topic) {
  const objects = await s3
    .listObjectsV2({
      Bucket: process.env.WEBCAM_BUCKET_NAME,
      Prefix: `${topic}/`,
    })
    .promise();

  if (!objects.Contents.length) {
    throw new Error(`No images found for topic: ${topic}`);
  }

  const randomIndex = Math.floor(Math.random() * objects.Contents.length);
  return objects.Contents[randomIndex].Key;
}

async function getImageBuffer(key) {
  const object = await s3
    .getObject({
      Bucket: process.env.WEBCAM_BUCKET_NAME,
      Key: key,
    })
    .promise();

  return object.Body;
}

function getRandomNumberWithinRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createFormData(topic, temperature, humidity, airPressure, imageBuffer) {
  const formData = new FormData();
  formData.append('topic', topic);
  formData.append('temperature', temperature);
  formData.append('humidity', humidity);
  formData.append('air_pressure', airPressure);
  formData.append('image', imageBuffer, {
    filename: `${randomUUID()}.jpg`,
    contentType: 'image/jpeg',
  });

  return formData;
}
