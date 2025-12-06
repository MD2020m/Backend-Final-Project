const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize database connection
const db = new Sequelize({
    dialect: process.env.DB_TYPE,
    storage: `database/${process.env.DB_NAME}` || 'database/dungeons_and_dragons.db',
    logging: false
})

// User model
const User = db.define('User', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Campaing model
const Campaign = db.define('Campaign', {
    campaignId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    schedule: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// PlayerCharacter model
const PlayerCharacter = db.define('PlayerCharacter', {
    charId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    alive: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    race: {
        type: DataTypes.STRING,
        allowNull: false
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false
    },
    primaryClass: {
        type: DataTypes.STRING,
        allowNull: false
    },
    primaryClassLevel: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    secondaryClass: {
        type: DataTypes.STRING,
        allowNull: true
    },
    secondaryClassLevel: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tertiaryClass: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tertiaryClassLevel: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    constitution: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    strength: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dexterity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    intelligence: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    wisdom: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    charisma: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    armorClass: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    hp: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    inventory: {
        type: DataTypes.STRING,
        allowNull: true
    },
    spellCasts: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    backstory: {
        type: DataTypes.STRING,
        allowNull: false
    },
    alignment: {
        type: DataTypes.STRING,
        allowNull: false
    },
    origin: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// CampaignNoteThread model
const CampaignNoteThread = db.define('CampaignNoteThread', {
    threadId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    toCharacter: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

// CampaignNote model
const CampaignNote = db.define('CampaignNote', {
    noteId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    timePosted: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

// PartyMessage Model
const PartyMessage = db.define('PartyMessage', {
    messageId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    timePosted: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

// Define Relationships
Campaign.hasOne(User, {foreignKey: 'userId', as: 'dungeonMaster'});
User.hasMany(Campaign, {foreignKey: 'userId', as: 'dmsCampaign'});

User.hasMany(PlayerCharacter, {foreignKey: 'userId'});
PlayerCharacter.belongsTo(User, {foreignKey: 'userId'});

Campaign.hasMany(PlayerCharacter, {foreignKey: 'campaignId'});
PlayerCharacter.belongsTo(Campaign, {foreignKey: 'campaignId'});

Campaign.hasMany(CampaignNoteThread, {foreignKey: 'campaignId'});
CampaignNoteThread.belongsTo(Campaign, {foreignKey: 'campaignId'});

CampaignNoteThread.hasMany(CampaignNote, {foreignKey: 'noteId'});
CampaignNote.belongsTo(CampaignNoteThread, {foreignKey: 'noteId'});

Campaign.hasMany(PartyMessage, {foreignKey: 'campaignId'});
PartyMessage.belongsTo(Campaign, {foreignKey: 'campaignId'});

// Initialize database
async function intializeDatabase() {
    try {
        await db.authenticate();
        console.log('Database connection established successfully.');

        await db.sync({ force: false });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to database:', error);
    }
}

intializeDatabase();

module.exports = {
    db,
    User,
    Campaign,
    PlayerCharacter,
    CampaignNoteThread,
    CampaignNote,
    PartyMessage
};