import * as dashboardQueries from '../queries/dashboardQueries.js';

export async function getStats(req, res, next) {
  try {
    const stats = await dashboardQueries.getDashboardStats();
    res.status(200).json({ data: stats });
  } catch (err) {
    next(err);
  }
}
