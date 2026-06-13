// Assuming searchController.js has a function to handle search queries
import { sanitize } from '../utils/sanitize'; // Assuming a sanitize utility

const search = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid search query' });
    }
    const sanitizedQuery = sanitize(query);
    // Proceed with search using the sanitized query
    // ...
  } catch (error) {
    // Handle error
  }
};

// Exporting the controller function
export { search };