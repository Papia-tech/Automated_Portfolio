require('dotenv').config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path"); // Added for path resolution

const app = express(); // Initialize app FIRST

// --- CORS CONFIGURATION ---
// Replace '*' with your actual frontend URL once deployed (e.g., https://papia-portfolio.vercel.app)
app.use(cors({
    origin: process.env.FRONTEND_URL || "*" 
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// --- CONFIGURATION FROM .ENV ---
const API_KEY = process.env.DRIVE_API_KEY;
const FOLDER_ID = process.env.CERTIFICATES_FOLDER_ID;
const TOOLS_FILE_ID = process.env.TOOLS_FILE_ID;
const EDUCATION_FILE_ID = process.env.EDUCATION_FILE_ID;
const SKILLS_FILE_ID = process.env.SKILLS_FILE_ID;
const RESUME_FILE_ID = process.env.RESUME_FILE_ID;

const driveHeaders = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }
};

// --- ROUTES ---

app.get("/api/status", (req, res) => {
    res.json({ 
        status: "Backend Running",
        version: "1.0.0"
    });
});

app.get("/resume", (req, res) => {
    const downloadUrl = `https://docs.google.com/uc?export=download&id=${RESUME_FILE_ID}`;
    res.redirect(downloadUrl);
});

// Certificates API
app.get("/certificates", async (req, res) => {
    try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,mimeType)`;
        const response = await axios.get(url, driveHeaders);
        const files = response.data.files.filter(file => file.mimeType === "application/pdf");

        const formatted = files.map(file => {
            const nameWithoutExt = file.name.replace(".pdf", "");
            const parts = nameWithoutExt.split("-");
            return {
                title: parts[0] || "Untitled",
                issuer: parts[1] || "Unknown",
                description: parts[2] || "",
                link: `https://drive.google.com/file/d/${file.id}/view?usp=sharing`
            };
        });
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch certificates" });
    }
});

// Generic Fetcher for Tools, Education, Skills
const fetchDriveJson = async (fileId, res) => {
    try {
        const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
        const response = await axios.get(url, driveHeaders);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Data fetch failed" });
    }
};

app.get("/tools", (req, res) => fetchDriveJson(TOOLS_FILE_ID, res));
app.get("/education", (req, res) => fetchDriveJson(EDUCATION_FILE_ID, res));
app.get("/skills", (req, res) => fetchDriveJson(SKILLS_FILE_ID, res));

// --- CATCH-ALL ROUTE ---
// Important for deployment: If a user refreshes a sub-page, serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));