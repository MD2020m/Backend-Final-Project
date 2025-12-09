const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, User, Campaign, PlayerCharacter, CampaignNoteThread, CampaignNote, PartyMessage } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

// JWT authentication middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Access denied. No token provided.'
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired. Please log in again'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token. Please log in again'
            });
        } else {
            return res.status(401).json({
                error: 'Token verification failed.'
            });
        }
    }
}

// Requires a User to be a given Campaign's dm
async function requireDm(req, res, next) {
    try {
        const userId = req.user.userId;

        // Retrieve DM userId from campaign
        const reqCampaign = await Campaign.findByPk(req.params.campaign_id);
        const campaignDmId = reqCampaign.userId;

        // Check if User is campaign's dm
        if (userId == campaignDmId) {
            next();
        }
        else {
            return res.status(403).json({
                    error: "Must be Campaign DM to access this resource"
                });
        }
    } catch (error) {
        console.error('DM check failed:', error);
        res.status(500).json({ error: 'Failed to check DM status' });
    }
}

// Request logging middleware
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

    // Log request body for POST and PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
}


app.use(express.json());

const cors = require('cors');
app.use(requestLogger);


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

// POST /api/register - Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required.'
            });
        }

        // Check if username is in use
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({
                error: 'User with this username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await User.create({
            username,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.userId,
                username: newUser.username
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST /api/login - User login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username nad password are required'
            });
        }

        // Find user
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.userId,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                userId: user.userId,
                username: user.username
            }
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// CAMPAIGN ROUTES 

// TODO: Adjust this endpoint to return only campaigns a user is involved in
// GET /api/campaigns - Return all campaigns

