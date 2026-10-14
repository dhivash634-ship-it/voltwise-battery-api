const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let latestData = null;
let history = [];

app.get("/", (req, res) => {
  res.send("VoltWise Battery API is running!");
});

app.post("/api/telemetry", (req, res) => {
  const d = req.body;

  const fields = [
    "cell_voltage",
    "pack_current",
    "temperature",
    "cycle_count",
    "state_of_health"
  ];

  for (const field of fields) {
    if (typeof d[field] !== "number" ||
        !Number.isFinite(d[field])) {
      return res.status(400).json({
        error: "Invalid field: " + field
      });
    }
  }

  if (d.state_of_health < 0 ||
      d.state_of_health > 100 ||
      d.cycle_count < 0) {
    return res.status(400).json({
      error: "Invalid battery values"
    });
  }

  let level = 4;
  let classification = "Specialist Assessment Required";

  if (d.state_of_health >= 80) {
    level = 1;
    classification = "Primary EV Assessment";
  } else if (d.state_of_health >= 70) {
    level = 2;
    classification = "Second-Life Candidate";
  } else if (d.state_of_health >= 60) {
    level = 3;
    classification = "Recycling Assessment";
  }

  latestData = {
    ...d,
    level,
    classification,
    timestamp: new Date().toISOString()
  };

  history.push(latestData);
  if (history.length > 100) history.shift();

  res.json({
    success: true,
    data: latestData
  });
});

app.get("/api/latest", (req, res) => {
  res.json(latestData);
});

app.get("/api/history", (req, res) => {
  res.json(history);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("VoltWise API running on port " + PORT);
});
