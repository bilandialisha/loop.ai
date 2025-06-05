const request = require('supertest');
const { app, server } = require('../Backend/server');

describe('Data Ingestion API', () => {
    afterAll(done => {
        server.close(done);
    });

    describe('POST /ingest', () => {
        it('should create ingestion request with valid input', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3, 4, 5],
                    priority: 'HIGH'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ingestion_id');
        });

        it('should handle invalid priority', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3],
                    priority: 'INVALID'
                });

            expect(response.status).toBe(400);
        });

        it('should handle invalid ids', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [0, -1, 1e10],
                    priority: 'LOW'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /status/:ingestionId', () => {
        let ingestionId;

        beforeAll(async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3],
                    priority: 'LOW'
                });
            ingestionId = response.body.ingestion_id;
        });

        it('should get status of existing ingestion', async () => {
            const response = await request(app)
                .get(`/status/${ingestionId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ingestion_id', ingestionId);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('batches');
        });

        it('should handle non-existent ingestion id', async () => {
            const response = await request(app)
                .get('/status/nonexistent-id');

            expect(response.status).toBe(404);
        });
    });

    describe('Priority and Rate Limit Tests', () => {
        it('should process high priority requests before low priority', async () => {
            // Send low priority request
            const lowPriorityResponse = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3, 4, 5],
                    priority: 'LOW'
                });

            // Send high priority request
            const highPriorityResponse = await request(app)
                .post('/ingest')
                .send({
                    ids: [6, 7, 8],
                    priority: 'HIGH'
                });

            // Wait for processing to start
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check status of both requests
            const highPriorityStatus = await request(app)
                .get(`/status/${highPriorityResponse.body.ingestion_id}`);

            expect(highPriorityStatus.body.batches[0].status).not.toBe('yet_to_start');
        });

        it('should respect rate limit of 3 ids per 5 seconds', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3, 4, 5, 6],
                    priority: 'MEDIUM'
                });

            const ingestionId = response.body.ingestion_id;

            // Check initial status
            const initialStatus = await request(app)
                .get(`/status/${ingestionId}`);

            // Wait 3 seconds
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check status again
            const midStatus = await request(app)
                .get(`/status/${ingestionId}`);

            // Verify that only first batch is processed
            expect(midStatus.body.batches[0].status).not.toBe('yet_to_start');
            expect(midStatus.body.batches[1].status).toBe('yet_to_start');
        });
    });
});
