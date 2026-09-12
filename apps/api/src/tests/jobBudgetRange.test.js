import assert from 'assert';
import { validateCreateJob } from '../validators/job.js';
import { postJob } from '../controllers/jobController.js';

async function runTests() {
  console.log('Running job budget range unit tests...');

  // Test 1: Valid budget range accepted (201)
  {
    const payload = { title: 'Full Stack Dev', description: 'Build a web app with React and Node.js', budgetMin: 1000, budgetMax: 5000, categoryId: 'web-dev', skills: ['react', 'node'] };
    const res = validateCreateJob(payload);
    assert.strictEqual(res.valid, true);

    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = { status: (code) => { statusCalled = code; return { json: (d) => { jsonResult = d; return d; } }; } };
    await postJob({ body: payload }, mockRes);
    assert.strictEqual(statusCalled, 201);
    console.log('✔ Test 1 passed: Valid budget range accepted with 201');
  }

  // Test 2: Inverted budget range rejected (400)
  {
    const payload = { title: 'Full Stack Dev', description: 'Build a web app with React and Node.js', budgetMin: 5000, budgetMax: 1000, categoryId: 'web-dev' };
    const res = validateCreateJob(payload);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('budgetMax'));

    let statusCalled = 0;
    const mockRes = { status: (code) => { statusCalled = code; return { json: (d) => d }; } };
    await postJob({ body: payload }, mockRes);
    assert.strictEqual(statusCalled, 400);
    console.log('✔ Test 2 passed: Inverted budget range rejected with 400');
  }

  // Test 3: Equal budget min/max accepted
  {
    const payload = { title: 'Fixed Price Job', description: 'A fixed price development contract', budgetMin: 3000, budgetMax: 3000, categoryId: 'design' };
    const res = validateCreateJob(payload);
    assert.strictEqual(res.valid, true);
    console.log('✔ Test 3 passed: Equal min/max budget accepted');
  }

  console.log('All job budget range tests passed successfully!');
}

runTests();
