const request = require('supertest');
const app = require('../server');

describe('D&D API', () => {

    test('should return 401 since User is not authenticated', async () => {
        const response = await request(app).get('/api/dm/campaigns');

        expect(response.status).toBe(401);
    });

    test('should return 401 since User is not authenticated', async () => {
        const response = await request(app).get('/api/player/campaigns');

        expect(response.status).toBe(401);
    });

    test('should return 401 since user is not authenticated', async () => {
        const response = await request(app).get('/api/campaigns/1');

        expect(response.status).toBe(401);
    });

    test('should return 401 response', async () => {
        const response = await request(app).post('/api/campaigns');

        expect(response.status).toBe(401);
    });

    test('should return 401 response', async () => {
        const response = await request(app).put('/api/campaigns/1');

        expect(response.status).toBe(401);
    });

    test('should return 401 response', async () => {
        const response = await request(app).delete('/api/campaigns/1');

        expect(response.status).toBe(401);
    });

    test('should return 401 response', async () => {
        const response = await request(app).get('/api/dm/1/characters');

        expect(response.status).toBe(401);
    });



    test('should return 401 since user is not authenticated', async () => {
        const response = await request(app).get('/api/my_characters');

        expect(response.status).toBe(401);
    });

    test('should return 401 since user is not authenticated', async () => {
        const response = await request(app).get('/api/my_characters/2');
        
        expect(response.status).toBe(401);
    });

    test('should create a new return a User and 201 response', async () => {
        const response = await request(app).post('/api/register').send({
            username: "johnnyTest",
            password: "dukey_talking_dog"
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
    })

    test('should return a User and a new JWT token', async () => {
        const response = await request(app).post('/api/login').send({
            username: "dmarsh00",
            password: "password123"
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
    });

    // I guess I can't test whether an authenticated user can access endpoints.
    // Because there was no lesson on how to add a header to a request in our test scripts.
});