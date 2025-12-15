# Dungeons and Dragons API

# Overview
This API is intended to be used by players and dungeon masters participating in Dungeons and Dragons. The API is intended to make it easier for players to communicate details about their characters to dungeon masters and for dungeon masters to communicate details about campaigns to their players. 

# Recent Updates
## Authentication/Authorization
Authentication and authorization features have been added. These features implement a JWT token which is returned in the response body when a user successfully logs in through the `POST /api/login` endpoint. The token should then be attached to the `authentication` header of any requests to access, create, modify, or delete resources. 

## Role Based Authorization
A role based authorization feature has been added. Each user now has a `role` field which can contain either `"banned"` or `"not banned"` and will be set to `"not banned"` by default. If a User's role is `"banned"`, that user will not be able to access any endpoints using the JWT token returned to them at login. If a user's role is `"not banned"` they will have access to various endpoints based on other authorization rules

## Other Authorization Rules
Other authorization rules have been implemented:
- A User can only access Campaigns they participate in as either a DM or a Player
- Users can access complete information about Player Characters related to Campaigns they DM for
- Users can access incomplete information about Player Characters related to Campaigns they participate in
- Users can access their own Player Characters
- Users can only edit or delete their own Player Characters
- Users can access Party Messages related to Campaigns they participate in
- Users can only edit or delete their own Party Messages

# Resources
At a high level, the API's resources can be though of as falling into two categories: game elements, and communications. Game elements currently include data types Campaign, and PlayerCharacter. Communications currently includes data types CampaignNoteThread, CampaignNote, and PartyMessage. The exception to this categorization system is the User data type, which will store profile information for future implementation of authorization and authentication processes. In addition, the User data type serves as an 'owner' of instances of other data types. For example, a dungeon master can be though of as an 'owner' of a campaign and a User is the 'owner' of the PlayerCharacters they create. A User's 'Ownership' will be used in future authorization implementation to determine whether a given User is authorized to access a given resource.

## User
A User is a profile describing a user of the API. In the future, User data will be used in authentication and authorization implementation. User contains the following fields:
- userId: INTEGER, Primary Key, Auto-increment
- username: STRING, required
- password: STRING, required

A User can serve as a dungeon master (dm) for any number of Campaigns, and my own any number of PlayerCharacters. In addition, a User may author any number of PartyMessages and any number of CampaignNotes.

## Campaign
As those familiar with D&D might have guessed, a Campaign represents a single Dungeons and Dragons campaign. Campaign contains the following fields:
- campaignId: INTEGER, Primary Key, Auto-increment
- title: STRING, required
- description: STRING, required
- schedule: STRING, optional

A campaign belongs to exactly one User (the dm) and can have any number of PlayerCharacters. A campaign can have any number of CampaignNoteThreads and any number of PartyMessages.

## PlayerCharacter
A PlayerCharacter represents a character that a User has created to play as in a Campaign. PlayerCharacter contains the following fields:
- charId: INTEGER, Primary Key, Auto-increment
- alive: BOOLEAN, required
- name: STRING, required
- race: STRING, required
- gender: STRING, required
- primaryClass: STRING, required
- primaryClassLevel: STRING, required
- secondaryClass: STRING, required
- secondaryClassLevel: STRING, required
- tertiaryClass: STRING, required
- tertiaryClassLevel: STRING, required
- constitution: INTEGER, required
- strength: INTEGER, required
- dexterity: INTEGER, required
- intelligence: INTEGER, required
- wisdom: INTEGER, required
- charisma: INTEGER, required
- armorClass: INTEGER, required
- hp: INTEGER, required
- inventory: STRING, optional
- spellCasts: INTEGER, required
- backstory: STRING, required
- alignment: STRING, required
- origin: STRING, optional

A PlayerCharacter belongs to exactly one User and exactly one Campaign. 

## PartyMessage
PartyMessages are messages sent in a message board between all participants in a Campaign. PartyMessage contains the following fields:
- messageId: INTEGER, PrimaryKey, Auto-increment
- content: STRING, required
- timePosted: STRING, required

A PartyMessage belongs to exactly one campaign and exactly one user (its author).

---

# Endpoints

[Postman Endpoint Documentation Here](https://documenter.getpostman.com/view/49838918/2sB3dTsT1a)



---
# Setup
To setup this application on your local device, clone this repository and follow these directions:
## Database Setup
database/setup.js sets up the database for this application. Before running setup.js, you should configure a .env file with a DB_TYPE variable defining the SQL dialect you wish to use, a DB_NAME variable providing a name for the .db file you wish to create, and a NODE_ENV variable specifying the type of environment you intend to operate the database in. 

Once this is done, you should examine the models and relationships and relationships defined in setup.js using the Sequelize ORM and adjust them as necessary. Once these are defined to your liking, you need only run the prompt `node ./database/setup.js` in the command line to set up your database.

## Database Seeding
If you wish to seed your database, you should first examine the database/seed.js file and take note of the sample data, defined using the Sequelize ORM, that will be added to your database when this file is run. Add, remove, or edit any sample data you wish. Once your sample data is to your liking run the command `node ./database/seed.js` in the command line to seed your database with the sample data.

## Server Start
Before starting your server you should configure a PORT environment variable in your .env file to specify the port on which you will run your server. Then, examine the server.js file. This file defines middleware and routes for the application. Adjust routes and middleware as necessary. Once routes and middleware are to your liking, run the command `npm start` on your command line to start your server. Once your server is running you will be able to use your Dungeons and Dragons API on your local machine. If your application is deployed, you will be able to use your application by accessing it through the appropriate URL on any machine.