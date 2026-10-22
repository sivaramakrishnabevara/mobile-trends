const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory token store for admin session
const activeSessions = new Set();

// Helper to read DB
function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    return null;
  }
}

// Helper to write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// Authentication Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
  next();
}

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  if (!db || !db.admin) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (username === db.admin.username && password === db.admin.password) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        name: db.admin.name,
        username: db.admin.username
      }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password' });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ valid: false });
  const token = authHeader.replace('Bearer ', '').trim();
  if (activeSessions.has(token)) {
    return res.json({ valid: true });
  }
  return res.status(401).json({ valid: false });
});

// --- SETTINGS ROUTES ---
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

app.put('/api/settings', requireAdmin, (req, res) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// --- SERVICES ROUTES ---
app.get('/api/services', (req, res) => {
  const db = readDb();
  res.json(db.services || []);
});

app.post('/api/services', requireAdmin, (req, res) => {
  const db = readDb();
  const newService = {
    id: `srv-${Date.now()}`,
    title: req.body.title || 'New Repair Service',
    category: req.body.category || 'General',
    priceRange: req.body.priceRange || '₹499 - ₹1,499',
    duration: req.body.duration || '30-45 Mins',
    warranty: req.body.warranty || '3 Months Warranty',
    description: req.body.description || '',
    icon: req.body.icon || '🛠️',
    featured: Boolean(req.body.featured)
  };
  db.services.push(newService);
  writeDb(db);
  res.status(201).json({ success: true, service: newService });
});

app.put('/api/services/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Service not found' });

  db.services[idx] = { ...db.services[idx], ...req.body };
  writeDb(db);
  res.json({ success: true, service: db.services[idx] });
});

app.delete('/api/services/:id', requireAdmin, (req, res) => {
  const db = readDb();
  db.services = db.services.filter(s => s.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Service deleted' });
});

// --- INVENTORY ROUTES ---
app.get('/api/inventory', (req, res) => {
  const db = readDb();
  res.json(db.inventory || []);
});

app.post('/api/inventory', requireAdmin, (req, res) => {
  const db = readDb();
  const newItem = {
    id: `inv-${Date.now()}`,
    name: req.body.name,
    category: req.body.category || 'Accessories',
    price: Number(req.body.price) || 299,
    originalPrice: Number(req.body.originalPrice) || (Number(req.body.price) * 1.5),
    stock: Number(req.body.stock) || 10,
    tag: req.body.tag || 'New',
    specs: req.body.specs || '',
    image: req.body.image || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80'
  };
  db.inventory.push(newItem);
  writeDb(db);
  res.status(201).json({ success: true, item: newItem });
});

app.put('/api/inventory/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });

  db.inventory[idx] = { ...db.inventory[idx], ...req.body };
  writeDb(db);
  res.json({ success: true, item: db.inventory[idx] });
});

