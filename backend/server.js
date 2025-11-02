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

// CORS configuration - ALLOW ALL FOR NOW
app.use(cors({
    origin: '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// IP restriction middleware - TEMPORARILY DISABLED
const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];
const ipRestriction = (req, res, next) => {
    // TEMPORARILY DISABLE IP RESTRICTION FOR TESTING
    // if (process.env.NODE_ENV === 'production' && allowedIPs.length > 0) {
    //     const clientIP = req.ip || req.connection.remoteAddress;
    //     if (!allowedIPs.includes(clientIP)) {
    //         return res.status(403).json({ error: 'Access denied' });
    //     }
    // }
    next(); // Always allow for now
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

// WhatsApp notification function - UPDATED
async function sendWhatsAppNotification(order, newStatus) {
    try {
        const statusMessages = {
            'processing': `🔄 Your order #${order.id} is now being processed! We're preparing your items for ${order.delivery?.method === 'pickup' ? 'pickup' : 'delivery'}. Thank you for your patience!`,
            'completed': `✅ Order completed! Your order #${order.id} has been ${order.delivery?.method === 'pickup' ? 'ready for pickup at our store. Please bring your ID.' : 'delivered to your address. Thank you for shopping with us!'}`,
            'cancelled': `❌ Order #${order.id} has been cancelled. Please contact us for more information or to resolve any issues.`
        };

        const message = statusMessages[newStatus];
        if (!message) return null;

        const customerMessage = `Hello ${order.customer?.name || 'there'}! ${message}`;
        
        if (order.customer?.phone) {
            const cleanPhone = order.customer.phone.replace(/\D/g, '');
            const encodedMessage = encodeURIComponent(customerMessage);
            const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
            
            console.log('📱 WhatsApp Notification Ready:', whatsappURL);
            return whatsappURL;
        }
        
        console.log('📱 No phone number for customer:', order.customer?.name);
        return null;
    } catch (error) {
        console.error('❌ WhatsApp notification failed:', error);
        return null;
    }
}

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
    ipRestriction, // Now disabled - will allow all IPs
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, password } = req.body;

            // Verify credentials
            if (username !== process.env.ADMIN_USERNAME) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // TEMPORARY: Simple password check instead of bcrypt
            const validPassword = (password === 'admin123');
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

// Update order status (protected) - UPDATED
app.put('/api/orders/:id/status', 
    authenticateToken, 
    checkSessionTimeout,
    [
        body('status').isIn(['pending', 'processing', 'completed', 'cancelled']).withMessage('Invalid status')
    ],
    async (req, res) => {
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

            const oldStatus = orders[orderIndex].status;
            orders[orderIndex].status = status;
            orders[orderIndex].statusUpdated = new Date().toISOString();
            
            if (status === 'completed') {
                orders[orderIndex].completedDate = new Date().toISOString();
            }

            let whatsappURL = null;
            // Send WhatsApp notification if status changed
            if (oldStatus !== status && ['processing', 'completed', 'cancelled'].includes(status)) {
                whatsappURL = await sendWhatsAppNotification(orders[orderIndex], status);
            }

            res.json({ 
                message: 'Order status updated successfully',
                order: orders[orderIndex],
                whatsappURL: whatsappURL // Send this back to admin
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
            
            // SHORTER ORDER ID
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 5).toUpperCase();
            const shortOrderId = `DF${timestamp}${random}`;
            
            const newOrder = {
                id: shortOrderId, // Use shorter ID
                orderDate: new Date().toISOString(),
                status: 'pending',
                statusUpdated: new Date().toISOString(),
                ...orderData
            };

            orders.unshift(newOrder);
            
            console.log('📦 New order created:', newOrder.id);
            console.log('👤 Customer:', newOrder.customer?.name);
            console.log('📞 Phone:', newOrder.customer?.phone || 'No phone provided');
            
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
