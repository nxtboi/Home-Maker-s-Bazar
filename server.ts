import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from 'fs';
import { Product, Review, Order, OrderStatus, TrackingUpdate, SupportTicket } from './src/types';

dotenv.config();

// Razorpay Lazy Initialization Helper
let razorpayInstance: any = null;
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return { instance: razorpayInstance, key_id, key_secret };
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Database
let products: Product[] = [
  {
    id: 'prod-1',
    name: 'Smart Phone Pro Max (128GB)',
    description: 'High-performance smart phone with triple camera setup, 120Hz display, and all-day battery life.',
    price: 84999,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Accessories',
    rating: 4.8,
    stock: 15,
  },
  {
    id: 'prod-2',
    name: 'Super Bass Wireless Headphones',
    description: 'Over-ear Bluetooth headphones with active noise cancellation, deep bass, and 40 hours playtime.',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Accessories',
    rating: 4.5,
    stock: 25,
  },
  {
    id: 'prod-3',
    name: 'Classic Leather Men\'s Wallet',
    description: 'Handcrafted genuine leather wallet with RFID blocking, 8 card slots, and dual currency compartments.',
    price: 999,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Accessories',
    rating: 4.2,
    stock: 50,
  },
  {
    id: 'prod-4',
    name: 'Ergonomic Premium Office Chair',
    description: 'High-back mesh chair with adjustable lumbar support, 3D armrests, and synchro-tilt mechanism.',
    price: 11999,
    image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Furniture',
    rating: 4.6,
    stock: 8,
  },
  {
    id: 'prod-5',
    name: 'Double Walled Stainless Steel Bottle',
    description: 'Vacuum insulated water bottle that keeps drinks cold for 24 hours and hot for 12 hours. 1 Litre.',
    price: 799,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Kitchenware',
    rating: 4.4,
    stock: 100,
  },
];

let reviews: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    userName: 'Aakash Verma',
    rating: 5,
    comment: 'Bahut hi premium phone hai! Battery life kamaal ki hai aur camera quality top notch.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-2',
    productId: 'prod-1',
    userName: 'Priya Sharma',
    rating: 4.6,
    comment: 'Display quality super smooth hai. thoda mehnga hai par features mast hain.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-3',
    productId: 'prod-2',
    userName: 'Rahul Singh',
    rating: 4.5,
    comment: 'Bass sound quality is very good. ANC makes a huge difference while traveling.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-4',
    productId: 'prod-3',
    userName: 'Vijay Kumar',
    rating: 4,
    comment: 'Authentic leather design, premium finish. It has plenty of card slots.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let orders: Order[] = [
  {
    id: 'ORD-9876',
    items: [
      {
        productId: 'prod-2',
        name: 'Super Bass Wireless Headphones',
        price: 2499,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      }
    ],
    totalAmount: 2499,
    status: 'shipped',
    customerName: 'Rohit Mehra',
    customerPhone: '9876543210',
    customerAddress: 'Flat 405, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103',
    paymentMethod: 'UPI',
    paymentStatus: 'success',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    trackingUpdates: [
      {
        status: 'placed',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        note: "Order successfully placed on Home Maker's Bazar.",
      },
      {
        status: 'processing',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        note: 'Product packed and verified at our Bengaluru warehouse.',
      },
      {
        status: 'shipped',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        note: 'Dispatched via BlueDart Express. Tracking ID: BD8920184.',
      }
    ]
  }
];

interface DBUser {
  username: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
}

let users: DBUser[] = [
  {
    username: 'sanju1234',
    passwordHash: 'sanju1234',
    name: 'Sanju Admin',
    role: 'admin',
  }
];

let tickets: SupportTicket[] = [
  {
    id: 'TKT-3129',
    name: 'Rohit Mehra',
    email: 'rohit@mehra.com',
    phone: '9876543210',
    category: 'delivery',
    subject: 'Headphones delivery delayed',
    message: 'Mera order BD8920184 abhi tak deliver nahi hua hai. BlueDart tracking shows in transit but delivery date was yesterday. Please help.',
    status: 'open',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    orderId: 'ORD-9876'
  },
  {
    id: 'TKT-1082',
    name: 'Aakash Verma',
    email: 'aakash@verma.com',
    phone: '9911223344',
    category: 'refund',
    subject: 'Refund for cancelled order',
    message: 'Maine ek double walled steel bottle cancel kiya tha. Mera refund kab tak credit hoga?',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reply: 'Namaste Aakash, aapka refund process kar diya gaya hai. Agle 2-3 business days mein aapke bank account mein credit ho jayega. Dhanyawad!'
  }
];

const DB_FILE = path.join(process.cwd(), 'db.json');

