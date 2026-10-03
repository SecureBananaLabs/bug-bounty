const http = require('http');
const process = require('process');

// A simple in-memory store for requests in progress
const inFlightRequests = new Set();

// Create a simple HTTP server for demonstration
const server = http.createServer((req, res) => {
  // Add request to in-flight set
  const reqId = Date.now();
  inFlightRequests.add(reqId);
  
  console.log(`Request ${reqId} started. In-flight: ${inFlightRequests.size}`);
  
  // Simulate some async work
  setTimeout(() => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello, World!' }));
    
    // Remove request from in-flight set
    inFlightRequests.delete(reqId);
    console.log(`Request ${reqId} completed. In-flight: ${inFlightRequests.size}`);
  }, 1000);
});

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('Server closed. No new connections accepted.');
    
    // Wait for in-flight requests to complete
    if (inFlightRequests.size > 0) {
      console.log(`Waiting for ${inFlightRequests.size} in-flight requests to complete...`);
      
      // Set a timeout to force exit if requests take too long
      const timeout = setTimeout(() => {
        console.error('Force exiting after timeout.');
        process.exit(1);
      }, 10000); // 10 second timeout
      
      // Wait for all requests to complete
      const checkInterval = setInterval(() => {
        if (inFlightRequests.size === 0) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          console.log('All in-flight requests completed. Exiting.');
          process.exit(0);
        }
      }, 100);
    } else {
      console.log('No in-flight requests. Exiting immediately.');
      process.exit(0);
    }
  });
  
  // If the server doesn't close within 5 seconds, force exit
  setTimeout(() => {
    console.error('Server did not close in time. Force exiting.');
    process.exit(1);
  }, 5000);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});