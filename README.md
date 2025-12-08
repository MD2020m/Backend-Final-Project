# Dungeons and Dragons API

# Overview
This API is intended to be used by players and dungeon masters participating in Dungeons and Dragons. The API is intended to make it easier for players to communicate details about their characters to dungeon masters and for dungeon masters to communicate details about campaigns to their players. 

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

## CampaignNoteThread
A CampaignNoteThread is merely a tool for organizing CampaignNotes. It is intended as a message board between a dm and one or all players in a single campaign. A CampaignNoteThread has the following fields:
- threadId: INTEGER, Primary Key, Auto-increment
- toCharacter: INTEGER, optional

A CampaignNoteThread belongs to exactly one Campaign. A CampaignNoteThread can have any number of CampaignNotes.

## CampaignNotes
CampaignNotes are messages sent in CampaignNoteThreads. They are intended to be used to communicate campaign details between players and dms. A CampaignNote contains the following fields:
- noteId: INTEGER, Primary Key, Auto-increment
- content: STRING, required
- timePosted: DATE, required

A CampaignNote belongs to exactly one CampaignNoteThread and exactly one user (its author). 

## PartyMessage
PartyMessages are messages sent in a message board between all participants in a Campaign. PartyMessage contains the following fields:
- messageId: INTEGER, PrimaryKey, Auto-increment
- content: STRING, required
- timePosted: STRING, required

A PartyMessage belongs to exactly one campaign and exactly one user (its author).

---

# Endpoints

`PLACEHOLDER for future link to detailed endpoint documentation developed in Postman`

## Campaign endpoints
### GET
There are two GET endpoints to return Campaign data: `GET /api/campaigns` and `GET /api/campaigns/:id`. 

The former currently returns data on all campaigns, including the campaign's dm and the Campaign's PlayerCharacters. In the future, this endpoint will implement authorization processes to only return Campaigns that a given user either dms for or participates in through a PlayerCharacter.

The latter currently returns the same data on a single campaign by campaignId. In the future, this endpoint will implement authorization processes to only return the requested Campaign if a User participates in the Campaign either as dm or through a PlayerCharacter.

### POST
Campaign includes one POST endpoint: `POST /api/campaigns`. This endpoint accepts the following data given in the request body:
- title: STRING, required
- description: STRING, required
- schedule: STRING, optional
- userId: INTEGER, required

This data is then used to create a new Campaign instance, and the User referenced by userId is assigned as dm. After authentication processes are implemented, userId will no longer be accepted by this endpoint, and User will be automatically assigned as dm when they create a campaign through this endpoint.

### PUT
Campaign has one PUT endpoint, `PUT /api/campaigns/:id`. This endpoint accepts the following data given in the request body:
- title: STRING, required
- description: STRING, required
- schedule: STRING, optional

If the Campaign whose campaignId matches the request's id parameter exists, it will be updated to contain the data provided in the request body, and a 201 response will be returned. Otherwise, a 404 response will be returned as the requested Campaign was not found.

### DELETE
Campaign has one DELETE endpoint, `DELETE /api/campaigns/:id`. When this endpoint receives a request, it will search for the Campaign whose campaignId matches the id request parameter. If such a Campaign is found, it will be removed from the database and a 200 response will be returned. If such a request is not found, If such a Campaign is not found, a 404 response will be returned.

## PlayerCharacter endpoints
### GET
Like Campaign, PlayerCharacter has two GET endpoints: `GET /api/my_characters` and `GET /api/my_character/:id`.

The former currently returns all PlayerCharacters. In the future, authentication processes will be implemented so that this endpoint only returns characters that a User owns. 

The latter returns a single PlayerCharacter whose charId matches the id request parameter. In the future, this endpoint will be revised to only return the requested PlayerCharacter data if a User owns the PlayerCharacter.

In the future, two analogous endpoints will be added for use by dms to view PlayerCharacters belonging to other Users if they participate in the a given Campaign that the User dms for.

