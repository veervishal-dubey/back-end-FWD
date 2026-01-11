const express = require("express");
const pool = require("./database");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config({ path: "./.env" });

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());              // Allow frontend → backend
app.use(express.json());      // Parse JSON body

/* ===============================
   BASIC TEST ROUTE
================================ */
app.get("/", (req, res) => {
  res.send("Server backend is up and running.");
});

/* ===============================
   USERS
================================ */
app.get("/api/rainfall", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT location, avg_rainfall, runoff_coeff FROM rainfall_data"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/rainfall/:city", async (req, res) => {
  try {
    const city = `%${req.params.city}%`;
    const [rows] = await pool.query(
      "SELECT * FROM rainfall_data WHERE location LIKE ?",
      [city]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/user/latest-city", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT city FROM location_data ORDER BY id DESC LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No user location found" });
    }

    res.json({ city: rows[0].city });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


/* ===============================
   RAINFALL DATA
================================ */
app.get("/rainfall", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rainfall_data;");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/* ===============================
   CALCULATIONS
================================ */
app.get("/calculate/:site_id", async (req, res) => {
  try {
    const [calcs] = await pool.query(
      "CALL harvest_calculation(?);",
      [req.params.site_id]
    );
    res.json(calcs[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/recommended/:volume", async (req, res) => {
  try {
    const [struct] = await pool.query(
      "CALL recommended_structures(?);",
      [Number(req.params.volume)]
    );
    res.json(struct[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/summary/:user_Id", async (req, res) => {
  try {
    const [summary] = await pool.query(
      "CALL generate_summary(?);",
      [req.params.user_Id]
    );
    res.json(summary[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/* ===============================
   SAVE LOCATION + FORM DATA
   (CALCULATE PAGE)
================================ */
app.post("/api/location", async (req, res) => {
  const {
    city,
    latitude,
    longitude,
    length,
    breadth,
    material,
    slope,
    runoff
  } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Location data missing" });
  }

  try {
    const sql = `
      INSERT INTO location_data
      (city, latitude, longitude, length, breadth, material, slope, runoff)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      city,
      latitude,
      longitude,
      length,
      breadth,
      material,
      slope,
      runoff
    ];

    const [result] = await pool.query(sql, values);

    res.json({
      message: "Location and calculation data saved successfully",
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error while saving data" });
  }
});

/* ===============================
   AUTHENTICATION
================================ */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [auth] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (auth.length === 0) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    const user = auth[0];
    if (user.password !== password) {
      return res.status(410).json({ error: "Wrong Password Entered." });
    }

    const token = jwt.sign(
      { user_id: user.userid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login Successful", token });

  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [exists] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    );

    res.json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ error: "Database error while registering user" });
  }
});

console.log(">>> report route registered");


app.get("/api/report/latest", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM location_data ORDER BY id DESC LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No report data found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});



/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
