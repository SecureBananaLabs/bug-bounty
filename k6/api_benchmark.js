javascript
import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';
import { vu } from 'k6/execution'; // Import vu for unique ID per virtual user

// --- Configuration ---

// Define the base URL for your API. It's recommended to set this via environment variable:
// For example: k6 run -e API_BASE_URL=http://localhost:3000 k6/api_benchmark.js
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Authentication credentials (use environment variables for sensitive data in production)
const AUTH_USERNAME = __ENV.AUTH_USERNAME || 'testuser';
const AUTH_PASSWORD = __ENV.AUTH_PASSWORD || 'password';
const AUTH_ENDPOINT = __ENV.AUTH_ENDPOINT || '/api/login';

// Load thresholds from a JSON file, as required by acceptance criteria.
// This assumes 'thresholds.json' is located in the same directory as the k6 script
// or at a path accessible by `open()`.
const sharedThresholds = new SharedArray('Thresholds', function () {
  try {
    return JSON.parse(open('./thresholds.json'));
  } catch (error) {
    console.error(`ERROR: Could not load thresholds.json. Please ensure it exists and is valid JSON. Error: ${error}`);
    // Provide a fallback or throw to stop the test if thresholds are critical
    return {}; // Empty object means no thresholds will be applied
  }
});

// Realistic payload templates. Data is loaded once and shared across VUs.
// Each entry defines a base template and a function to generate unique data for each request.
const payloadTemplates = new SharedArray('Payload Templates', function () {
  return [
    {
      endpoint: '/api/items',
      method: 'POST',
      template: {
        name: 'Benchmark Item Placeholder',
        description: 'Item created during performance testing to simulate data creation.',
        quantity: 1,
        price: 1.00,
        category: 'Electronics',
      },
      // Function to generate unique data when a payload is requested for this template
      generate: (payload) => {
        payload.name = `Benchmark Item ${Date.now()}-${Math.random().toFixed(4)}`;
        payload.quantity = Math.floor(Math.random() * 100) + 1;
        payload.price = parseFloat((Math.random() * 1000).toFixed(2));
        return payload;
      },
    },
    {
      endpoint: '/api/users', // Assuming a POST /api/users for creation, or PUT for update also creates
      method: 'POST',
      template: {
        firstName: 'Benchmark',
        lastName: 'User Placeholder',
        email: 'benchmark.user.placeholder@example.com',
        isActive: true,
      },
      generate: (payload) => {
        payload.lastName = `User ${Date.now()}-${Math.random().toFixed(4)}`;
        payload.email = `benchmark.user.${Date.now()}-${Math.random().toFixed(6)}@example.com`;
        return payload;
      },
    },
    {
      endpoint: '/api/users/:id',
      method: 'PUT',
      template: {
        firstName: 'UpdatedBenchmark',
        lastName: 'User Placeholder',
        email: 'updated.benchmark.user.placeholder@example.com',
        isActive: true,
      },
      generate: (payload) => {
        payload.lastName = `Updated User ${Date.now()}-${Math.random().toFixed(4)}`;
        payload.email = `updated.benchmark.user.${Date.now()}-${Math.random().toFixed(6)}@example.com`;
        return payload;
      },
    },
    {
      endpoint: '/api/orders/:id/status',
      method: 'PATCH',
      template: {
        status: 'shipped',
        trackingNumber: 'TRACK-PLACEHOLDER',
      },
      generate: (payload) => {
        payload.trackingNumber = `TRACK-${Math.floor(Math.random() * 1e9)}`;
        return payload;
      },
    },
    {
      endpoint: '/api/products', // Assuming a POST /api/products for creation
      method: 'POST',
      template: {
        name: 'Product for Deletion Placeholder',
        description: 'Product created for deletion during testing.',
        price: 9.99,
        category: 'Test',
      },
      generate: (payload) => {
        payload.name = `Product for Deletion ${Date.now()}-${Math.random().toFixed(4)}`;
        return payload;
      },
    },
    {
      endpoint: '/api/products/:id',
      method: 'DELETE',
      template: {}, // DELETE requests typically have no body
    },
  ];
});

