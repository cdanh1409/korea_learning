const topicService = require("../services/topicService");

exports.getAll = async (req, res) => {
    try {
        const data = await topicService.getAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};