app.delete('/api/inventory/:id', requireAdmin, (req, res) => {
  const db = readDb();
  db.inventory = db.inventory.filter(i => i.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Item deleted' });
});

// --- BOOKINGS & REPAIR TRACKING ---
app.get('/api/bookings', requireAdmin, (req, res) => {
  const db = readDb();
  const statusFilter = req.query.status;
  let bookings = db.bookings || [];
  if (statusFilter && statusFilter !== 'All') {
    bookings = bookings.filter(b => b.status.toLowerCase() === statusFilter.toLowerCase());
  }
  res.json(bookings.reverse()); // most recent first
});

app.post('/api/bookings', (req, res) => {
  const { customerName, phone, deviceModel, serviceType, issueDescription } = req.body;
  if (!customerName || !phone || !deviceModel) {
    return res.status(400).json({ error: 'Please provide customer name, phone, and device model' });
  }

  const db = readDb();
  const ticketId = `MT-${Math.floor(1000 + Math.random() * 9000)}`;
  const newBooking = {
    id: ticketId,
    customerName,
    phone,
    deviceModel,
    serviceType: serviceType || 'General Diagnostic & Repair',
    issueDescription: issueDescription || 'General servicing required',
    estimatedCost: 'To Be Inspected',
    status: 'Received',
    technicianNotes: 'Device check-in booked online. Awaiting physical device at Madhura Nagar store.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.bookings = db.bookings || [];
  db.bookings.push(newBooking);
  writeDb(db);

  res.status(201).json({
    success: true,
    message: 'Repair ticket generated successfully',
    ticketId: newBooking.id,
    booking: newBooking
  });
});

app.get('/api/bookings/track/:identifier', (req, res) => {
  const db = readDb();
  const query = req.params.identifier.trim().toLowerCase();
  const matches = (db.bookings || []).filter(b => 
    b.id.toLowerCase() === query || 
    b.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
  );

  if (matches.length === 0) {
    return res.status(404).json({ error: 'No repair ticket found matching that ID or phone number' });
  }

  res.json({ success: true, results: matches });
});

app.put('/api/bookings/:id/status', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });

  const { status, technicianNotes, estimatedCost } = req.body;
  if (status) db.bookings[idx].status = status;
  if (technicianNotes !== undefined) db.bookings[idx].technicianNotes = technicianNotes;
  if (estimatedCost !== undefined) db.bookings[idx].estimatedCost = estimatedCost;
  db.bookings[idx].updatedAt = new Date().toISOString();

  writeDb(db);
  res.json({ success: true, booking: db.bookings[idx] });
});

app.delete('/api/bookings/:id', requireAdmin, (req, res) => {
  const db = readDb();
  db.bookings = db.bookings.filter(b => b.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Booking removed' });
});

// --- REVIEWS ROUTES ---
app.get('/api/reviews', (req, res) => {
  const db = readDb();
  res.json(db.reviews || []);
});

app.post('/api/reviews', (req, res) => {
  const { author, rating, comment, source } = req.body;
  if (!author || !rating || !comment) {
    return res.status(400).json({ error: 'All review fields are required' });
  }

  const db = readDb();
  const newReview = {
    id: `rev-${Date.now()}`,
    author,
    rating: Number(rating) || 5,
    source: source || 'Google Review',
    date: 'Just now',
    comment
  };
  db.reviews.unshift(newReview);
  writeDb(db);
  res.status(201).json({ success: true, review: newReview });
});

// --- STATS FOR ADMIN DASHBOARD ---
app.get('/api/stats', requireAdmin, (req, res) => {
  const db = readDb();
  const bookings = db.bookings || [];
  const inventory = db.inventory || [];
  const services = db.services || [];

  const totalBookings = bookings.length;
  const pending = bookings.filter(b => ['Received', 'Diagnosing', 'In Repair'].includes(b.status)).length;
  const completed = bookings.filter(b => ['Ready for Pickup', 'Delivered'].includes(b.status)).length;
  const totalProducts = inventory.length;
  const lowStock = inventory.filter(i => i.stock <= 10).length;

  res.json({
    totalBookings,
    pending,
    completed,
    totalProducts,
    lowStock,
    totalServices: services.length,
    storeRating: db.settings.rating,
    reviewCount: db.settings.reviewCount,
    googleRating: db.settings.googleRating || 4.8,
    googleReviewCount: db.settings.googleReviewCount || 245
  });
});

// Admin page direct route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback for SPA/HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with Graceful Port Fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`=======================================================`);
    console.log(`📱 MOBILE TRENDS (Madhura Nagar, Vijayawada)`);
    console.log(`🚀 Server running on: http://localhost:${port}`);
    console.log(`🛡️  Admin Dashboard:   http://localhost:${port}/admin`);
    console.log(`🔑 Admin Login:       admin@mobiletrends.com / admin123`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is in use. Trying port ${Number(port) + 1}...`);
      startServer(Number(port) + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);

