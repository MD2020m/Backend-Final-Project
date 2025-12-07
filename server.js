const express = require('express');
const bcrypt = require('bcryptjs');
const { db, User, Campaign, PlayerCharacter, CampaignNoteThread, CampaignNote, PartyMessage } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// TODO: Create JWT middleware for authorization



// Test database connection
async function testConnection() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// TODO: Add authentication routes



// CAMPAIGN ROUTES 

// TODO: Adjust this endpoint to return only campaigns a user is involved in
// GET /api/campaigns - Return all campaigns

// TODO: Get endpoint to return info about players and characters involved
app.get('/api/campaigns', /*requireAuth,*/ async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
            include: [
                {
                    model: User,
                    as: 'dungeonMaster',
                    attributes: ['userId','username']
                },
                {
                    model: PlayerCharacter,
                    attributes: ['charId','alive','name','race','gender'],
                    include: [
                        {
                            model: User,
                            attributes: ['userId','username']
                        }
                    ]
                }
            ]
        });

        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// TODO: Adjust this endpoint to require authorization to view the campaign
// GET /api/campaing/:id - Return a Campaign by id

// TODO: Get endpoint to return info about characters and players involved
app.get('/api/campaigns/:id', /*requireAuth,*/ async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'dungeonMaster',
                    attributes: ['userId','username']
                },
                {
                    model: PlayerCharacter,
                    attributes: ['charId','alive','name','race','gender'],
                    include: [
                        {
                            model: User,
                            attributes: ['userId','username']
                        }
                    ]
                }
            ]
        })

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json(campaign);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
});


// PLAYERCHARACTER ROUTES 

// GET /api/my_characters - Currently returns all characters (Later to return only a User's characters)
// TODO: adjust endpoint to require authentication
app.get('/api/my_characters', /*requireAuth,*/ async (req, res) => {
    try{
        const chars = await PlayerCharacter.findAll({});

        res.json(chars);
    } catch (error) {
        console.error('Error fetching player characters:', error);
        res.status(500).json({ error: 'Failed to fetch player characters' });
    }
});

app.get('/api/my_characters/:id', /*requireAuth,*/ async (req, res) => {
    try {
        const char = await PlayerCharacter.findByPk(req.params.id);

        if (!char) {
            return res.status(404).json({ error: 'Player Character not found' });
        }

        res.json(char);
    } catch (error) {
        console.error('Error fetching Player Character:', error);
        res.status(500).json( {error: 'Failed to fetch character' });
    }
});




// Start server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
})