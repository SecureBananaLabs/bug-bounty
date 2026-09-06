const db = require('../config/db');

const jobService = {
  async listJobs(query) {
    const { page = 1, limit = 20, ...filters } = query;
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];

    if (filters.title) {
      sql += ' AND title LIKE ?';
      params.push(`%${filters.title}%`);
    }
    if (filters.location) {
      sql += ' AND location = ?';
      params.push(filters.location);
    }
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(sql, params);
    return rows;
  },

  async getJob(id) {
    const [rows] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async createJob(data, userId) {
    const { title, description, location, type, salary_min, salary_max, company } = data;
    const [result] = await db.query(
      'INSERT INTO jobs (title, description, location, type, salary_min, salary_max, company, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [title, description, location, type, salary_min || null, salary_max || null, company || null, userId]
    );
    return this.getJob(result.insertId);
  },

  async updateJob(id, data, userId) {
    const existing = await this.getJob(id);
    if (!existing) return null;
    if (existing.user_id !== userId) {
      throw new Error('Unauthorized to update this job');
    }

    const { title, description, location, type, salary_min, salary_max, company } = data;
    await db.query(
      'UPDATE jobs SET title = ?, description = ?, location = ?, type = ?, salary_min = ?, salary_max = ?, company = ?, updated_at = NOW() WHERE id = ?',
      [title || existing.title, description || existing.description, location || existing.location, type || existing.type, salary_min !== undefined ? salary_min : existing.salary_min, salary_max !== undefined ? salary_max : existing.salary_max, company !== undefined ? company : existing.company, id]
    );
    return this.getJob(id);
  },

  async deleteJob(id, userId) {
    const existing = await this.getJob(id);
    if (!existing) return false;
    if (existing.user_id !== userId) {
      throw new Error('Unauthorized to delete this job');
    }
    await db.query('DELETE FROM jobs WHERE id = ?', [id]);
    return true;
  }
};

module.exports = jobService;
