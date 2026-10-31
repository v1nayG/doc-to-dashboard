const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { requireDatabase } = require('../controllers/chatController');

const createResponse = () => ({
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

test('protected routes reject disconnected database before querying a user', async () => {
    assert.notEqual(mongoose.connection.readyState, 1);
    const response = createResponse();
    let nextCalled = false;

    await protect({ headers: {} }, response, () => { nextCalled = true; });

    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /database is not connected/);
    assert.equal(nextCalled, false);
});

test('document chat database guard returns a service-unavailable response', () => {
    assert.notEqual(mongoose.connection.readyState, 1);
    const response = createResponse();
    let nextCalled = false;

    requireDatabase({}, response, () => { nextCalled = true; });

    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /database is not connected/);
    assert.equal(nextCalled, false);
});