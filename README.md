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