// Helper function to retrieve a dynamic payload based on endpoint and method
function getDynamicPayload(endpointPath, method) {
  const templateEntry = payloadTemplates.find(p => p.endpoint === endpointPath && p.method === method);
  if (!templateEntry) {
    if (method === 'DELETE' || method === 'GET') return {}; // No payload needed for GET/DELETE
    throw new Error(`No realistic payload template found for ${method} ${endpointPath}`);
  }

  // Deep copy the base template to avoid modifying shared data across VUs
  let payload = JSON.parse(JSON.stringify(templateEntry.template));
  // Apply unique generation logic if available for this template
  if (templateEntry.generate) {
    payload = templateEntry.generate(payload);
  }
  return payload;
}

// Helper function to make authenticated HTTP requests, applying common headers and tags
function makeAuthenticatedRequest(method, url, payload, tags, authToken) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // Use the authentication token
    },
    tags: tags // Custom tags for metric categorization
  };

  let res;
  switch (method.toUpperCase()) {
    case 'GET':
      res = http.get(url, params);
      break;
    case 'POST':
      res = http.post(url, JSON.stringify(payload), params);
      break;
    case 'PUT':
      res = http.put(url, JSON.stringify(payload), params);
      break;
    case 'PATCH':
      res = http.patch(url, JSON.stringify(payload), params);
      break;
    case 'DELETE':
      res = http.del(url, null, params); // DELETE requests often have no body, hence `null`
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
  return res;
}

// Configuration options for the k6 test run
export const options = {
  // Define custom tags to categorize metrics (e.g., by scenario, endpoint type)
  tags: {
    test_type: 'baseline_api_benchmark',
  },

  // Scenarios define different load profiles and target specific functions.
  // This allows simulating various user behaviors concurrently.
  scenarios: {
    // Scenario 1: High volume GET requests for item lists (read-heavy)
    get_all_items_scenario: {
      executor: 'constant-vus',
      vus: 10,           // 10 virtual users
      duration: '60s',   // Run for 60 seconds
      exec: 'get_items', // Function to execute
      tags: { scenario_type: 'read_heavy', api_endpoint: '/api/items' },
    },
    // Scenario 2: Moderate volume GET requests for specific items (read-moderate)
    get_single_item_scenario: {
      executor: 'constant-vus',
      vus: 5,
      duration: '60s',
      exec: 'get_item_by_id',
      tags: { scenario_type: 'read_moderate', api_endpoint: '/api/items/:id' },
    },
    // Scenario 3: Low volume POST requests for creating items (write-light)
    create_item_scenario: {
      executor: 'constant-vus',
      vus: 2,
      duration: '60s',
      exec: 'create_item',
      tags: { scenario_type: 'write_light', api_endpoint: '/api/items' },
    },
    // Scenario 4: Low volume PUT requests for updating users (write-light)
    update_user_scenario: {
      executor: 'constant-vus',
      vus: 2,
      duration: '60s',
      exec: 'update_user',
      tags: { scenario_type: 'write_light', api_endpoint: '/api/users/:id' },
    },
    // Scenario 5: Low volume PATCH requests for updating order status (write-light)
    patch_order_status_scenario: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      exec: 'patch_order_status',
      tags: { scenario_type: 'write_light', api_endpoint: '/api/orders/:id/status' },
    },
    // Scenario 6: Low volume DELETE requests for deleting products (write-light)
    delete_product_scenario: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      exec: 'delete_product',
      tags: { scenario_type: 'write_light', api_endpoint: '/api/products/:id' },
    }
  },

  // Thresholds define the acceptable performance limits.
  // The test will fail if any of these thresholds are breached.
  thresholds: sharedThresholds[0] || {}, // Access the first (and only) element of the SharedArray. Provide fallback.
};

