const express = require("express");
const router = express.Router();
const { pool, poolConnect } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    await poolConnect;

    const request = pool.request();

    const result = await request.query(`
  SELECT 
    t.Id,
    t.Name,
    COUNT(v.Id) AS WordCount,
    CASE 
      WHEN COUNT(v.Id) = 0 THEN 0
      WHEN COUNT(CASE WHEN v.Level >= 3 THEN 1 END) > 0 THEN 3
      WHEN COUNT(CASE WHEN v.Level = 2 THEN 1 END) > 0 THEN 2
      ELSE 1
    END AS Level
  FROM Topics t
  LEFT JOIN Vocabulary v 
    ON v.TopicId = t.Id
  GROUP BY t.Id, t.Name
  ORDER BY t.Id
`);

    console.log("🔥 TOPICS WITH COUNT:", result.recordset);

    res.json(result.recordset);
  } catch (err) {
    console.log("❌ Topics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
