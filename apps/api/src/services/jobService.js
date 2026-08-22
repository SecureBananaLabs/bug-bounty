/**
 * @file jobService.js
 * In-memory job repository with multi-field filtering support (status, categoryId, minBudget).
 */

'use strict';

const jobs = [];

/**
 * Lists stored jobs with optional query filtering for status, categoryId, and minBudget.
 *
 * @param {Object} [filters={}]
 * @param {string} [filters.status] - Filter by job status (case-insensitive).
 * @param {string} [filters.categoryId] - Filter by category identifier.
 * @param {number|string} [filters.minBudget] - Filter jobs with budget >= minBudget.
 * @returns {Promise<Array>}
 */
export async function listJobs(filters = {}) {
  let result = [...jobs];

  if (!filters || typeof filters !== 'object') {
    return result;
  }

  const { status, categoryId, minBudget } = filters;

  if (typeof status === 'string' && status.trim() !== '') {
    const targetStatus = status.trim().toLowerCase();
    result = result.filter((j) => typeof j.status === 'string' && j.status.toLowerCase() === targetStatus);
  }

  if (typeof categoryId === 'string' && categoryId.trim() !== '') {
    const targetCategory = categoryId.trim();
    result = result.filter((j) => j.categoryId === targetCategory);
  }

  if (minBudget !== undefined && minBudget !== null && minBudget !== '') {
    const min = Number(minBudget);
    if (!isNaN(min) && Number.isFinite(min)) {
      result = result.filter((j) => {
        const budget = Number(j.budgetMax ?? j.budgetMin ?? j.budget ?? 0);
        return budget >= min;
      });
    }
  }

  return result;
}

/**
 * Creates and stores a new job.
 *
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createJob(payload) {
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: 'open',
    createdAt: new Date().toISOString(),
    ...payload,
  };
  jobs.push(job);
  return job;
}

/**
 * Clears the in-memory job store (primarily for unit tests).
 */
export function _resetJobsForTesting() {
  jobs.length = 0;
}