// Global setup function (runs once before all VUs start)
// Use this for authentication, data setup, or retrieving initial data needed for tests.
export function setup() {
  // 1. Authenticate and get a token
  const loginPayload = { username: AUTH_USERNAME, password: AUTH_PASSWORD };
  const loginRes = http.post(`${BASE_URL}${AUTH_ENDPOINT}`,
    JSON.stringify(loginPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'setup: login successful (status 200)': (r) => r.status === 200,
    'setup: login response has token': (r) => r.json() && r.json().token,
  });

  if (loginRes.status !== 200 || !loginRes.json() || !loginRes.json().token) {
    throw new Error('Failed to authenticate in setup. Check credentials and API endpoint.');
  }
  const authToken = loginRes.json().token;

  // 2. Pre-create data for GET/PUT/DELETE/PATCH operations to ensure valid IDs exist.
  // This is crucial for realistic benchmarking and avoiding 404s on read/update/delete ops.
  const preCreatedItems = [];
  const preCreatedUsers = [];
  const preCreatedProducts = [];
  const preCreatedOrders = [];

  // Create a few items
  for (let i = 0; i < 5; i++) {
    const payload = getDynamicPayload('/api/items', 'POST');
    const res = makeAuthenticatedRequest('POST', `${BASE_URL}/api/items`, payload, { setup_action: 'create_item' }, authToken);
    if (res.status === 201 && res.json() && res.json().id) {
      preCreatedItems.push({ id: res.json().id, name: payload.name });
    } else {
      console.warn(`WARN: Setup failed to create item ${i}. Status: ${res.status}, Body: ${res.body}`);
    }
  }

  // Create a few users
  for (let i = 0; i < 3; i++) {
    const payload = getDynamicPayload('/api/users', 'POST'); // Using POST template for creation
    const res = makeAuthenticatedRequest('POST', `${BASE_URL}/api/users`, payload, { setup_action: 'create_user' }, authToken);
    if (res.status === 201 && res.json() && res.json().id) {
      preCreatedUsers.push({ id: res.json().id, email: payload.email });
    } else {
      console.warn(`WARN: Setup failed to create user ${i}. Status: ${res.status}, Body: ${res.body}`);
    }
  }

  // Create a few products for deletion scenarios
  for (let i = 0; i < 2; i++) {
    const payload = getDynamicPayload('/api/products', 'POST');
    const res = makeAuthenticatedRequest('POST', `${BASE_URL}/api/products`, payload, { setup_action: 'create_product' }, authToken);
    if (res.status === 201 && res.json() && res.json().id) {
      preCreatedProducts.push({ id: res.json().id });
    } else {
      console.warn(`WARN: Setup failed to create product ${i}. Status: ${res.status}, Body: ${res.body}`);
    }
  }

  // Create a few orders for status updates (requires a customer ID, using first pre-created user or a default)
  const customerIdForOrder = preCreatedUsers.length > 0 ? preCreatedUsers[0].id : 1; // Fallback to ID 1
  for (let i = 0; i < 2; i++) {
    // Assuming a simple POST /api/orders for creation
    const payload = { customerId: customerIdForOrder, total: parseFloat((Math.random() * 200).toFixed(2)), status: 'pending' };
    const res = makeAuthenticatedRequest('POST', `${BASE_URL}/api/orders`, payload, { setup_action: 'create_order' }, authToken);
    if (res.status === 201 && res.json() && res.json().id) {
      preCreatedOrders.push({ id: res.json().id });
    } else {
      console.warn(`WARN: Setup failed to create order ${i}. Status: ${res.status}, Body: ${res.body}`);
    }
  }

  // Log warnings if insufficient data was created, which might impact scenarios
  if (preCreatedItems.length === 0) console.warn('WARN: No items created in setup. GET/POST scenarios might be affected.');
  if (preCreatedUsers.length === 0) console.warn('WARN: No users created in setup. PUT scenarios might be affected.');
  if (preCreatedProducts.length === 0) console.warn('WARN: No products created in setup. DELETE scenarios might be affected.');
  if (preCreatedOrders.length === 0) console.warn('WARN: No orders created in setup. PATCH scenarios might be affected.');

  return { authToken, preCreatedItems, preCreatedUsers, preCreatedProducts, preCreatedOrders };
}

