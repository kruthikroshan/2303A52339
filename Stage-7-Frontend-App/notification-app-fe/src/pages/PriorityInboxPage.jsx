import { useState, useEffect, useMemo } from 'react';
import {
    Box, Card, CardContent, Typography, CircularProgress, Alert, Paper,
    FormControl, InputLabel, Select, MenuItem, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNotifications } from '../useNotifications';
import logger from '../logger';

const NOTIFICATION_TYPES = ['Event', 'Result', 'Placement'];
const WEIGHTS = {
    'Placement': 3,
    'Result': 2,
    'Event': 1
};

export default function PriorityInboxPage({ onUnviewedUpdate }) {
    const { notifications, loading, error, markAsViewed, unviewedCount } = useNotifications();
    const [limit, setLimit] = useState(10);
    const [filteredType, setFilteredType] = useState('');
    const [lastRefresh, setLastRefresh] = useState(new Date());
    
    useEffect(() => {
        logger.logComponentLifecycle('PriorityInboxPage', 'mounted');
    }, []);
    
    useEffect(() => {
        onUnviewedUpdate(unviewedCount);
    }, [unviewedCount, onUnviewedUpdate]);
    
    const calculatePriorityScore = (notification) => {
        const typeWeight = WEIGHTS[notification.Type] || 0;
        const timestamp = new Date(notification.Timestamp);
        const now = new Date();
        const ageMs = now.getTime() - timestamp.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        
        const maxAgeHours = 7 * 24;
        const recencyScore = Math.max(0, 100 * (1 - ageHours / maxAgeHours));
        
        return (typeWeight * 100) + recencyScore;
    };
    
    const priorityNotifications = useMemo(() => {
        logger.logComponentLifecycle('PriorityInboxPage', 'recalculating priority scores');
        
        const toScore = filteredType 
            ? notifications.filter(n => n.Type === filteredType)
            : notifications;
        
        return toScore
            .map(notif => ({
                ...notif,
                priorityScore: calculatePriorityScore(notif)
            }))
            .sort((a, b) => {
                if (b.priorityScore !== a.priorityScore) {
                    return b.priorityScore - a.priorityScore;
                }
                return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
            })
            .slice(0, limit);
    }, [notifications, limit, filteredType]);
    
    const handleRefresh = () => {
        logger.logUserAction('Refresh priority inbox', { count: priorityNotifications.length });
        setLastRefresh(new Date());
    };
    
    const handleTypeEmoji = (type) => {
        const emojis = { 'Placement': '💼', 'Result': '📊', 'Event': '🎉' };
        return emojis[type] || '📬';
    };
    
    const handleTypeColor = (type) => {
        const colors = { 'Placement': '#1976d2', 'Result': '#388e3c', 'Event': '#f57c00' };
        return colors[type] || '#999';
    };
    
    const distribution = useMemo(() => {
        const dist = {};
        priorityNotifications.forEach(n => {
            dist[n.Type] = (dist[n.Type] || 0) + 1;
        });
        return dist;
    }, [priorityNotifications]);
    
    if (loading && notifications.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (error && notifications.length === 0) {
        return <Alert severity="error">{error}</Alert>;
    }
    
    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <PriorityHighIcon sx={{ fontSize: 24, color: '#d32f2f' }} />
                    <Typography variant="h6" sx={{ mb: 0 }}>
                        Priority Inbox
                    </Typography>
                </Box>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    variant="outlined"
                    size="small"
                >
                    Refresh
                </Button>
            </Box>
            
            <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#f0f8ff', borderLeft: '4px solid #1976d2' }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box>
                        <FormControl sx={{ minWidth: 120 }} size="small">
                            <InputLabel>Limit</InputLabel>
                            <Select
                                value={limit}
                                label="Limit"
                                onChange={(e) => {
                                    const newLimit = e.target.value;
                                    logger.logUserAction('Change priority limit', { limit: newLimit });
                                    setLimit(newLimit);
                                }}
                            >
                                {[5, 10, 15, 20, 25, 50].map(val => (
                                    <MenuItem key={val} value={val}>{val}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Box>
                        <FormControl sx={{ minWidth: 140 }} size="small">
                            <InputLabel>Filter Type</InputLabel>
                            <Select
                                value={filteredType}
                                label="Filter Type"
                                onChange={(e) => {
                                    const type = e.target.value;
                                    logger.logUserAction('Filter by type', { type });
                                    setFilteredType(type);
                                }}
                            >
                                <MenuItem value="">All Types</MenuItem>
                                {NOTIFICATION_TYPES.map(type => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 'auto' }}>
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </Typography>
                </Box>
            </Paper>
            
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    Showing {priorityNotifications.length} highest-priority notifications
                    {Object.keys(distribution).length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {Object.entries(distribution).map(([type, count]) => (
                                <Chip
                                    key={type}
                                    label={`${type}: ${count}`}
                                    size="small"
                                    icon={<span>{handleTypeEmoji(type)}</span>}
                                    sx={{ bgcolor: handleTypeColor(type), color: 'white' }}
                                />
                            ))}
                        </Box>
                    )}
                </Typography>
            </Box>
            
            {priorityNotifications.length === 0 ? (
                <Alert severity="info">No notifications found</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 600, width: 50 }}>Rank</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 80 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, width: 100 }}>Priority</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, width: 120 }}>Date</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {priorityNotifications.map((notif, index) => (
                                <TableRow 
                                    key={notif.ID}
                                    sx={{
                                        opacity: notif.isViewed ? 0.7 : 1,
                                        '&:hover': { bgcolor: '#f9f9f9' },
                                        borderLeft: `3px solid ${handleTypeColor(notif.Type)}`
                                    }}
                                >
                                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                        #{index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <span>{handleTypeEmoji(notif.Type)}</span>
                                            <Typography variant="body2">{notif.Type}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ fontWeight: notif.isViewed ? 400 : 600, mb: 0.5 }}
                                            >
                                                {notif.Message}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {notif.ID.substring(0, 12)}...
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={notif.priorityScore.toFixed(0)}
                                            size="small"
                                            sx={{
                                                bgcolor: notif.priorityScore >= 300 ? '#c8e6c9' : 
                                                         notif.priorityScore >= 200 ? '#ffe0b2' : '#ffcccc',
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="caption">
                                            {new Date(notif.Timestamp).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {!notif.isViewed && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="warning"
                                                onClick={() => {
                                                    logger.logUserAction('Mark as viewed from priority inbox', { notificationId: notif.ID });
                                                    markAsViewed(notif.ID);
                                                }}
                                            >
                                                Mark
                                            </Button>
                                        )}
                                        {notif.isViewed && (
                                            <Typography variant="caption" sx={{ color: '#999' }}>
                                                Viewed
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
