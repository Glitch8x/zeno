const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ecommerce.db'));

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    category TEXT,
    stock INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Seed Data - 18 curated products
const seedProducts = [
  // Decor
  { name: "Linear Stone Vase", description: "A sculptural piece for the modern home. Textured ceramic with a matte bone finish, perfect for dried arrangements.", price: 68.00, image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80", category: "Decor" },
  { name: "Sculptural Arch Mirror", description: "A statement arch mirror with a brushed brass frame and antiqued glass. Transforms any wall into a focal point.", price: 245.00, image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80", category: "Decor" },
  { name: "Woven Rattan Basket", description: "Handwoven rattan storage basket with natural texture. Functional art for your living space.", price: 55.00, image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", category: "Decor" },
  { name: "Ceramic Bud Vase Set", description: "A trio of hand-thrown stoneware vessels in complementary matte glazes. Sold as a set of three.", price: 78.00, image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80", category: "Decor" },
  // Kitchen
  { name: "Hand-Blown Glass Carafe", description: "Minimalist utility. Each piece is uniquely formed with subtle ripples and a weighted base for effortless pouring.", price: 52.00, image_url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80", category: "Kitchen" },
  { name: "Matte Black Kettle", description: "Precision pour-over kettle in a powder-coated matte black finish. Holds 1L with a heat-resistant handle.", price: 89.00, image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80", category: "Kitchen" },
  { name: "Stone Cutting Board", description: "Solid marble board with anti-slip feet. Doubles as a serving platter for cheese and charcuterie.", price: 110.00, image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", category: "Kitchen" },
  { name: "Linen Table Runner", description: "100% washed linen table runner with raw hem edges. Adds texture and warmth to any dining table.", price: 42.00, image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", category: "Kitchen" },
  // Textiles
  { name: "Raw Linen Throw", description: "Tactile warmth. Woven from 100% Belgian flax with a soft, lived-in feel and natural raw-edge details.", price: 145.00, image_url: "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?w=800&q=80", category: "Textiles" },
  { name: "Merino Wool Cushion", description: "Cloud-soft merino wool cushion cover with a concealed zip. Available in ecru, sage, and charcoal.", price: 65.00, image_url: "https://images.unsplash.com/photo-1540638349517-3abd5afc5847?w=800&q=80", category: "Textiles" },
  { name: "Waffle Weave Bath Towel", description: "Hotel-grade Turkish cotton waffle towel. Highly absorbent with a lightweight, fast-drying weave.", price: 48.00, image_url: "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=800&q=80", category: "Textiles" },
  // Lighting
  { name: "Cast Iron Candle Holder", description: "Architectural and enduring. A heavy-duty geometric form that anchors any tabletop setting.", price: 38.00, image_url: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800&q=80", category: "Lighting" },
  { name: "Concrete Table Lamp", description: "Cast concrete base with a natural linen drum shade. Pairs warm and industrial for effortless style.", price: 175.00, image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80", category: "Lighting" },
  { name: "Beeswax Pillar Candle", description: "Hand-poured pure beeswax pillar candles. Clean burning with a soft honey scent. Set of two.", price: 32.00, image_url: "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800&q=80", category: "Lighting" },
  // Utility
  { name: "Handcrafted Teak Tray", description: "Organic geometry. Carved from a single piece of reclaimed teak with a naturally oiled finish.", price: 85.00, image_url: "https://images.unsplash.com/photo-1616486701797-0f33f61038ec?w=800&q=80", category: "Utility" },
  { name: "Leather Valet Tray", description: "Full-grain vegetable-tanned leather tray. The perfect minimal landing spot for your everyday carry.", price: 72.00, image_url: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80", category: "Utility" },
  // Wellness
  { name: "Mist Fog Diffuser", description: "Clean atmosphere. A ceramic ultrasonic diffuser that releases a fine mist of essential oils into your space.", price: 120.00, image_url: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&q=80", category: "Wellness" },
  { name: "Natural Body Oil Set", description: "A curated trio of cold-pressed body oils in recycled amber glass. Jojoba, rosehip, and marula.", price: 95.00, image_url: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&q=80", category: "Wellness" },
];

// Reseed only if product count doesn't match target
const currentCount = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
if (currentCount !== seedProducts.length) {
  db.exec("DELETE FROM order_items");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM products");
  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, image_url, category)
    VALUES (@name, @description, @price, @image_url, @category)
  `);
  for (const product of seedProducts) {
    insertProduct.run(product);
  }
  console.log(`Database reseeded with ${seedProducts.length} products.`);
} else {
  console.log(`Products already seeded (${currentCount} items).`);
}

module.exports = db;
