let express = require("express");
let cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const { DATABASE_URL } = process.env;

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { require: true },
});

app.get("/bookings", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM bookings ORDER BY id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get("/bookings/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const result = await client.query("SELECT * FROM bookings WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post("/bookings", async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, date, time, phone_number, email, user_id } =
      req.body;

    const result = await client.query(
      `INSERT INTO bookings
      (title, description, date, time, phone_number, email, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [title, description, date, time, phone_number, email, user_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put("/bookings/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, description, date, time, phone_number, email, user_id } =
      req.body;

    const result = await client.query(
      `UPDATE bookings SET
        title = $1,
        description = $2,
        date = $3,
        time = $4,
        phone_number = $5,
        email = $6,
        user_id = $7
       WHERE id = $8
       RETURNING *`,
      [title, description, date, time, phone_number, email, user_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete("/bookings/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("DELETE FROM bookings WHERE id = $1", [id]);

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Only start the server when running locally (e.g. `node index.js`)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel's serverless function
module.exports = app;
