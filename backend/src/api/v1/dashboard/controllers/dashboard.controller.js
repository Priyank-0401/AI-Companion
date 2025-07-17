import { getDashboardService } from '../services/dashboard.service.js';
import { logger } from '../../../../utils/logger.js';

class DashboardController {
  constructor() {
    this.getDashboardData = this.getDashboardData.bind(this);
  }

  async getDashboardData(req, res, next) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const { timeRange = '7' } = req.query;
      const service = await getDashboardService();
      const data = await service.getDashboardData(userId, parseInt(timeRange, 10));

      res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error('Error in getDashboardData controller:', error);
      next(error);
    }
  }
}

// Export a single instance
const dashboardController = new DashboardController();
export default dashboardController;
