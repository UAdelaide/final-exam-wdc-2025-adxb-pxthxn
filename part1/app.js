const express = require("express");
const mysql = require("mysql2/promise");
const app = express();
const port = 3000;

// connfigure connection to database
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "DogWalkService"
};

// insert sample data, hard coded for now.
async function seedDatabase(connection) {
  await connection.execute(`DELETE FROM WalkRatings`);
  await connection.execute(`DELETE FROM WalkApplications`);
  await connection.execute(`DELETE FROM WalkRequests`);
  await connection.execute(`DELETE FROM Dogs`);
  await connection.execute(`DELETE FROM Users`);

  // Users
  await connection.execute(`
    INSERT INTO Users (username, email, password_hash, role)
    VALUES
    ('alice123', 'alice@example.com', 'hashed123', 'owner'),
    ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
    ('carol123', 'carol@example.com', 'hashed789', 'owner'),
    ('davewalker', 'dave@example.com', 'hashed321', 'walker'),
    ('emily123', 'emily@example.com', 'hashed654', 'owner')
  `);

  // Dogs
  await connection.execute(`
    INSERT INTO Dogs (owner_id, name, size)
    VALUES
    ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
    ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
    ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Rocky', 'large'),
    ((SELECT user_id FROM Users WHERE username = 'emily123'), 'Daisy', 'medium'),
    ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Coco', 'small')
  `);

  // WalkRequests
  await connection.execute(`
    INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
    VALUES
    ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
    ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
    ((SELECT dog_id FROM Dogs WHERE name = 'Rocky'), '2025-06-11 10:00:00', 60, 'Riverbank Trail', 'open'),
    ((SELECT dog_id FROM Dogs WHERE name = 'Daisy'), '2025-06-11 14:30:00', 30, 'Botanic Gardens', 'cancelled'),
    ((SELECT dog_id FROM Dogs WHERE name = 'Coco'), '2025-06-12 07:45:00', 20, 'City Park', 'completed')
  `);

  // WalkRatings
  await connection.execute(`
    INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating)
    VALUES
    ((SELECT request_id FROM WalkRequests WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Coco')),
     (SELECT user_id FROM Users WHERE username = 'bobwalker'),
     (SELECT user_id FROM Users WHERE username = 'carol123'),
     4),
    ((SELECT request_id FROM WalkRequests WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Bella')),
     (SELECT user_id FROM Users WHERE username = 'bobwalker'),
     (SELECT user_id FROM Users WHERE username = 'carol123'),
     5)
  `);
}

// === routes === //

// dogs route
app.get("/api/dogs", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT Dogs.name AS dog_name, Dogs.size, Users.username AS owner_username
      FROM Dogs
      JOIN Users ON Dogs.owner_id = Users.user_id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching dogs" });
  }
});

// open walk requests route
app.get("/api/walkrequests/open", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT WalkRequests.request_id, Dogs.name AS dog_name,
             WalkRequests.requested_time, WalkRequests.duration_minutes,
             WalkRequests.location, Users.username AS owner_username
      FROM WalkRequests
      JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
      JOIN Users ON Dogs.owner_id = Users.user_id
      WHERE WalkRequests.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching open walk requests" });
  }
});

// open walk requests route
app.get("/api/walkers/summary", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS average_rating,
        COUNT(DISTINCT wr.request_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      LEFT JOIN WalkRequests wr ON wr.request_id = r.request_id AND wr.status = 'completed'
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching walker summaries" });
  }
});

// Start server and seed DB
(async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await seedDatabase(connection);
    console.log("Sample data inserted.");
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
})();
