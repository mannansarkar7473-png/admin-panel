const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Enable CORS so admin panel and app can communicate
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Save cookie endpoint
app.post('/api/save-cookie', (req, res) => {
    try {
        const { email, password, platform, profileId, flipkartCookies, myntraCookies, live_logs } = req.body;
        
        // Safe check for email to avoid undefined error
        const safeEmail = (email && typeof email === 'string') ? email : "default_user";

        const dir = path.join(__dirname, 'cookies_vault');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${safeEmail.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        const filePath = path.join(dir, fileName);
        
        let existingData = {};
        if (fs.existsSync(filePath)) {
            try {
                existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (err) {
                existingData = {};
            }
        }

        const dataToSave = {
            email: safeEmail,
            password: password || existingData.password || "********",
            platform: platform || existingData.platform || "flipkart",
            profileId: profileId || existingData.profileId || 1,
            live_logs: live_logs || existingData.live_logs || "Active",
            flipkart_cookies: flipkartCookies || existingData.flipkart_cookies || "",
            myntra_cookies: myntraCookies || existingData.myntra_cookies || "",
            updatedAt: new Date()
        };

        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        res.json({ success: true, message: "Saved successfully on VPS!" });
    } catch (err) {
        console.error("Error saving cookie:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all users for Admin Panel
app.get('/api/get-all-users', (req, res) => {
    const dir = path.join(__dirname, 'cookies_vault');
    if (!fs.existsSync(dir)) {
        return res.json({ users: [] });
    }

    try {
        const files = fs.readdirSync(dir);
        const users = files.map(file => {
            try {
                const content = fs.readFileSync(path.join(dir, file), 'utf8');
                return JSON.parse(content);
            } catch (e) {
                return null;
            }
        }).filter(u => u !== null);

        res.json({ users });
    } catch (e) {
        res.status(500).json({ users: [], error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
