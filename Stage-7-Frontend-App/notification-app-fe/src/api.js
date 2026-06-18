import logger from './logger';

const API_BASE_URL = 'http://4.224.186.213/evaluation-service';

export const notificationAPI = {
    async getNotifications(params = {}) {
        logger.logComponentLifecycle('notificationAPI', 'getNotifications called', { params });
        
        const startTime = performance.now();
        const queryParams = new URLSearchParams();
        
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.page) queryParams.append('page', params.page);
        if (params.notification_type) queryParams.append('notification_type', params.notification_type);
        
        const url = `${API_BASE_URL}/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            const duration = performance.now() - startTime;
            const data = await response.json();
            
            logger.logAPICall('GET', url, response.status, duration, {
                notificationCount: data.notifications?.length || 0
            });
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            
            return {
                success: true,
                notifications: data.notifications || [],
                total: data.total || data.notifications?.length || 0
            };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            logger.logAPIError('GET', url, error, { params });
            
            return {
                success: false,
                notifications: [],
                error: error.message,
                total: 0
            };
        }
    }
};

export default notificationAPI;
