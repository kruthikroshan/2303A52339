import { useState, useEffect, useCallback } from 'react';
import notificationAPI from './api';
import logger from './logger';

// Demo notifications for development/demo when API is not accessible
const DEMO_NOTIFICATIONS = [
    { ID: 'd146095a-0d86-4a34-9e69-3900a14576bc', Type: 'Result', Message: 'mid-sem', Timestamp: '2026-04-22 17:51:30' },
    { ID: 'b283218f-ea5a-4b7c-93a9-1f2f240d64b0', Type: 'Placement', Message: 'CSX Corporation hiring', Timestamp: '2026-04-22 17:51:18' },
    { ID: '81589ada-0ad3-4f77-9554-f52fb558e09d', Type: 'Event', Message: 'farewell', Timestamp: '2026-04-22 17:51:06' },
    { ID: '0005513a-142b-4bbc-8678-eefec65e1ede', Type: 'Result', Message: 'mid-sem', Timestamp: '2026-04-22 17:50:54' },
    { ID: 'ea836726-c25e-4f21-a72f-544a6af8a37f', Type: 'Result', Message: 'project-review', Timestamp: '2026-04-22 17:50:42' },
    { ID: '003cb427-8fc6-47f7-bb00-be228f6b0d2c', Type: 'Result', Message: 'external', Timestamp: '2026-04-22 17:50:30' },
    { ID: 'e5c4ff20-31bf-4d40-8f02-72fda59e8918', Type: 'Result', Message: 'project-review', Timestamp: '2026-04-22 17:50:18' },
    { ID: '1cfce5ee-ad37-4894-8946-d707627176a5', Type: 'Event', Message: 'tech-fest', Timestamp: '2026-04-22 17:50:06' },
    { ID: 'cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8', Type: 'Result', Message: 'project-review', Timestamp: '2026-04-22 17:49:54' },
    { ID: '8a7412bd-6065-4d09-8501-a37f11cc848b', Type: 'Placement', Message: 'Advanced Micro Devices Inc. hiring', Timestamp: '2026-04-22 17:49:42' },
    { ID: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', Type: 'Event', Message: 'workshop-coding', Timestamp: '2026-04-22 17:49:30' },
    { ID: 'f5e6d7c8-b9a0-4e1f-2d3c-4b5a6f7e8d9c', Type: 'Placement', Message: 'Google hiring drive', Timestamp: '2026-04-22 17:49:18' },
];

export function useNotifications(useDemoData = true) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewedNotifications, setViewedNotifications] = useState(new Set());
    
    // Load viewed notifications from localStorage on mount
    useEffect(() => {
        logger.logComponentLifecycle('useNotifications', 'mounted');
        
        try {
            const stored = localStorage.getItem('viewedNotifications');
            if (stored) {
                setViewedNotifications(new Set(JSON.parse(stored)));
            }
        } catch (e) {
            logger.warn('Failed to load viewed notifications', { error: e.message });
        }
        
        // Fetch notifications on mount
        fetchNotifications();
    }, []);
    
    const fetchNotifications = useCallback(async (newParams = {}) => {
        logger.logComponentLifecycle('useNotifications', 'fetchNotifications');
        setLoading(true);
        setError(null);
        
        let result;
        
        if (useDemoData) {
            logger.info('Using demo data for notifications', { context: 'DEMO_MODE', count: DEMO_NOTIFICATIONS.length });
            result = {
                success: true,
                notifications: DEMO_NOTIFICATIONS,
                total: DEMO_NOTIFICATIONS.length
            };
        } else {
            result = await notificationAPI.getNotifications(newParams);
        }
        
        if (result.success) {
            const enrichedNotifications = result.notifications.map(notif => ({
                ...notif,
                isViewed: viewedNotifications.has(notif.ID),
                parsedTimestamp: new Date(notif.Timestamp)
            }));
            
            setNotifications(enrichedNotifications);
            logger.info('Notifications fetched successfully', {
                context: 'FETCH_SUCCESS',
                count: enrichedNotifications.length
            });
        } else {
            setError(result.error || 'Failed to fetch notifications');
            logger.error('Failed to fetch notifications', { error: result.error });
        }
        
        setLoading(false);
    }, [useDemoData, viewedNotifications]);
    
    const markAsViewed = useCallback((notificationId) => {
        logger.logUserAction('Mark notification as viewed', { notificationId });
        
        setViewedNotifications(prev => {
            const newSet = new Set(prev);
            newSet.add(notificationId);
            
            try {
                localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(newSet)));
            } catch (e) {
                logger.warn('Failed to save viewed notifications', { error: e.message });
            }
            
            return newSet;
        });
        
        setNotifications(prev => 
            prev.map(notif => 
                notif.ID === notificationId 
                    ? { ...notif, isViewed: true }
                    : notif
            )
        );
    }, []);
    
    const markMultipleAsViewed = useCallback((ids) => {
        logger.logUserAction('Mark multiple notifications as viewed', { count: ids.length });
        
        setViewedNotifications(prev => {
            const newSet = new Set(prev);
            ids.forEach(id => newSet.add(id));
            
            try {
                localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(newSet)));
            } catch (e) {
                logger.warn('Failed to save viewed notifications', { error: e.message });
            }
            
            return newSet;
        });
        
        setNotifications(prev =>
            prev.map(notif =>
                ids.includes(notif.ID) 
                    ? { ...notif, isViewed: true }
                    : notif
            )
        );
    }, []);
    
    return {
        notifications,
        loading,
        error,
        viewedNotifications,
        fetchNotifications,
        markAsViewed,
        markMultipleAsViewed,
        unviewedCount: notifications.filter(n => !n.isViewed).length
    };
}

