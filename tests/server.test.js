const request = require('supertest');
const app = require('../server');

describe('D&D API', () => {
    //require('../database/seed').seedDatabase();

    test('should return all campaigns', async () => {
        const response = await request(app).get('/api/campaigns');

        expect(response.status).toBe(200);
        //expect(response.body).toHaveProperty('title');
    });

    test('should return a campaign by ID', async () => {
        const response = await request(app).get('/api/campaigns/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('campaignId', 1)
    });

    test('should return all characters', async () => {
        const response = await request(app).get('/api/my_characters');

        expect(response.status).toBe(200);
        //expect(response.body).toHaveProperty("name");
        //expect(response.body).toHaveProperty("charId");
    });

    test('should return character by Id', async() => {
        const response = await request(app).get('/api/my_characters/2');
        
        expect(response.status).toBe(200);
        //expect(response.body).toHaveProperty('name');
       // expect(response.body).toHaveProperty('charId', 1);
    });
});