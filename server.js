const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, User, Campaign, PlayerCharacter, PartyMessage } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

// Check if User is banned
async function checkBanned(req, res, next) {
    try {
        if (req.user.role == 'banned') {
            return res.status(403).json({ message: "You are banned from the platform" });
        }
        else {
            next();
        }
    } catch (error) {
        console.error("Error checking if user is banned:", error);
        res.status(500).json({ error: "Failed to check if user is banned" });
    }
}

// Check that campaign exists
async function checkCampaign(req, res, next) {
    try {
        const campaign = await Campaign.findByPk(req.params.campaign_id);

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        else {
            req.campaign = campaign
            next();
        }
    } catch (error) {
        console.error("Error checking campaign:", error);
        res.status(500).json("Error checking campaign id");
    }
}

// Require User authentication
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
function requireDm(req, res, next) {
    try {
        const userId = req.user.userId;

        const campaignDmId = req.campaign.userId;

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

// Require user to be owner of a given player character
async function requireOwner(req, res, next) {
    try{
        playerCharacter = await PlayerCharacter.findByPk(req.params.char_id);

        if(playerCharacter) {
            console.log(playerCharacter);
            console.log(playerCharacter.userId);
            console.log(req.user.userId);
        }

        if (!playerCharacter) {
            return res.status(404).json({ error: "Player Character not fount" });
        }

        else if (req.user.userId == playerCharacter.userId) {
            next();
        }

        else{
            return res.status(403).json({ error: 'You are not authorized to view this resource' });
        }
    } catch (error) {
        console.error('Player check failed:', error);
        res.status(500).json({ error: 'Failed to check Player status' });
    }
}

// Require user to be dm or player in a given campaign
async function requireParticipant(req, res, next) {
    try {
        campaign = req.campaign;

        if (campaign.userId == req.user.userId) {
            next();
        }

        else {
            players = await PlayerCharacter.findAll({
                where: { campaignId: campaign.campaignId },
                attributes: ["userId"]
            });

            playerUsers = []
            for (let i = 0; i < players.length; i++) {
                playerUsers.push(players[i]["userId"]);
            }

            if (playerUsers.includes(req.user.userId)) {
                next();
            }

            else {
                return res.status(403).json({
                    message: "Must be campaign participant to access this resource"
                });
            }
        }
    } catch (error) {
        console.error("Error checking participant status:", error);
        res.status(500).json({ error: "Failed to check participant status" });
    }
}

// Require user to be author of a given party message
async function requireAuthor(req, res, next) {
    try {
        const note = await PartyMessage.findByPk(req.params.message_id);

        if (!note) {
            res.status(404).json({ error: "Message not found" });
        }

        if (req.user.userId == note.userId) {
            next();
        }

        else {
            res.status(403).json("Must be note author to edit or delete note");
        } 
    } catch (error) {
        console.error("Error cheking author status:", error);
        res.status(500).json({error: "Failed to check author status"});
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

// Implement middleware
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
            password: hashedPassword,
            role: "not_banned"
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
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Login successful',
            token: token,
            user: {
                userId: user.userId,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// CAMPAIGN ROUTES 

// GET endpoint to return all campaigns a User plays a character in
app.get('/api/player/campaigns', requireAuth, checkBanned, async (req, res) => {
    try {
        const chars = await PlayerCharacter.findAll({
            where: {userId: req.user.userId },
            attributes: ["campaignId"]
        });

        campaignIds = []

        for (let i = 0; i < chars.length; i++) {
            campaignIds.push(chars[i]["campaignId"]);
        }

        const campaigns = await Campaign.findAll({
            where: {
                campaignId: campaignIds
            }
        })

        res.json(campaigns);
    } catch (error) {
        console.error("It didn't work:", error);
        res.status(500).json({ error: "It didn't work" });
    }
});

// GET endpoint to return all Campaigns a User DMs
app.get('/api/dm/campaigns', requireAuth, checkBanned, async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
            where: { userId: req.user.userId }
        });

        res.json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// GET endpoint to return a campaign by id if a User DMs for it
app.get('/api/campaigns/:campaign_id', requireAuth, checkBanned, checkCampaign, requireParticipant, async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.campaign_id, {
            include: [
                {
                    model: User,
                    as: 'dungeonMaster',
                    attributes: ["username"]

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
app.post('/api/campaigns', requireAuth, checkBanned, async (req, res) => {
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
app.put('/api/campaigns/:campaign_id', requireAuth, checkBanned, checkCampaign, requireDm, async (req, res) => {
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
app.delete('/api/campaigns/:campaign_id', requireAuth, checkBanned, checkCampaign, requireDm, async (req, res) => {
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

// GET /api/dm/:campaign_id/characters - return complete character information for characters in a campaign a user dms
app.get('/api/dm/:campaign_id/characters', requireAuth, checkBanned, checkCampaign, requireDm, async (req, res) => {
    try {
        const characters = await PlayerCharacter.findAll({
            where: { campaignId: req.params.campaign_id }
        });

        res.json(characters);
    } catch (error) {
        console.error("Error fetching player characters:", error);
        res.status(500).json({ error: "Failed to fetch player characters" });
    }
});

// GET /api/dm/:campaign_id/characters/:character_id - return complete character information for a single character by id in a campaign a user dms
app.get('/api/dm/:campaign_id/characters/:character_id', requireAuth, checkBanned, checkCampaign, requireDm, async (req, res) => {
    try {
        console.log(req.params.character_id);

        const character = await PlayerCharacter.findByPk(req.params.character_id);

        if (character.campaignId == req.params.campaign_id) {
            return res.json(character);
        }

        else {
            res.status(404).json({ error: "Player character is not in the specified campaign" });
        }
    } catch (error) {
        console.error('Error fetching player character', error);
        res.status(500).json({ error: "Failed to fetch player character" });
    }
});

// Return incomplete information for all characters a user is a player in
app.get('/api/player/:campaign_id/characters', requireAuth, checkBanned, checkCampaign, requireParticipant, async (req, res) => {
    try {
        const characters = await PlayerCharacter.findAll({
            where: {campaignId: req.params.campaign_id},
            attributes: ["name", "race", "gender", "userId"]
        });

        res.json(characters);
    } catch (error) {
        console.error("Error fetching player characters", error);
        res.status(500).json({ error: "Failed to fetch player characters" });
    }
});

// Return incomplete information for a single character in a campaign a user is a player in
app.get('/api/player/:campaign_id/characters/:character_id', requireAuth, checkBanned, checkCampaign, requireParticipant, async (req, res) => {
    try {
        const character = await PlayerCharacter.findByPk(req.params.character_id);

        console.log(character.campaignId);
        console.log(req.params.campaign_id);

        if (character.campaignId == req.params.campaign_id) {
            res.json(character);
        }
        else {
            res.status(404).json({error: "Character is not in specified campaign"});
        }
    } catch (error) {
        console.error("Error fetching player character");
        res.status(500).json({ error: "Error fetching player character" });
    }
})

// GET /api/my_characters - Returns complete information about a user's player characters
app.get('/api/my_characters', requireAuth, checkBanned, async (req, res) => {
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

// Return complete information about one of a user's characters by id
app.get('/api/my_characters/:char_id', requireAuth, checkBanned, requireOwner, async (req, res) => {
    try {
        const char = await PlayerCharacter.findByPk(req.params.char_id);

        if (!char) {
            return res.status(404).json({ error: 'Player Character not found' });
        }

        res.json(char);
    } catch (error) {
        console.error('Error fetching Player Character:', error);
        res.status(500).json( {error: 'Failed to fetch character' });
    }
});

// POST/ api/my_characters - create a new PlayerCharacter
app.post('/api/my_characters', requireAuth, checkBanned, async (req, res) => {
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
app.put('/api/my_characters/:char_id', requireAuth, checkBanned, requireOwner, async (req, res) => {
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
            { where: { charId: req.params.char_id }}
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Player character not found' });
        }

        const updatedChar = await PlayerCharacter.findByPk(req.params.char_id);
        res.json(updatedChar);
    } catch (error) {
        console.error('Error updating character:', error);
        res.status(500).json({ error: 'Failed to update character' });
    }
});

// DELETE /api/my_characters - delete a Player Character
app.delete('/api/my_characters/:char_id', requireAuth, checkBanned, requireOwner, async (req, res) => {
    try {
        const deletedRowsCount = await PlayerCharacter.destroy({
            where: { charId: req.params.char_id }
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

// PARTYMESSAGE ROUTES
// GET all party messages
app.get('/api/party_messages', requireAuth, checkBanned, async (req, res) => {
    try {
        const messages = await PartyMessage.findAll();

        res.json(messages);
    } catch (error) {
        console.error('Error fetching party messages:', error);
        res.status(500).json({ error: 'Failed to fetch party messages' });
    }
});

// GET all party messages for a single campaign by campaignId
app.get('/api/party_messages/:campaign_id', requireAuth, checkBanned, checkCampaign, requireParticipant, async (req, res) => {
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

// POST /api/party_messages/:campaign_id - Create a new party message for a given campaign
app.post('/api/party_messages/:campaign_id', requireAuth, checkBanned, checkCampaign, requireParticipant, async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.campaign_id);

        if (!campaign) {
            return res.status(404).json({error: 'Campaing not found' })
        }

        const { content } = req.body;

        const newMessage = await PartyMessage.create({
            content, 
            timePosted: require('sequelize').literal('CURRENT_TIMESTAMP'),
            userId: req.user.userId,
            campaignId: req.params.campaign_id
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating party message:', error);
        res.status(500).json({ error: 'Failed to create party message' });
    }
});

// PUT /api/party_messages/:id - edit an existing party message by messageId
app.put('/api/party_messages/:message_id', requireAuth, checkBanned, requireAuthor, async (req, res) => {
    try {
        const { content } = req.body;

        const [updatedRowsCount] = await PartyMessage.update(
            { content },
            { where: { messageId: req.params.message_id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Party message not found' });
        }

        const updatedMessage = await PartyMessage.findByPk(req.params.message_id);
        res.json(updatedMessage);
    } catch (error) {
        console.error('Error updating party message:', error);
        res.status(500).json({ error: 'Failed to update party message' });
    }
});

// DELETE /api/party_messages/:id - Delete an existing party message
app.delete('/api/party_messages/:message_id', requireAuth, checkBanned, requireAuthor, async (req, res) => {
    try {
        const deletedRowsCount = await PartyMessage.destroy({
            where: { messageId: req.params.message_id }
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