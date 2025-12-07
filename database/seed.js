const bcrypt = require('bcryptjs');
const { db, User, Campaign, PlayerCharacter, CampaignNoteThread, CampaignNote, PartyMessage } = require('./setup');
const { now } = require('sequelize/lib/utils');
const { Sequelize } = require('sequelize');

async function seedDatabase() {
    try {
        // Force sync to reset database
        await db.sync({ force: true });
        console.log('Database reset successfully.');

        // Create sample users
        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = await User.bulkCreate([
            {
                username: 'dmarsh00',
                password: hashedPassword
            },
            {
                username: 'tofutron',
                password: hashedPassword
            },
            {
                username: 'totinos34',
                password: hashedPassword
            }
        ]);

        // Create sample campaigns
        const campaigns = await Campaign.bulkCreate([
            {
                title: "Hoard of the Dragon Queen",
                description: "Track down an ancient and malevolent dragon to stop her rampage and steal the treasure she hoards",
                schedule: "Thursdays, 7-10pm",
                userId: users[1].userId
            },
            {
                title: "High Seas Heist",
                description: "Sail the seven seas collecting treasure along the way in search of a legendary quarry fabled to lie under heavy guard in a far off land",
                schedule: null,
                userId: users[1].userId
            },
            {
                title: "A New World",
                description: "A beam of light appears from above in a fading old world underground. A group of heros are sent on an expedition in search of a new hope at its source",
                schedule: null,
                userId: users[0].userId
            }
        ]);

        // Create sample PlayerCharacters
        const playerCharacters = await PlayerCharacter.bulkCreate([
            {
                alive: true,
                name: 'Alyson Woodbrace',
                race: 'human',
                gender: 'female',
                primaryClass: 'fighter',
                primaryClassLevel: 13,
                secondaryClass: null,
                secondaryClassLevel: null,
                tertiaryClass: null,
                tertiaryClassLevel: null,
                constitution: 13,
                strength: 15,
                dexterity: 11,
                intelligence: 9,
                wisdom: 9,
                charisma: 11,
                armorClass: 23,
                hp: 22,
                inventory: 'short sword, 3 javelins, magic armor',
                spellCasts: 0,
                backstory: 'A banished princess from a far off land, Alyson Woodbrace learned to make her way through the world with her sword. Though a seasoned traveler and an excellent warrior, she has had little time to spare on much else',
                alignment:'True Neutral',
                origin: 'Royal',
                userId: users[0].userId,
                campaignId: campaigns[0].campaignId
            },
            {
                alive: true,
                name: 'Gorub',
                race: 'orc',
                gender: 'male',
                primaryClass: 'berserker',
                primaryClassLevel: 2,
                secondaryClass: 'fighter',
                secondaryClassLevel: 1,
                tertiaryClass: null,
                tertiaryClassLevel: null,
                constitution: 13,
                strength: 12,
                dexterity: 8,
                intelligence: 6,
                wisdom: 7,
                charisma: 8,
                armorClass: 19,
                hp: 18,
                inventory: null,
                spellCasts: 0,
                backstory: "In Gorub's tribe, orcs are sent out to prove themselves by using their strength and whatever cunning they can muster to bring a great treasure back to the tribe. Gorub has been searching for years now, and is determined to end his search soon",
                alignment: 'Chaotic Neutral',
                origin: null,
                userId: users[2].userId,
                campaignId: campaigns[1].campaignId
            },
            {
                alive: true,
                name: 'Gruff',
                race: 'minotaur',
                gender: 'male',
                primaryClass: 'artificer',
                primaryClassLevel: 7,
                secondaryClass: 'fighter',
                secondaryClassLevel: 1,
                tertiaryClass: null,
                tertiaryClassLevel: null,
                constitution: 12,
                strength: 12,
                dexterity: 10,
                intelligence: 11,
                wisdom: 9,
                charisma: 6,
                armorClass: 26,
                hp: 17,
                inventory: 'mariners armor, trident, net',
                spellCasts: 4,
                backstory: 'Poor Gruff was kidnapped at a young age by pirates who believed a minotaur might prove useful and raised on the seas by a skilled dwarf who shared his fate. When the crew that had conscripted him was defeated, Gruff narrowly escaped with his life and a determination to find his way home',
                alignment: 'Neutral Good',
                origin: null,
                userId: users[0].userId,
                campaignId: campaigns[1].campaignId
            },
            {
                alive: true,
                name: 'Burny',
                race: 'warforged',
                gender: 'male',
                primaryClass: 'druid',
                primaryClassLevel: 10,
                secondaryClass: null,
                secondaryClassLevel: null,
                tertiaryClass: null,
                tertiaryClassLevel: null,
                constitution: 10,
                strength: 11,
                dexterity: 7,
                intelligence: 8,
                wisdom: 13,
                charisma: 8,
                armorClass: 15,
                hp: 16,
                inventory: null,
                spellCasts: 0,
                backstory: "Burny was created from scavenged tree roots as an eternal sentinel for the capital during the kingdom's golden age. But that age has gone now, and Burny has guarded only himself for some time, having been discarded by the capital's remaining citizens, who would prefer no sentinel keep watch over them",
                alignment: 'lawful good',
                origin: null,
                userId: users[1].userId,
                campaignId: campaigns[2].campaignId
            }
        ]);

        // Create sample CampaignNoteThreads
        campaignNoteThreads = await CampaignNoteThread.bulkCreate([
            {
                toCharacter: null,
                campaignId: campaigns[0].campaignId
            },
            {
                toCharacter: playerCharacters[0].charId,
                campaignId: playerCharacters[0].campaignId
            },
            {
                toCharacter: null,
                campaignId: campaigns[1].campaignId
            }
        ]);

        // Create sample CampaignNotes
        await CampaignNote.bulkCreate([
            {
                content: "Hey everyone, here's an summary in case you forgot anything from last night's campaign...",
                timePosted: Sequelize.literal('CURRENT_TIMESTAMP'),
                userId: users[1].userId,
                threadId: campaignNoteThreads[0].threadId
            },
            {
                content: "Hey, during the long rest you took at the end of last session, your character had a dream about... ",
                timePosted: Sequelize.literal('CURRENT_TIMESTAMP'),
                userId: users[1].userId,
                threadId: campaignNoteThreads[1].threadId
            },
            {
                content: "Hey everyone, here's a quick preface for what's been going on before our first session in the world of High Seas Heist",
                timePosted: Sequelize.literal('CURRENT_TIMESTAMP'),
                userId: users[1].userId,
                threadId: campaignNoteThreads[2].threadId
            }
        ]);

        // Create a sample PartyMessage
        await PartyMessage.bulkCreate([
            {
                content: "Hey everyone, I was hoping we could switch to a new day for session. Thursday doesn't work for me anymore",
                timePosted: Sequelize.literal('CURRENT_TIMESTAMP'),
                campaignId: campaigns[0].campaignId,
                userId: users[0].userId
            },
            {
                content: "Hey everyone, I'm really excited to start 'A New World'! Can you all let me know what days and times work best for regular session?",
                timePosted: Sequelize.literal('CURRENT_TIMESTAMP'),
                campaignId: campaigns[2].campaignId,
                userId: users[0].userId
            }
        ]);

        console.log('Database seeded successfully!');
        console.log('Sample Users: dmarsh00, tofutron, totinos34');
        console.log('All passwords: password123');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        console.log(await PartyMessage.findAll())
        await db.close();
    }
}

seedDatabase();