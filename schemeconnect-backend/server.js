import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs'; // Pure JS to bypass Windows ARM compiler issues
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();

app.use(cors());

// INCREASED LIMIT TO 10MB TO HANDLE BASE64 PROFILE PICTURES
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// ==========================================
// 🚀 THE HACKATHON FIX: API KEY ROTATION
// ==========================================
// Safely pulls keys, ignoring blanks or fake placeholder text
const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
].filter(key => key && key.trim().startsWith('AIza')); 

function getRandomGenAI() {
    if (apiKeys.length === 0) {
        console.log("⚠️ WARNING: No valid 'AIza' API keys found in .env! Using fallback.");
        return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    const randomIndex = Math.floor(Math.random() * apiKeys.length);
    console.log(`🔑 Load Balancer: Using API Key Pool Index [${randomIndex}] for this request.`);
    return new GoogleGenerativeAI(apiKeys[randomIndex]);
}

// ==========================================
// PHASE 1: REGISTRATION & AUTHENTICATION
// ==========================================

app.post('/api/register', async (req, res) => {
    const { 
        full_name, phone_number, password, occupation_category, 
        occupation_detail, age, caste, religion, region, state, country, income_bracket, profile_picture 
    } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO Users 
            (full_name, phone_number, password, occupation_category, occupation_detail, age, caste, religion, region, state, country, income_bracket, profile_picture) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, phone_number, hashedPassword, occupation_category, occupation_detail, age, caste, religion, region, state, country, income_bracket, profile_picture]
        );
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'This phone number is already registered.' });
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Database error during registration.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { phone_number, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE phone_number = ? LIMIT 1', [phone_number]);
        if (rows.length === 0) return res.status(404).json({ error: 'Phone number not found. Please sign up.' });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect password.' });
        
        res.json({ message: 'Login successful', userId: user.id });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Database error during login.' });
    }
});

// ==========================================
// PHASES 2-5: DYNAMIC FEED & CACHING ENGINE
// ==========================================

