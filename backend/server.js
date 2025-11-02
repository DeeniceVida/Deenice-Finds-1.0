require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// IP restriction middleware
const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];
const ipRestriction = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && allowedIPs.length > 0) {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!allowedIPs.includes(clientIP)) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    next();
};

// In-memory store (replace with database in production)
let orders = [];
let adminSessions = {};

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Session timeout middleware
const checkSessionTimeout = (req, res, next) => {
    const session = adminSessions[req.user.username];
    const timeout = parseInt(process.env.SESSION_TIMEOUT) || 3600000; // 1 hour default
    
    if (session && (Date.now() - session.lastActivity) > timeout) {
        delete adminSessions[req.user.username];
        return res.status(401).json({ error: 'Session expired' });
    }
    
    if (session) {
        session.lastActivity = Date.now();
    }
    next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Admin login
app.post('/api/admin/login', 
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    ipRestriction,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, password } = req.body;

            // Verify credentials (in production, use database)
            if (username !== process.env.ADMIN_USERNAME) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // In production, compare with bcrypt hash
            const validPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create JWT token
            const token = jwt.sign(
                { username: username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Create session
            adminSessions[username] = {
                lastActivity: Date.now(),
                ip: req.ip
            };

            res.json({
                token,
                user: { username, role: 'admin' },
                expiresIn: 3600
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Get all orders (protected)
app.get('/api/orders', authenticateToken, checkSessionTimeout, (req, res) => {
    try {
        res.json({
            orders: orders,
            total: orders.length,
            stats: {
                pending: orders.filter(o => o.status === 'pending').length,
                processing: orders.filter(o => o.status === 'processing').length,
                completed: orders.filter(o => o.status === 'completed').length,
                cancelled: orders.filter(o => o.status === 'cancelled').length
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update order status (protected)
app.put('/api/orders/:id/status', 
    authenticateToken, 
    checkSessionTimeout,
    [
        body('status').isIn(['pending', 'processing', 'completed', 'cancelled']).withMessage('Invalid status')
    ],
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const orderId = req.params.id;
            const { status } = req.body;

            const orderIndex = orders.findIndex(o => o.id === orderId);
            if (orderIndex === -1) {
                return res.status(404).json({ error: 'Order not found' });
            }

            orders[orderIndex].status = status;
            orders[orderIndex].statusUpdated = new Date().toISOString();
            
            if (status === 'completed') {
                orders[orderIndex].completedDate = new Date().toISOString();
            }

            res.json({ 
                message: 'Order status updated successfully',
                order: orders[orderIndex]
            });

        } catch (error) {
            console.error('Update order error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Create new order (from frontend)
app.post('/api/orders',
    [
        body('customer.name').notEmpty().withMessage('Customer name is required'),
        body('customer.city').notEmpty().withMessage('Customer city is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required')
    ],
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const orderData = req.body;
            const newOrder = {
                id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderDate: new Date().toISOString(),
                status: 'pending',
                statusUpdated: new Date().toISOString(),
                ...orderData
            };

            orders.unshift(newOrder);
            
            console.log('📦 New order created:', newOrder.id);
            
            res.status(201).json({
                message: 'Order created successfully',
                order: newOrder
            });

        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Admin logout
app.post('/api/admin/logout', authenticateToken, (req, res) => {
    try {
        delete adminSessions[req.user.username];
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
});
