import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Tabs, Tab, Container, Badge, CircularProgress } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import NotificationsPage from './pages/NotificationsPage';
import PriorityInboxPage from './pages/PriorityInboxPage';
import logger from './logger';
import './App.css';

function TabPanel(props) {
    const { children, value, index } = props;
    return (
        <div hidden={value !== index} role="tabpanel">
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function App() {
    const [tabValue, setTabValue] = useState(0);
    const [unviewedCount, setUnviewedCount] = useState(0);
    
    useEffect(() => {
        logger.logComponentLifecycle('App', 'mounted');
        
        try {
            const viewed = localStorage.getItem('viewedNotifications');
            const allNotifs = localStorage.getItem('allNotifications');
            
            if (allNotifs) {
                const count = JSON.parse(allNotifs).length - (viewed ? JSON.parse(viewed).length : 0);
                setUnviewedCount(Math.max(0, count));
            }
        } catch (e) {
            logger.warn('Failed to load notification count', { error: e.message });
        }
    }, []);
    
    const handleTabChange = (event, newValue) => {
        logger.logUserAction('Switch tab', { fromTab: tabValue, toTab: newValue });
        setTabValue(newValue);
    };
    
    const updateUnviewedCount = (count) => {
        setUnviewedCount(count);
    };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Toolbar>
                    <NotificationsIcon sx={{ mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Campus Notifications
                    </Typography>
                    <Badge badgeContent={unviewedCount} color="warning" overlap="circular">
                        <Box sx={{ width: 24 }} />
                    </Badge>
                </Toolbar>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                    aria-label="notification tabs"
                >
                    <Tab 
                        icon={<NotificationsIcon />} 
                        iconPosition="start"
                        label="All Notifications" 
                        sx={{ color: 'white', '&.Mui-selected': { color: '#fff' } }}
                    />
                    <Tab 
                        icon={<PriorityHighIcon />}
                        iconPosition="start"
                        label="Priority Inbox" 
                        sx={{ color: 'white', '&.Mui-selected': { color: '#fff' } }}
                    />
                </Tabs>
            </AppBar>
            
            <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
                <TabPanel value={tabValue} index={0}>
                    <NotificationsPage onUnviewedUpdate={updateUnviewedCount} />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <PriorityInboxPage onUnviewedUpdate={updateUnviewedCount} />
                </TabPanel>
            </Container>
            
            <Box as="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'white', borderTop: '1px solid #eee', mt: 'auto' }}>
                <Typography variant="caption" color="textSecondary">
                    Campus Notification Platform v1.0 | Production Ready
                </Typography>
            </Box>
        </Box>
    );
}