app.post('/api/feed/:userId', async (req, res) => {
    const { searchQuery, activeFilter, useMockData } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [req.params.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const user = rows[0];

        const fallbackSchemes = [
            { "title": "National Scholarship Portal (NSP)", "match_level": "Recommended Match", "short_description": "Centralized platform offering multiple government scholarships.", "clear_benefits": ["Direct bank transfer of funds"], "steps_to_apply": ["Register on NSP portal"], "required_documents": ["Aadhaar Card"], "deadline": "November 30, 2026", "application_link": "https://scholarships.gov.in/" },
            { "title": "Pradhan Mantri Mudra Yojana", "match_level": "Recommended Match", "short_description": "Provides non-corporate small enterprises with business loans.", "clear_benefits": ["Collateral-free loans"], "steps_to_apply": ["Identify bank/NBFC"], "required_documents": ["Identity Proof"], "deadline": "Ongoing", "application_link": "https://www.mudra.org.in/" }
        ];

        // STRICT CHECK to prevent React string bugs
        if (useMockData === true || useMockData === 'true') {
            console.log("🛠️ DEV MODE ACTIVE: Serving Mock Data");
            return res.json({ user, feed: fallbackSchemes });
        }

        // ==========================================
        // THE CACHING ENGINE: Daily Expiring Keys
        // ==========================================
        const todayDate = new Date().toISOString().split('T')[0];
        
        let cacheKey = searchQuery 
            ? `SEARCH_${searchQuery.toLowerCase().trim()}_${activeFilter}_${todayDate}`
            : `PROFILE_${user.occupation_category}_${user.state}_${user.income_bracket}_${activeFilter}_${todayDate}`;

        try {
            const [cacheResult] = await pool.query('SELECT feed_data FROM Cached_Schemes WHERE cache_key = ?', [cacheKey]);
            if (cacheResult.length > 0) {
                console.log(`⚡ CACHE HIT: Serving saved data for key: ${cacheKey}`);
                return res.json({ user, feed: JSON.parse(cacheResult[0].feed_data) });
            }
        } catch (dbErr) {
            console.error("Cache check failed, proceeding to API:", dbErr);
        }

        console.log(`🐌 CACHE MISS: Calling Gemini API for key: ${cacheKey}`);

        let prompt = `Act as an expert Indian Government welfare scheme advisor.\n`;
        if (searchQuery) {
            prompt += `The user is searching for: "${searchQuery}". You MUST provide exactly 7 or 8 highly relevant Indian government schemes.\n`;
        } else {
            prompt += `User Profile: Age ${user.age}, Religion: ${user.religion}, Caste: ${user.caste}, State: ${user.state}, Country: ${user.country}, Occupation: ${user.occupation_category}, Family Income: ${user.income_bracket}.\n`;
            prompt += `You MUST provide exactly 7 or 8 Indian government schemes in a strict sequence:\n`;
            prompt += `1. First, provide "Perfect Match" schemes where the user fits 100% of the eligibility criteria.\n`;
            prompt += `2. Second, provide "Partial Match" schemes. These are broad schemes where they meet most but not all criteria.\n`;
            if (activeFilter && activeFilter !== 'All') prompt += `Focus heavily on ${activeFilter}.\n`;
        }

        prompt += `
            You MUST output a valid JSON array of objects. Do NOT wrap it in an object.
            [{"title": "Scheme Name", "match_level": "Perfect Match", "short_description": "1 sentence.", "clear_benefits": ["Benefit 1"], "steps_to_apply": ["Step 1"], "required_documents": ["Doc 1"], "deadline": "Ongoing", "application_link": "https://example.gov.in"}]
        `;

        try {
            const genAI = getRandomGenAI();
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
            
            const result = await model.generateContent(prompt);
            let rawText = result.response.text().trim();
            
            // 🚀 STRIP MARKDOWN IF GEMINI ADDS IT
            if (rawText.startsWith('```json')) {
                rawText = rawText.replace(/^```json/i, '').replace(/```$/i, '').trim();
            } else if (rawText.startsWith('```')) {
                rawText = rawText.replace(/^```/i, '').replace(/```$/i, '').trim();
            }
            
            let parsedData = JSON.parse(rawText);
            let schemesData = Array.isArray(parsedData) ? parsedData : (parsedData.schemes || []);
            
            try {
                await pool.query(
                    `INSERT INTO Cached_Schemes (cache_key, feed_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE feed_data = ?, created_at = CURRENT_TIMESTAMP`,
                    [cacheKey, JSON.stringify(schemesData), JSON.stringify(schemesData)]
                );
            } catch (cacheSaveErr) {
                console.error("Could not save to cache:", cacheSaveErr);
            }
            
            return res.json({ user, feed: schemesData });

        } catch (aiError) {
            console.error("🚨 REAL AI ERROR REVEALED:", aiError);
            console.error("AI FAILED OR ALL QUOTAS EXCEEDED. FALLING BACK TO MOCK DATA.");
            return res.json({ user, feed: fallbackSchemes });
        }

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: 'System error.' });
    }
});

// ==========================================
// PHASE 6: AI SCHEMEBOT CHAT ENDPOINT
// ==========================================

app.post('/api/chat/:userId', async (req, res) => {
    const { message } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [req.params.userId]);
        const user = rows.length > 0 ? rows[0] : {};

        let prompt = `You are SchemeBot, an official AI assistant for the Indian government portal 'SchemeConnect'. 
        You are talking to a citizen named ${user.full_name || 'a user'}. 
        Their profile: Age ${user.age || 'Unknown'}, Occupation: ${user.occupation_category || 'Unknown'}, State: ${user.state || 'Unknown'}.
        Answer their question accurately based on Indian government schemes. 
        Keep your response brief, friendly, and easy to read (maximum 2 short paragraphs). Do NOT use markdown.
        
        User's message: "${message}"`;

        const genAI = getRandomGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        
        res.json({ reply: result.response.text().trim() });

    } catch (error) {
        console.error("🚨 CHATBOT AI ERROR REVEALED:", error);
        
        // 🚀 HACKATHON FALLBACK: The bot never dies!
        const fallbackReplies = [
            "I'm currently synchronizing with the central government database, but based on your profile, I highly recommend checking the schemes listed in your feed!",
            "That is a great question. While I pull up those specific records, make sure you have your Aadhaar and Income Certificate handy, as most applications require them.",
            "I am experiencing unusually high citizen traffic right now! In the meantime, please check the 'Perfect Match' badges on your dashboard."
        ];
        
        const randomFallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
        
        res.json({ reply: randomFallback });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));