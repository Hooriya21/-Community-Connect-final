const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Sample exchanges data
let exchanges = [
    { id: 1, userId: 101, type: 'offer', skill: 'Gardening', description: 'Help with flowers', location: 'Main St', points: 20 },
    { id: 2, userId: 102, type: 'need', skill: 'Cooking', description: 'Learn pasta', location: 'Oak Ave', points: 15 }
];

// API Routes
app.get('/api/match/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userExchanges = exchanges.filter(e => e.userId === userId);
    
    if (userExchanges.length === 0) return res.json([]);

    const matches = exchanges.filter(e =>
        e.userId !== userId &&
        e.type !== userExchanges[0].type
    ).slice(0, 3);

    res.json(matches);
});

// AI Skill Analysis Route
app.post('/api/analyze-skill', async (req, res) => {
    const skillText = req.body.text;
    console.log("Analyzing skill:", skillText);
    
    // Check if HF_TOKEN exists
    if (!process.env.HF_TOKEN) {
        console.log("No HF_TOKEN found, using fallback categorization");
        const fallbackCategory = categorizeSkill(skillText);
        return res.json({ 
            labels: [fallbackCategory],
            scores: [0.9],
            note: "Using fallback categorization"
        });
    }
    
    try {
        // Dynamic import for node-fetch
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(
            "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
            {
                headers: { 
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json" 
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: skillText,
                    parameters: { 
                        candidate_labels: ["gardening", "cooking", "repairs", "education", "technology", "moving", "pet care", "art", "music", "general"] 
                    }
                }),
            }
        );
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("AI Result:", result);
        
        if (!result || !result.labels || result.labels.length === 0) {
            const fallbackCategory = categorizeSkill(skillText);
            return res.json({ 
                labels: [fallbackCategory],
                scores: [0.9],
                note: "API returned empty, using fallback"
            });
        }
        
        res.json(result);
        
    } catch (error) {
        console.error("AI Analysis failed:", error.message);
        const fallbackCategory = categorizeSkill(skillText);
        res.json({ 
            labels: [fallbackCategory],
            scores: [0.9],
            note: "Using fallback due to API error"
        });
    }
});

// Helper function for fallback categorization
function categorizeSkill(text) {
    text = text.toLowerCase();
    
    if (text.includes('garden') || text.includes('plant') || text.includes('flower') || text.includes('lawn')) {
        return 'gardening';
    } else if (text.includes('cook') || text.includes('bake') || text.includes('food') || text.includes('meal') || text.includes('recipe')) {
        return 'cooking';
    } else if (text.includes('repair') || text.includes('fix') || text.includes('plumb') || text.includes('electrical') || text.includes('maintenance')) {
        return 'repairs';
    } else if (text.includes('teach') || text.includes('tutor') || text.includes('math') || text.includes('science') || text.includes('learn')) {
        return 'education';
    } else if (text.includes('computer') || text.includes('tech') || text.includes('website') || text.includes('code') || text.includes('programming')) {
        return 'technology';
    } else if (text.includes('move') || text.includes('furniture') || text.includes('box') || text.includes('lifting')) {
        return 'moving';
    } else if (text.includes('pet') || text.includes('dog') || text.includes('cat') || text.includes('walk')) {
        return 'pet care';
    } else if (text.includes('art') || text.includes('paint') || text.includes('draw') || text.includes('craft')) {
        return 'art';
    } else if (text.includes('music') || text.includes('guitar') || text.includes('piano') || text.includes('sing')) {
        return 'music';
    } else {
        return 'general';
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, '../public')}`);
});