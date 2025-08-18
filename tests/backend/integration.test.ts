import request from 'supertest'
import { createApp } from '../../server/app'
import { testUser, testCategory } from './setup'

// Simplified integration tests that focus on basic endpoint functionality
describe('API Integration Tests', () => {
  let app: any

  beforeAll(async () => {
    app = await createApp()
  })

  describe('Basic Health Check Endpoints', () => {
    it('should return API information on root endpoint', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.body).toMatchObject({
        message: 'AI Email Organizer API',
        version: '1.0.0',
        endpoints: expect.any(Object)
      })
    })

    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200)

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        service: 'ai-email-organizer'
      })
    })

    it('should respond to ping', async () => {
      const response = await request(app)
        .get('/api/v1/ping')
        .expect(200)

      expect(response.text).toBe('pong')
    })
  })

  describe('Authentication Requirements', () => {
    it('should require authentication for protected category endpoints', async () => {
      await request(app)
        .get('/api/v1/categories')
        .expect(401)
    })

    it('should require authentication for email endpoints', async () => {
      await request(app)
        .get('/api/v1/emails')
        .expect(401)
    })
  })

  describe('Basic Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/v1/non-existent')
        .expect(404)
    })

    it('should handle malformed JSON gracefully', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)
    })
  })

  describe('CORS Configuration', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/v1/categories')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204)

      expect(response.headers['access-control-allow-methods']).toMatch(/POST/)
    })
  })
})