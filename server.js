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



// USER ROUTES 

