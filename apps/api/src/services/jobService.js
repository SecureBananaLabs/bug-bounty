const db = require('../config/db');

const createJob = async (jobData, userId) => {
  const { title, description, budgetMin, budgetMax, currency, category, skills, deadline, status } = jobData;
  const result = await db.query(
    `INSERT INTO jobs (title, description, budget_min, budget_max, currency, category, skills, deadline, status, client_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
    [title, description, budgetMin, budgetMax, currency, category, JSON.stringify(skills), deadline, status, userId]
  );
  return result.rows[0];
};

const updateJob = async (id, jobData, userId) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(jobData)) {
    if (key === 'skills') {
      fields.push(`skills = $${paramIndex}`);
      values.push(JSON.stringify(value));
    } else if (key === 'budgetMin') {
      fields.push(`budget_min = $${paramIndex}`);
      values.push(value);
    } else if (key === 'budgetMax') {
      fields.push(`budget_max = $${paramIndex}`);
      values.push(value);
    } else {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
    }
    paramIndex++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);
  values.push(userId);

  const result = await db.query(
    `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${paramIndex} AND client_id = $${paramIndex + 1} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Job not found or unauthorized');
  }

  return result.rows[0];
};

const getJobById = async (id) => {
  const result = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listJobs = async (query) => {
  const { status, category, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (status) {
    sql += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (category) {
    sql += ` AND category = $${paramIndex++}`;
    params.push(category);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(sql, params);
  return result.rows;
};

const deleteJob = async (id, userId) => {
  const result = await db.query(
    'DELETE FROM jobs WHERE id = $1 AND client_id = $2 RETURNING id',
    [id, userId]
  );
  if (result.rows.length === 0) {
    throw new Error('Job not found or unauthorized');
  }
};

module.exports = { createJob, updateJob, getJobById, listJobs, deleteJob };
