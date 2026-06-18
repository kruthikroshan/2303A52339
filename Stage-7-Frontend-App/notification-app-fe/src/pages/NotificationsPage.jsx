import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, CircularProgress, Alert, Pagination,
    Paper, Grid, Chip, Button, FormControl, InputLabel, Select, MenuItem, 
    TextField, ButtonGroup
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNotifications } from '../useNotifications';
import logger from '../logger';

const NOTIFICATION_TYPES = ['Event', 'Result', 'Placement'];
const ITEMS_PER_PAGE = 5;

export default function NotificationsPage({ onUnviewedUpdate }) {
    const { notifications, loading, error, markAsViewed, markMultipleAsViewed, unviewedCount } = useNotifications();
    const [page, setPage] = useState(1);
    const [filteredType, setFilteredType] = useState('');
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    
    useEffect(() => {
        logger.logComponentLifecycle('NotificationsPage', 'mounted');
    }, []);
    
    useEffect(() => {
        onUnviewedUpdate(unviewedCount);
    }, [unviewedCount, onUnviewedUpdate]);
    
    const filtered = notifications.filter(notif => {
        const matchType = !filteredType || notif.Type === filteredType;
        const matchSearch = !searchText || 
            notif.Message.toLowerCase().includes(searchText.toLowerCase()) ||
            notif.Type.toLowerCase().includes(searchText.toLowerCase());
        return matchType && matchSearch;
    });
    
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedNotifs = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );
    
    useEffect(() => {
        try {
            localStorage.setItem('allNotifications', JSON.stringify(notifications));
        } catch (e) {
            logger.warn('Failed to cache notifications', { error: e.message });
        }
    }, [notifications]);
    
    const handleMarkAsViewed = (id) => {
        logger.logUserAction('Mark single notification as viewed', { notificationId: id });
        markAsViewed(id);
    };
    
    const handleMarkAllAsViewed = () => {
        logger.logUserAction('Mark all notifications as viewed', { count: paginatedNotifs.length });
        markMultipleAsViewed(paginatedNotifs.map(n => n.ID));
    };
    
    const handleTypeEmoji = (type) => {
        const emojis = { 'Placement': '💼', 'Result': '📊', 'Event': '🎉' };
        return emojis[type] || '📬';
    };
    
    const handleTypeColor = (type) => {
        const colors = { 'Placement': '#1976d2', 'Result': '#388e3c', 'Event': '#f57c00' };
        return colors[type] || '#999';
    };
    
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
                <ButtonGroup variant="outlined">
                    <Button
                        startIcon={<FilterListIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                        variant={showFilters ? 'contained' : 'outlined'}
                    >
                        Filters
                    </Button>
                    {unviewedCount > 0 && (
                        <Button
                            startIcon={<VisibilityIcon />}
                            onClick={handleMarkAllAsViewed}
                            variant="outlined"
                            color="info"
                        >
                            Mark All Viewed ({unviewedCount})
                        </Button>
                    )}
                </ButtonGroup>
                
                {showFilters && (
                    <Paper sx={{ p: 2, flex: 1, minWidth: 300 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search notifications..."
                                    value={searchText}
                                    onChange={(e) => {
                                        setSearchText(e.target.value);
                                        setPage(1);
                                    }}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={filteredType}
                                        label="Type"
                                        onChange={(e) => {
                                            setFilteredType(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <MenuItem value="">All Types</MenuItem>
                                        {NOTIFICATION_TYPES.map(type => (
                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    Showing {paginatedNotifs.length} of {filtered.length} notifications
                    {unviewedCount > 0 && ` • ${unviewedCount} unviewed`}
                </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                {paginatedNotifs.length === 0 ? (
                    <Alert severity="info">No notifications found</Alert>
                ) : (
                    paginatedNotifs.map(notif => (
                        <Card 
                            key={notif.ID}
                            sx={{
                                opacity: notif.isViewed ? 0.7 : 1,
                                borderLeft: `4px solid ${handleTypeColor(notif.Type)}`,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: 3,
                                    bgcolor: notif.isViewed ? '#f9f9f9' : '#f0f8ff'
                                }
                            }}
                            onClick={() => {
                                if (!notif.isViewed) {
                                    handleMarkAsViewed(notif.ID);
                                }
                                setExpandedId(expandedId === notif.ID ? null : notif.ID);
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Typography sx={{ fontSize: '1.8rem', mt: 0.5 }}>
                                        {handleTypeEmoji(notif.Type)}
                                    </Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                            <Typography variant="h6" sx={{ mb: 0, flex: 1, minWidth: 200 }}>
                                                {notif.Message}
                                            </Typography>
                                            {!notif.isViewed && (
                                                <Chip label="New" size="small" color="warning" variant="outlined" />
                                            )}
                                            <Chip 
                                                label={notif.Type} 
                                                size="small"
                                                sx={{ bgcolor: handleTypeColor(notif.Type), color: 'white' }}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="textSecondary">
                                            {new Date(notif.Timestamp).toLocaleString()} | ID: {notif.ID.substring(0, 8)}...
                                        </Typography>
                                        
                                        {expandedId === notif.ID && (
                                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                                                <Typography variant="body2">
                                                    <strong>Full ID:</strong> {notif.ID}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Timestamp:</strong> {notif.Timestamp}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Status:</strong> {notif.isViewed ? 'Viewed' : 'Unviewed'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <Button
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsViewed(notif.ID);
                                        }}
                                        startIcon={notif.isViewed ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        variant="text"
                                    >
                                        {notif.isViewed ? 'Viewed' : 'New'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
            
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                        count={totalPages} 
                        page={page} 
                        onChange={(e, newPage) => {
                            setPage(newPage);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    );
}