### POST
PlayerCharacter has one POST endpoint: `POST /api/my_characters`. Users can use this endpoint to create a new PlayerCharacter. Currently, this endpoint accepts data for every field in PlayerCharacter except for alive, as well as userId. This data is used to create a new instance of PlayerCharacter with the alive field set to true by default. The User whose userId matches that given in the body will be assigned as the PlayerCharacter's owner. In the future, authentication processes will be used to automatically assign a User as the owner of any PlayerCharacter they create.

### PUT
PlayerCharacter has one PUT endpoint:` PUT /api/my_characters/:id`. This endpoint accapts data for every field in PlayerCharacter in the request body. If a PlayerCharacter whose charId matches the id request parameter is found, the PlayerCharacter will be updated with the data given in the request body. Otherwise, a 404 response will be returned as the requested PlayerCharacter was not found.

### DELETE
PlayerCharacter's DELETE endpoint, `DELETE /api/my_characters/:id` deletes a PlayerCharacter by charId. If a PlayerCharacter whose charId matches the id request parameter is not found, a 404 response will be returned.

## CampaignNoteThread
### GET
Currently, CampaignNoteThread has no GET endpoint. Instead, the notes within any given thread can be accessed by threadId in a CampaignNote GET endpoint.

### POST
CampaignNote has one POST endpoint: `POST /api/campaign_note_thread/:campaign_id`. This endpoint accepts an optional toCharacter value in its body. This endpoint first searches for a Campaign whose campaignId matches the campaign_id request parameter. If no such Campaign is found a 404 response is returned. If such a Campaign is found a new CampaignNoteThread is created. The new CampaignNoteThread's toCharacter field is assigned the value given in the request body (or null if none was provided) and the Campaign whose campaignId matches the campaign_id request parameter is assigned as owner of the CampaignNoteThread. In addition, a 201 response will be returned.

### PUT
CampaignNoteThread has one PUT endpoint: `PUT /api/campaign_note_thread/:id`. This endpoint accepts an optional toCharacter value in its body. If a CampaignNoteThread whose threadId matches the id request parameter is found, its toCharacter field is updated to the value given in the request body (null if none is given). Otherwise, a 404 response is returned.

### DELETE
CampaignNoteThread has the `DELETE /api/campaign_note_thread/:id` endpoint. If a CampaignNoteThread whose thread_id matches the id request parameter is found, it is deleted and a 200 response is returned. Otherwise, a 404 response is returned.

## CampaignNote
### GET
CampaignNote has two GET endpoints: `GET /api/campaign_notes` and `GET /api/campaign_notes/:thread_id`. 

The former returns all CampaignNoteThreads and their respective CampaignNotes. In the future, this endpoint will be adjusted to return only CampaignNoteThreads related to a given campaign (specified through a campaign_id request parameter) that a given User has access to. 

The latter returns all CampaignNotes in a given thread specified by the thread_id request parameter. If a CampaignNoteThread whose threadId is matches the thread_id parameter is not found a 404 response is returned.

### POST
CampaignNote has the the `POST /api/campaign_notes/:thread_id`. This endpoint accepts content and userId values in its request body. If a CampaignNoteThread whose threadId matches the thread_id request parameter is found a CampaignNote belonging to that thread will be created with content and userId from the request body, timePosted set to the time at which the CampaignNote was created, and threadId set to the thread_id request parameter. Otherwise, a 404 response will be returned.

### PUT
CampaingNote's PUT endpoint, `PUT /api/campaign_notes/:id` updates a CampaignNote by noteId. This endpoint accepts a content value in its request body. If a CampaignNote whose noteId matches the id request parameter is found, its content field will be updated with the content data given in the request body. Otherwise, a 404 response will be returned.

### DELETE
CampaignNote has the following DELETE endpoint: `DELETE /api/campaign_notes/:id`. If a CampaignNote whose noteId matches the id request parameter is found, it will be deleted from the database. If not, a 404 response will be returned.

## PartyMessage
PartyMessage's endpoints are analogous to CampaignNote's endpoints except that PartyMessages belong directly to Campaigns. 

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