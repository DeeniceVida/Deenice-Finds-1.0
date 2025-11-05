require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// IP restriction middleware - TEMPORARILY DISABLED
const ipRestriction = (req, res, next) => {
    next();
};

// In-memory store
let orders = [];
let adminSessions = {};

// File-based storage functions
const ORDERS_FILE = './orders-data.json';

async function loadOrders() {
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf8');
        orders = JSON.parse(data);
        console.log(`📥 Loaded ${orders.length} orders from storage`);
        return orders;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📥 No existing orders file, starting fresh');
            orders = [];
            await saveOrders();
            return [];
        } else {
            console.error('❌ Failed to load orders:', error);
            orders = [];
            return [];
        }
    }
}

async function saveOrders() {
    try {
        const data = JSON.stringify(orders, null, 2);
        await fs.writeFile(ORDERS_FILE, data);
        console.log(`💾 Saved ${orders.length} orders to storage`);
        return true;
    } catch (error) {
        console.error('❌ Failed to save orders:', error);
        return false;
    }
}

// Auto-load orders on server start
(async () => {
    console.log('🔄 Initializing order storage...');
    await loadOrders();
    
    // Auto-save every 2 minutes
    setInterval(async () => {
        await saveOrders();
    }, 2 * 60 * 1000);
    
    // Auto-save on graceful shutdown
    process.on('SIGINT', async () => {
        console.log('💾 Saving orders before shutdown...');
        await saveOrders();
        console.log('✅ Orders saved. Shutting down...');
        process.exit(0);
    });
})();

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
    const timeout = parseInt(process.env.SESSION_TIMEOUT) || 3600000;
    
    if (session && (Date.now() - session.lastActivity) > timeout) {
        delete adminSessions[req.user.username];
        return res.status(401).json({ error: 'Session expired' });
    }
    
    if (session) {
        session.lastActivity = Date.now();
    }
    next();
};

// WhatsApp notification function
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
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        ordersCount: orders.length,
        storage: 'file-based-persistence'
    });
});

// Manual save endpoint
app.post('/api/admin/save-orders', authenticateToken, checkSessionTimeout, async (req, res) => {
    try {
        const success = await saveOrders();
        if (success) {
            res.json({ 
                success: true,
                message: `Orders saved successfully`,
                ordersCount: orders.length
            });
        } else {
            res.status(500).json({ error: 'Failed to save orders' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to save orders' });
    }
});

// Get orders for specific user
app.post('/api/orders/user', (req, res) => {
    try {
        const { localOrders, lastSync } = req.body;
        
        if (!localOrders || !Array.isArray(localOrders)) {
            return res.status(400).json({ error: 'Local orders array required' });
        }

        const userOrderIds = localOrders.map(order => order.id);
        let serverOrders = orders.filter(order => userOrderIds.includes(order.id));
        
        if (lastSync) {
            const lastSyncDate = new Date(lastSync);
            serverOrders = serverOrders.filter(order => {
                const orderUpdateTime = new Date(order.statusUpdated || order.orderDate);
                return orderUpdateTime > lastSyncDate;
            });
        }

        res.json({
            orders: serverOrders,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Efficient order updates endpoint
app.post('/api/orders/updates', (req, res) => {
    try {
        const { orderIds, lastSync } = req.body;
        
        if (!orderIds || !Array.isArray(orderIds)) {
            return res.status(400).json({ error: 'Order IDs array required' });
        }

        let updatedOrders = orders.filter(order => orderIds.includes(order.id));
        
        if (lastSync) {
            const lastSyncDate = new Date(lastSync);
            updatedOrders = updatedOrders.filter(order => {
                const orderUpdateTime = new Date(order.statusUpdated || order.orderDate);
                return orderUpdateTime > lastSyncDate;
            });
        }

        res.json({
            updatedOrders: updatedOrders,
            timestamp: new Date().toISOString(),
            hasUpdates: updatedOrders.length > 0
        });

    } catch (error) {
        console.error('Updates endpoint error:', error);
        res.status(500).json({ error: 'Failed to get updates' });
    }
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

            if (username !== process.env.ADMIN_USERNAME) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const validPassword = (password === process.env.ADMIN_PASSWORD);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { username: username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

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

// Delete order
app.delete('/api/orders/:id', authenticateToken, checkSessionTimeout, async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const deletedOrder = orders.splice(orderIndex, 1)[0];
        await saveOrders();
        
        res.json({ 
            success: true,
            message: 'Order deleted successfully',
            deletedOrder: deletedOrder
        });

    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all orders
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
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update order status
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
            if (oldStatus !== status && ['processing', 'completed', 'cancelled'].includes(status)) {
                whatsappURL = await sendWhatsAppNotification(orders[orderIndex], status);
            }

            await saveOrders();

            res.json({ 
                message: 'Order status updated successfully',
                order: orders[orderIndex],
                whatsappURL: whatsappURL,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Update order error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Create new order
app.post('/api/orders',
    [
        body('customer.name').notEmpty().withMessage('Customer name is required'),
        body('customer.city').notEmpty().withMessage('Customer city is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const orderData = req.body;
            
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 5).toUpperCase();
            const shortOrderId = `DF${timestamp}${random}`;
            
            const newOrder = {
                id: shortOrderId,
                orderDate: new Date().toISOString(),
                status: 'pending',
                statusUpdated: new Date().toISOString(),
                ...orderData
            };

            orders.unshift(newOrder);
            await saveOrders();
            
            res.status(201).json({
                message: 'Order created successfully',
                order: newOrder,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ error: 'Internal server error' });
    }
});

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

// Server stats
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            totalOrders: orders.length,
            ordersByStatus: {
                pending: orders.filter(o => o.status === 'pending').length,
                processing: orders.filter(o => o.status === 'processing').length,
                completed: orders.filter(o => o.status === 'completed').length,
                cancelled: orders.filter(o => o.status === 'cancelled').length
            },
            serverTime: new Date().toISOString(),
            storage: 'file-based-persistence'
        };

        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Orders loaded: ${orders.length}`);
    console.log(`💾 Permanent storage enabled`);
    console.log(`⏰ Server time: ${new Date().toISOString()}`);
});
const fs = require('fs').promises;
const path = require('path');

// Permanent file storage
const ORDERS_FILE = './admin-orders-data.json';

// Load orders from file on server start
async function loadAdminOrders() {
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf8');
        orders = JSON.parse(data); // This updates your main orders array
        console.log(`📥 Loaded ${orders.length} orders from permanent storage`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📥 No existing orders file, starting fresh');
            orders = [];
        } else {
            console.error('Failed to load orders:', error);
            orders = [];
        }
    }
}

// Save orders to file
async function saveAdminOrders() {
    try {
        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
        console.log(`💾 Saved ${orders.length} orders to permanent storage`);
    } catch (error) {
        console.error('Failed to save orders:', error);
    }
}

// Auto-save every 2 minutes
setInterval(saveAdminOrders, 2 * 60 * 1000);

// Load on server start
loadAdminOrders();
