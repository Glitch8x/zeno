const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'zeno-secret-key-123';

const adminAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = adminAuth;