// Global teardown function (runs once after all VUs finish)
// Use this for cleaning up test data created during the run.
export function teardown(data) {
  const { authToken, preCreatedItems, preCreatedUsers, preCreatedProducts, preCreatedOrders } = data;

  // Clean up created items
  for (const item of preCreatedItems) {
    const res = makeAuthenticatedRequest('DELETE', `${BASE_URL}/api/items/${item.id}`, null, { teardown_action: 'delete_item' }, authToken);
    if (res.status !== 200 && res.status !== 204) {
      console.warn(`WARN: Teardown failed to delete item ${item.id}. Status: ${res.status}, Body: ${res.body}`);
    }
  }

  // Clean up created users
  for (const user of preCreatedUsers) {
    const res = makeAuthenticatedRequest('DELETE', `${BASE_URL}/api/users/${user.id}`, null, { teardown_action: 'delete_user' }, authToken);
    if (res.status !== 200 && res.status !== 204) {
      console.warn(`WARN: Teardown failed to delete user ${user.id}. Status: ${res.status}, Body: ${res.body}`);
    }
  }

  // Clean up created products
  for (const product of preCreatedProducts) {
    const res = makeAuthenticatedRequest('DELETE', `${BASE_URL}/api/products/${product.id}`, null, { teardown_action: 'delete_product' }, authToken);
    if (res.status !== 200 && res.status !== 204) {
      console.warn(`WARN: Teardown failed to delete product ${product.id}. Status: ${res.status}, Body: ${res.body}`);
    }
  }

  // Clean up created orders (optional, depending on cascade deletion or if orders are temporary)
  for (const order of preCreatedOrders) {
    const res = makeAuthenticatedRequest('DELETE', `${BASE_URL}/api/orders/${order.id}`, null, { teardown_action: 'delete_order' }, authToken);
    if (res.status !== 200 && res.status !== 204) {
      console.warn(`WARN: Teardown failed to delete order ${order.id}. Status: ${res.status}, Body: ${res.body}`);
    }
  }
}


// --- API Endpoint Test Functions ---

/**
 * Tests the GET /api/items endpoint to retrieve a list of items.
 * Each VU uses the authToken from setup.
 */
