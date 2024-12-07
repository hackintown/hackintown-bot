const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes default TTL

module.exports = cache;
