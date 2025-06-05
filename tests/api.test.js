const request = require('supertest');
const { app, server } = require('../Backend/server');

describe('Data Ingestion API', () => {
    afterAll(done => {
        server.close(done);
    });

    describe('Input Validation', () => {
        it('should validate id range', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [0, 1e10],
                    priority: 'HIGH'
                });
            expect(response.status).toBe(400);
        });

        it('should validate priority values', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2],
                    priority: 'INVALID'
                });
            expect(response.status).toBe(400);
        });
    });

    describe('Rate Limiting', () => {
        it('should respect 5 second rate limit', async () => {
            const start = Date.now();
            
            // Send multiple batches
            await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3, 4, 5, 6],
                    priority: 'HIGH'
                });

            // Wait and check processing time
            await new Promise(resolve => setTimeout(resolve, 6000));
            const processingTime = Date.now() - start;
            
            expect(processingTime).toBeGreaterThanOrEqual(5000);
        });
    });

    describe('Priority Processing', () => {
        it('should process high priority before low priority', async () => {
            // Send low priority batch
            const lowPriority = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3],
                    priority: 'LOW'
                });

            // Send high priority batch
            const highPriority = await request(app)
                .post('/ingest')
                .send({
                    ids: [4, 5, 6],
                    priority: 'HIGH'
                });

            // Wait for processing to start
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check high priority status
            const highStatus = await request(app)
                .get(`/status/${highPriority.body.ingestion_id}`);

            expect(highStatus.body.batches[0].status).not.toBe('yet_to_start');
        });
    });

    describe('Health Check', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('healthy');
        });
    });
});
