const { Client } = require("pg");

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
  const { topic } = event.queryStringParameters || {};

  if (!topic) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Topic is required" }),
    };
  }

  try {
    const client = new Client(RDS_CONFIG);
    await client.connect();

    const query = `
      SELECT DATE(timestamp) as date, EXTRACT(HOUR FROM timestamp) as hour
      FROM videos
      WHERE topic = $1
      ORDER BY date ASC, hour ASC
    `;
    const { rows } = await client.query(query, [topic]);

    const dates = rows.reduce((acc, row) => {
      const date = row.date.toISOString().split("T")[0];
      const hour = row.hour;

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(hour);

      return acc;
    }, {});

    await client.end();

    const arrayDates = Object.entries(dates).map(([date, hours]) => ({
      date,
      hours: hours.map((h) => Number(h)),
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ dates: arrayDates }),
    };    

  } catch (error) {
    console.error("Error fetching available videos:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
