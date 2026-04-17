const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'zeno-secret-key-123';

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Checkout
router.post('/checkout', auth, (req, res) => {
  const { cartItems, totalPrice } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const userId = req.user.id;

  try {
    const insertOrder = db.prepare(`
      INSERT INTO orders (user_id, total_price, status)
      VALUES (?, ?, ?)
    `);

    const result = insertOrder.run(userId, totalPrice, 'completed');
    const orderId = result.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of cartItems) {
      insertItem.run(orderId, item.id, item.quantity, item.price);
    }

    res.status(201).json({ orderId, message: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Order processing failed" });
  }
});

module.exports = router;
