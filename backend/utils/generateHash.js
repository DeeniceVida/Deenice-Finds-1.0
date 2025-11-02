const bcrypt = require('bcryptjs');

// Run this once to generate a password hash for your admin password
const generateHash = async () => {
    const password = 'admin2025'; // Change this to your desired password
    const hash = await bcrypt.hash(password, 12);
    console.log('🔐 Generated hash:', hash);
    // Add this hash to your .env file as ADMIN_PASSWORD_HASH
};

generateHash();
