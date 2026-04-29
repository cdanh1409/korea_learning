const vocabService = require("../services/vocabService");

exports.getByFilter = async (req, res) => {
  try {
    const { level, topicId } = req.query;

    const data = await vocabService.getByFilter(level, topicId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