export function get_items(data) {
  const url = `${BASE_URL}/api/items`;
  const res = makeAuthenticatedRequest('GET', url, null, { api_endpoint: '/api/items', method: 'GET' }, data.authToken);

  check(res, {
    'GET /api/items status is 200': (r) => r.status === 200,
    'GET /api/items body is array': (r) => Array.isArray(r.json()),
    'GET /api/items body not empty (expected)': (r) => Array.isArray(r.json()) && r.json().length > 0,
  });

  // Simulate user think time between requests to mimic realistic behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

/**
 * Tests the GET /api/items/{id} endpoint to retrieve a single item.
 * Uses pre-created item IDs from setup for realistic targets.
 */
export function get_item_by_id(data) {
  if (data.preCreatedItems.length === 0) {
    console.warn('Skipping get_item_by_id: No items were successfully created in setup.');
    sleep(1); // Simulate some work to avoid busy-waiting
    return;
  }
  // Pick a pre-created item ID in a round-robin fashion using VU ID for distribution
  const itemId = data.preCreatedItems[vu.idInTest % data.preCreatedItems.length].id;
  const url = `${BASE_URL}/api/items/${itemId}`;
  const res = makeAuthenticatedRequest('GET', url, null, { api_endpoint: '/api/items/:id', method: 'GET' }, data.authToken);

  check(res, {
    `GET /api/items/${itemId} status is 200`: (r) => r.status === 200,
    `GET /api/items/${itemId} body matches ID`: (r) => r.json() && r.json().id === itemId,
  });

  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
}

/**
 * Tests the POST /api/items endpoint to create a new item.
 * Uses dynamic payloads for unique data per request.
 */
export function create_item(data) {
  const url = `${BASE_URL}/api/items`;
  const payload = getDynamicPayload('/api/items', 'POST');

  const res = makeAuthenticatedRequest('POST', url, payload, { api_endpoint: '/api/items', method: 'POST' }, data.authToken);

  check(res, {
    'POST /api/items status is 201': (r) => r.status === 201,
    'POST /api/items body has id': (r) => r.json() && r.json().id !== undefined,
  });

  // Short pause after a write operation
  sleep(0.5);
}

/**
 * Tests the PUT /api/users/{id} endpoint to update an existing user.
 * Uses pre-created user IDs and dynamic payloads.
 */
export function update_user(data) {
  if (data.preCreatedUsers.length === 0) {
    console.warn('Skipping update_user: No users were successfully created in setup.');
    sleep(1);
    return;
  }
  // Pick a pre-created user ID in a round-robin fashion
  const userId = data.preCreatedUsers[vu.idInTest % data.preCreatedUsers.length].id;
  const url = `${BASE_URL}/api/users/${userId}`;
  const payload = getDynamicPayload('/api/users/:id', 'PUT');

  const res = makeAuthenticatedRequest('PUT', url, payload, { api_endpoint: '/api/users/:id', method: 'PUT' }, data.authToken);

  check(res, {
    `PUT /api/users/${userId} status is 200`: (r) => r.status === 200,
    `PUT /api/users/${userId} body has updated email`: (r) => r.json() && r.json().email === payload.email,
  });

  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
}

/**
 * Tests the PATCH /api/orders/{id}/status endpoint to update an order's status.
 * Uses pre-created order IDs and dynamic payloads.
 */
export function patch_order_status(data) {
  if (data.preCreatedOrders.length === 0) {
    console.warn('Skipping patch_order_status: No orders were successfully created in setup.');
    sleep(1);
    return;
  }
  // Pick a pre-created order ID in a round-robin fashion
  const orderId = data.preCreatedOrders[vu.idInTest % data.preCreatedOrders.length].id;
  const url = `${BASE_URL}/api/orders/${orderId}/status`;
  const payload = getDynamicPayload('/api/orders/:id/status', 'PATCH');

  const res = makeAuthenticatedRequest('PATCH', url, payload, { api_endpoint: '/api/orders/:id/status', method: 'PATCH' }, data.authToken);

  check(res, {
    `PATCH /api/orders/${orderId}/status status is 200`: (r) => r.status === 200,
    `PATCH /api/orders/${orderId}/status body has updated status`: (r) => r.json() && r.json().status === payload.status,
  });

  sleep(0.5);
}

/**
 * Tests the DELETE /api/products/{id} endpoint to delete a product.
 * Uses pre-created product IDs from setup.
 */
export function delete_product(data) {
  if (data.preCreatedProducts.length === 0) {
    console.warn('Skipping delete_product: No products were successfully created in setup.');
    sleep(1);
    return;
  }
  // Pick a pre-created product ID in a round-robin fashion.
  // Note: If multiple VUs delete the same product, some might get 404/410.
  // For distinct deletion, a more advanced data management strategy is needed (e.g., a queue).
  const productId = data.preCreatedProducts[vu.idInTest % data.preCreatedProducts.length].id;
  const url = `${BASE_URL}/api/products/${productId}`;

  const res = makeAuthenticatedRequest('DELETE', url, null, { api_endpoint: '/api/products/:id', method: 'DELETE' }, data.authToken);

  check(res, {
    `DELETE /api/products/${productId} status is 204 or 200`: (r) => r.status === 204 || r.status === 200,
  });

  sleep(0.5);
}

// The default function will be executed by k6 if no scenarios are defined.
// Since we have explicitly defined scenarios in `export const options`,
// this default function will not be directly executed by the defined scenarios.
// It is intentionally left empty.
export default function () {
  sleep(1); // Keep a small sleep to prevent busy-waiting if accidentally executed
}