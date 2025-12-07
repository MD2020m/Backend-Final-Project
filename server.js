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
                    attributes: ['charId','alive','name'],
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

// POST /api/campaigns - Create a new campaign
// TODO: adjust route to require authentication and automatically assign creator as DM
app.post('/api/campaigns', /*requireAuth,*/ async (req, res) => {
    try {
        const { title, description, schedule, userId } = req.body;

        const newCampaign = await Campaign.create({
            title,
            description,
            schedule,
            userId
        });

        res.status(201).json(newCampaign);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

// PUT /api/campaigns/:id - Update campaign (TODO: Only allow campaign's DM)
app.put('/api/campaigns/:id', async (req, res) => {
    try {
        const {title, description, schedule } = req.body;

        const [updatedRowsCount] = await Campaign.update(
            { title, description, schedule },
            { where: { campaignId: req.params.id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const updatedCampaign = await Campaign.findByPk(req.params.id);
        res.json(updatedCampaign);
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

// DELETE /api/projects/: id - Delete Campaign (TODO: Campaign's DM only)
app.delete('/api/campaigns/:id', async (req, res) => {
    try {
        const deletedRowsCount = await Campaign.destroy({
            where: { campaignId: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
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

// TODO: Add POST, PUT, DELETE for PlayerCharacters

// CAMPAINGNOTE ROUTES
app.get('/api/campaign_notes', async (req, res) => {
    try {
        const threads = await CampaignNoteThread.findAll({
            include: [
                {
                    model: CampaignNote
                }
            ]
        });

        res.json(threads);
    } catch (error) {
        console.error('Error fetching Campaign Note Threads:', error);
        res.status(500).json({ error: 'Failed to fetch campaign note threads'});
    }
});

app.get('/api/campaign_notes/:thread_id', async (req, res) => {
    try {
        const thread = await CampaignNoteThread.findByPk(req.params.thread_id, {
            include: [
                {
                    model: CampaignNote
                }
            ]
        });

        if (!thread) {
            return res.status(404).json({ message: 'Campaign note thread not found' });
        }

        res.json(thread);
    } catch (error) {
        console.error('Failed to fetch campaign note thread:', error);
        res.status(500).json({ error: 'Failed to fetch campaign note thread' });
    }
});


// PARTYMESSAGE ROUTES
app.get('/api/party_messages', async (req, res) => {
    try {
        const messages = await PartyMessage.findAll();

        res.json(messages);
    } catch (error) {
        console.error('Error fetching party messages:', error);
        res.status(500).json({ error: 'Failed to fetch party messages' });
    }
});

app.get('/api/party_messages/:campaign_id', async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.campaign_id);
        
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        const messages = await PartyMessage.findAll({
            where: { campaignId: req.params.campaign_id }
        });

        if (!messages) {
            res.status(404).json({ message: `No messages for campaign with id ${req.params.campaign_id}` });
        }

        res.json(messages);
    } catch (error) {
        console.error('Error fetching party messages:', error);
        res.status(500).json({ error: 'Failed to fetch party messages' });
    }
})




// Start server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
})