// Save Database to file
const saveDatabase = () => {
  try {
    const data = {
      products,
      reviews,
      orders,
      users,
      tickets,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
};

// Load Database from file
const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data.products) products = data.products;
      if (data.reviews) reviews = data.reviews;
      if (data.orders) orders = data.orders;
      if (data.users) users = data.users;
      if (data.tickets) tickets = data.tickets;
      console.log('Database loaded successfully from:', DB_FILE);
    } else {
      saveDatabase();
      console.log('Initial database file created at:', DB_FILE);
    }
  } catch (err) {
    console.error('Failed to load database:', err);
  }
};

loadDatabase();

// Helper function to update aggregate rating of a product
const updateProductRating = (productId: string) => {
  const prodReviews = reviews.filter(r => r.productId === productId);
  if (prodReviews.length === 0) return;
  const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
  const product = products.find(p => p.id === productId);
  if (product) {
    product.rating = parseFloat(avg.toFixed(1));
  }
};

// ---------------- API Routes ----------------

// 1. PRODUCTS
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, description, price, image, category, stock } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price and category are required' });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    description: description || '',
    price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category,
    rating: 0,
    stock: stock !== undefined ? Number(stock) : 10,
  };

  products.unshift(newProduct);
  saveDatabase();
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, stock } = req.body;
  
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products[idx] = {
    ...products[idx],
    name: name !== undefined ? name : products[idx].name,
    description: description !== undefined ? description : products[idx].description,
    price: price !== undefined ? Number(price) : products[idx].price,
    image: image !== undefined ? image : products[idx].image,
    category: category !== undefined ? category : products[idx].category,
    stock: stock !== undefined ? Number(stock) : products[idx].stock,
  };

  saveDatabase();
  res.json(products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products.splice(idx, 1);
  saveDatabase();
  res.json({ message: 'Product deleted successfully' });
});

// 2. REVIEWS
app.get('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const prodReviews = reviews.filter(r => r.productId === id);
  res.json(prodReviews);
});

app.post('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { userName, rating, comment } = req.body;

  if (!userName || !rating) {
    return res.status(400).json({ error: 'User name and rating are required' });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId: id,
    userName,
    rating: Number(rating),
    comment: comment || '',
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  updateProductRating(id);
  saveDatabase();

  res.status(201).json(newReview);
});

// 3. ORDERS & PAYMENTS (SIMULATED GATEWAY)
app.post('/api/orders', (req, res) => {
  const { items, totalAmount, customerName, customerPhone, customerAddress, paymentMethod, paymentDetails, username } = req.body;

  if (!items || items.length === 0 || !customerName || !customerPhone || !customerAddress || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  // Simulate Payment Gateway Validation
  let paymentStatus: 'success' | 'failed' = 'success';
  let failureReason = '';

  if (paymentMethod === 'Card') {
    const { cardNumber, expiry, cvv } = paymentDetails || {};
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      paymentStatus = 'failed';
      failureReason = 'Invalid card number or insufficient funds.';
    }
  } else if (paymentMethod === 'UPI') {
    const { upiId } = paymentDetails || {};
    if (!upiId || !upiId.includes('@')) {
      paymentStatus = 'failed';
      failureReason = 'Invalid UPI ID format or request timed out.';
    }
  }

  if (paymentStatus === 'failed') {
    return res.status(400).json({ error: `Payment failed: ${failureReason}` });
  }

  // Deduct stock
  items.forEach((item: any) => {
    const p = products.find(prod => prod.id === item.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - item.quantity);
    }
  });

  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
    items,
    totalAmount,
    status: 'placed',
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod,
    paymentStatus: 'processing',
    createdAt: now,
    trackingUpdates: [
      {
        status: 'placed',
        timestamp: now,
        note: `Order received. Thank you for shopping, ${customerName}! Your payment of ₹${totalAmount} via ${paymentMethod} is being processed.`,
      }
    ],
    username
  };

  orders.unshift(newOrder);
  saveDatabase();
  res.status(201).json(newOrder);
});

// 3.1 RAZORPAY PAYMENT ENDPOINTS
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const rzpConfig = getRazorpay();
    if (rzpConfig) {
      const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`
      };
      const order = await rzpConfig.instance.orders.create(options);
      return res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: rzpConfig.key_id,
        isMock: false
      });
    } else {
      // Fallback to simulated mode if Razorpay credentials are not provided
      return res.json({
        id: `order_mock_${Math.floor(100000 + Math.random() * 900000)}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        key_id: 'rzp_test_mockkeyid123',
        isMock: true
      });
    }
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order.' });
  }
});

