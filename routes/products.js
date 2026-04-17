const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

// Get all products
router.get('/', (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  res.json(products);
});

// Get single product
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// Admin: Add new product
router.post('/', adminAuth, (req, res) => {
  const { name, description, price, image_url, category, stock } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({ error: "Name, price, and category are required" });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO products (name, description, price, image_url, category, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(name, description, price, image_url, category, stock || 10);
    res.status(201).json({ id: info.lastInsertRowid, name, price });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Update product
router.put('/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, category, stock } = req.body;

  try {
    const update = db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, image_url = ?, category = ?, stock = ?
      WHERE id = ?
    `);
    const info = update.run(name, description, price, image_url, category, stock, id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Delete product
router.delete('/:id', adminAuth, (req, res) => {
  const { id } = req.params;

  try {
    const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