// TODO: Get endpoint to return info about players and characters involved
app.get('/api/campaigns', requireAuth, async (req, res) => {
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
app.get('/api/campaigns/:id', requireAuth, async (req, res) => {
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
app.post('/api/campaigns', requireAuth, async (req, res) => {
    try {
        // Get userId from JWT to assign creator as dm
        const userId = req.user.userId

        const { title, description, schedule } = req.body;

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
app.put('/api/campaigns/:campaign_id', requireAuth, requireDm, async (req, res) => {
    try {
        const {title, description, schedule } = req.body;

        const [updatedRowsCount] = await Campaign.update(
            { title, description, schedule },
            { where: { campaignId: req.params.campaign_id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const updatedCampaign = await Campaign.findByPk(req.params.campaign_id);
        res.json(updatedCampaign);
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

// DELETE /api/campaigns/:id - Delete Campaign (TODO: Campaign's DM only)
app.delete('/api/campaigns/:campaign_id', requireAuth, requireDm, async (req, res) => {
    try {
        const deletedRowsCount = await Campaign.destroy({
            where: { campaignId: req.params.campaign_id }
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
app.get('/api/my_characters', requireAuth, async (req, res) => {
    try{
        const userId = req.user.userId;

        const chars = await PlayerCharacter.findAll({
            where: { userId }
        });

        res.json(chars);
    } catch (error) {
        console.error('Error fetching player characters:', error);
        res.status(500).json({ error: 'Failed to fetch player characters' });
    }
});

app.get('/api/my_characters/:id', requireAuth, /*requireOwner*/ async (req, res) => {
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

// POST/ api/my_characters - create a new PlayerCharacter
app.post('/api/my_characters', requireAuth, async (req, res) => {
    try{
        const userId = req.user.userId

        const { 
            name, race, gender, primaryClass, primaryClassLevel,
            secondaryClass, secondaryClassLevel, tertiaryClass, 
            tertiaryClassLevel, constitution, strength, dexterity,
            intelligence, wisdom, charisma, armorClass, hp, inventory,
            spellCasts, backstory, alignment, origin
        } = req.body;

        const newChar = await PlayerCharacter.create({
            alive: true,
            name,
            race,
            gender,
            primaryClass,
            primaryClassLevel,
            secondaryClass,
            secondaryClassLevel,
            tertiaryClass,
            tertiaryClassLevel,
            constitution,
            strength,
            dexterity,
            intelligence,
            wisdom,
            charisma,
            armorClass,
            hp,
            inventory,
            spellCasts,
            backstory,
            alignment,
            origin,
            userId,
        });

        res.status(201).json(newChar);
    } catch (error) {
        console.error('Error creating player character:', error);
        res.status(500).json({ error: 'Failed to create player character' });
    }
});

// PUT /api/my_characters/:id - Update an existing character
app.put('/api/my_characters/:id', requireAuth, /*requireOwner,*/ async (req, res) => {
    try {
        const { 
            alive, name, race, gender, primaryClass, primaryClassLevel,
            secondaryClass, secondaryClassLevel, tertiaryClass, 
            tertiaryClassLevel, constitution, strength, dexterity,
            intelligence, wisdom, charisma, armorClass, hp, inventory,
            spellCasts, backstory, alignment, origin, userId, campaignId 
        } = req.body;

        const [updatedRowsCount] = await PlayerCharacter.update(
            { alive, name, race, gender, primaryClass, primaryClassLevel,
            secondaryClass, secondaryClassLevel, tertiaryClass, 
            tertiaryClassLevel, constitution, strength, dexterity,
            intelligence, wisdom, charisma, armorClass, hp, inventory,
            spellCasts, backstory, alignment, origin, userId, campaignId },
            { where: { charId: req.params.id }}
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Player character not found' });
        }

        const updatedChar = await PlayerCharacter.findByPk(req.params.id);
        res.json(updatedChar);
    } catch (error) {
        console.error('Error updating character:', error);
        res.status(500).json({ error: 'Failed to update character' });
    }
});

// DELETE /api/my_characters
app.delete('/api/my_characters/:id', requireAuth, /*requireOwner*/ async (req, res) => {
    try {
        const deletedRowsCount = await PlayerCharacter.destroy({
            where: { charId: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Player character not found' });
        }

        res.json({ message: 'Player character deleted successfully' });
    } catch (error) {
        console.error('Error deleting player character:', error);
        res.status(500).json({ error: 'Failed to delete player character' });
    }
});



// CAMPAINGNOTE/CAMPAIGNNOTETHREAD ROUTES
app.get('/api/campaign_notes', requireAuth, async (req, res) => {
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

app.get('/api/campaign_notes/:thread_id', requireAuth, async (req, res) => {
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

// POST /api/campaign_notes/:thread_id
app.post('/api/campaign_notes/:thread_id', requireAuth, async (req, res) => {
    try {
        thread = await CampaignNoteThread.findByPk(req.params.thread_id);

        if (!thread) {
            return res.status(404).json({ error: 'Campaign note thread not found' });
        }

        const { content, userId } = req.body;

        newNote = await CampaignNote.create({
            content,
            timePosted: require('sequelize').literal('CURRENT_TIMESTAMP'),
            userId,
            threadId: req.params.thread_id
        });

        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating campaign note:', error);
        res.status(500).json({ error: 'Failed to create campaign note' });
    }
});

// PUT /api/campaign_notes/:id
app.put('/api/campaign_notes/:id', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;

        const [updatedRowsCount] = await CampaignNote.update(
            { content },
            { where: { noteId: req.params.id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Campaing note not found' });
        }

        const updatedNote = await CampaignNote.findByPk(req.params.id);
        res.json(updatedNote);
    } catch (error) {
        console.error('Error updating campaign note:', error);
        res.status(500).json({ error: 'Failed to update campaign note' });
    }
});

// DELETE /api/campaign_notes/:id
app.delete('/api/campaign_notes/:id', requireAuth, async (req, res) => {
    try {
        const deletedRowsCount = await CampaignNote.destroy({
            where: { noteId: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Campaign note not found' });
        }

        res.json({ message: 'Campaign note deleted successfully' });
    } catch (error) {
        console.error('Error deleting campaign note:', error);
        res.status(500).json({ error: 'Failed to delete campaign note.' });
    }
});

// POST /api/campaign_note_thread
app.post('/api/campaign_note_thread/:campaign_id', requireAuth, async (req, res) => {
    try {
        campaign = Campaign.findByPk(req.params.campaign_id);

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const { toCharacter } = req.body;

        const newThread = await CampaignNoteThread.create({
            toCharacter,
            campaignId: req.params.campaign_id
        });

        res.status(201).json(newThread);
    } catch (error) {
        console.error('Error creating campaign note thread:', error);
        res.status(500).json({ error: 'Failed to create campaign note thread' });
    }
});

app.put('/api/campaign_note_thread/:id', requireAuth, async (req, res) => {
    try {
        const { toCharacter } = req.body;

        const [updatedRowsCount] = await CampaignNoteThread.update(
            { toCharacter },
            { where: { threadId: req.params.id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Campaign note thread not found' });
        }

        const updatedThread = await CampaignNoteThread.findByPk(req.params.id);
        res.json(updatedThread);
    } catch (error) {
        console.error('Error updating thread:', error);
        res.status(500).json({ error: 'Failed to update campaign note thread' });
    }
});

app.delete('/api/campaign_note_thread/:id', requireAuth, async (req, res) => {
    try {
        const deletedRowsCount = await CampaignNoteThread.destroy({
            where: {threadId: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        res.json({ message: 'Campaign note thread deleted successfully' });
    } catch (error) {
        console.error('Error deleteing campaign note thread:', error);
        res.status(500).json({ error: 'Failed to delete campaign note thread' });
    }
})

// PARTYMESSAGE ROUTES
app.get('/api/party_messages', requireAuth, async (req, res) => {
    try {
        const messages = await PartyMessage.findAll();

        res.json(messages);
    } catch (error) {
        console.error('Error fetching party messages:', error);
        res.status(500).json({ error: 'Failed to fetch party messages' });
    }
});

app.get('/api/party_messages/:campaign_id', requireAuth, async (req, res) => {
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
});

// POST /api/party_messages/:campaign_id
app.post('/api/party_messages/:campaign_id', requireAuth, async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.campaign_id);

        if (!campaign) {
            return res.status(404).json({error: 'Campaing not found' })
        }

        const { content, userId } = req.body;

        const newMessage = await PartyMessage.create({
            content, 
            timePosted: require('sequelize').literal('CURRENT_TIMESTAMP'),
            userId,
            campaignId: req.params.campaign_id
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating party message:', error);
        res.status(500).json({ error: 'Failed to create party message' });
    }
});

// PUT /api/party_messages/:id
app.put('/api/party_messages/:id', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;

        const [updatedRowsCount] = await PartyMessage.update(
            { content },
            { where: { messageId: req.params.id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Party message not found' });
        }

        const updatedMessage = await PartyMessage.findByPk(req.params.id);
        res.json(updatedMessage);
    } catch (error) {
        console.error('Error updating party message:', error);
        res.status(500).json({ error: 'Failed to update party message' });
    }
});

// DELETE /api/party_messages/:id
app.delete('/api/party_messages/:id', requireAuth, async (req, res) => {
    try {
        const deletedRowsCount = await PartyMessage.destroy({
            where: { messageId: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Party message not fount' });
        }

        res.json({ message: 'Party message deleted successfully' });
    } catch (error) {
        console.error('Error delteing party message:', error);
        res.status(500).json({ error: 'Failed to delete party message' });
    }
});




// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port http://localhost:${PORT}`);
    });
}

module.exports = app;