app.post('/api/razorpay/verify-payment', (req, res) => {
  try {
    const {
      items,
      totalAmount,
      customerName,
      customerPhone,
      customerAddress,
      username,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      isMock
    } = req.body;

    if (!items || items.length === 0 || !customerName || !customerPhone || !customerAddress) {
      return res.status(400).json({ error: 'Missing order details.' });
    }

    // 1. Verify Payment
    if (isMock) {
      if (!razorpay_payment_id || !razorpay_order_id) {
        return res.status(400).json({ error: 'Missing payment confirmation tokens.' });
      }
    } else {
      // Real Razorpay Signature verification
      const rzpConfig = getRazorpay();
      if (!rzpConfig) {
        return res.status(400).json({ error: 'Razorpay is not configured on the server.' });
      }

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required Razorpay verification fields.' });
      }

      const hmac = crypto.createHmac('sha256', rzpConfig.key_secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed. Possible tampering detected.' });
      }
    }

    // 2. Deduct stock
    items.forEach((item: any) => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - item.quantity);
      }
    });

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      items,
      totalAmount,
      status: 'placed',
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod: 'UPI', // Razorpay payment
      paymentStatus: 'processing',
      createdAt: now,
      trackingUpdates: [
        {
          status: 'placed',
          timestamp: now,
          note: `Order successfully paid via Razorpay (ID: ${razorpay_payment_id}). Processing payment and receipt!`,
        }
      ],
      username
    };

    orders.unshift(newOrder);
    saveDatabase();
    res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: err.message || 'Verification failed.' });
  }
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/users/:username/orders', (req, res) => {
  const { username } = req.params;
  const userOrders = orders.filter(
    o => o.username && o.username.toLowerCase() === username.toLowerCase()
  );
  res.json(userOrders);
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const order = orders.find(o => o.id === id.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const statusNotes: Record<OrderStatus, string> = {
    placed: 'Order placed successfully.',
    processing: 'Order is being packed and prepared for shipment.',
    shipped: 'Order dispatched from our center and is in transit.',
    delivered: 'Order has been successfully delivered to the customer.',
    returned: 'Order has been returned successfully.',
  };

  order.status = status as OrderStatus;
  const trackingUpdate: TrackingUpdate = {
    status: status as OrderStatus,
    timestamp: new Date().toISOString(),
    note: note || statusNotes[status as OrderStatus] || `Order status updated to ${status}`,
  };

  order.trackingUpdates.push(trackingUpdate);
  saveDatabase();

  res.json(order);
});

app.put('/api/orders/:id/payment-status', (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  if (!paymentStatus) {
    return res.status(400).json({ error: 'Payment status is required' });
  }

  const order = orders.find(o => o.id === id.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = paymentStatus;
  saveDatabase();
  res.json(order);
});

app.post('/api/orders/:id/return', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = orders.find(o => o.id === id.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'delivered') {
    return res.status(400).json({ error: 'Only delivered orders can be returned.' });
  }

  order.status = 'returned';
  const now = new Date().toISOString();
  order.trackingUpdates.push({
    status: 'returned',
    timestamp: now,
    note: reason ? `Order Return Request filed: ${reason}` : 'Order Return Request filed successfully.',
  });

  saveDatabase();
  res.json(order);
});

// 4. AUTHENTICATION ENDPOINTS
app.post('/api/auth/register', (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Kripya username, password aur naam fill karein.' });
  }

  const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Yeh username pehle se registered hai.' });
  }

  const newUser: DBUser = {
    username: username.toLowerCase().trim(),
    passwordHash: password,
    name: name.trim(),
    role: 'user',
  };

  users.push(newUser);
  saveDatabase();
  res.status(201).json({
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Kripya username aur password enter karein.' });
  }

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Ghalat username ya password.' });
  }

  res.json({
    username: user.username,
    name: user.name,
    role: user.role,
  });
});

app.put('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const { name, password } = req.body;

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }
    user.name = name.trim();
  }

  if (password !== undefined) {
    if (!password.trim()) {
      return res.status(400).json({ error: 'Password cannot be empty.' });
    }
    user.passwordHash = password;
  }

  saveDatabase();
  res.json({
    username: user.username,
    name: user.name,
    role: user.role,
  });
});

// 5. SUPPORT TICKET ENDPOINTS
app.get('/api/support/tickets', (req, res) => {
  const { email } = req.query;
  if (email) {
    const userTickets = tickets.filter(
      t => t.email.toLowerCase() === (email as string).toLowerCase()
    );
    return res.json(userTickets);
  }
  res.json(tickets);
});

app.post('/api/support/tickets', (req, res) => {
  const { name, email, phone, category, subject, message, orderId } = req.body;

  if (!name || !email || !category || !subject || !message) {
    return res.status(400).json({ error: 'All fields (Name, Email, Category, Subject, Message) are required.' });
  }

  const newTicket: SupportTicket = {
    id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    email,
    phone: phone || '',
    category,
    subject,
    message,
    status: 'open',
    createdAt: new Date().toISOString(),
    orderId: orderId || undefined
  };

  tickets.unshift(newTicket);
  saveDatabase();
  res.status(201).json(newTicket);
});

app.put('/api/support/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { reply, status } = req.body;

  const ticket = tickets.find(t => t.id === id.toUpperCase());
  if (!ticket) {
    return res.status(404).json({ error: 'Support ticket not found' });
  }

  if (reply !== undefined) {
    ticket.reply = reply;
  }
  if (status !== undefined) {
    ticket.status = status;
  }

  saveDatabase();
  res.json(ticket);
});

// ---------------- Vite / Static Assets ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
