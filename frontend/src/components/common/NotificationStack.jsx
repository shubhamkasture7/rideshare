import React from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import useNotificationStore from '../../store/notificationStore';

const NotificationStack = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'relative', bottom: 'auto', right: 'auto' }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: 2,
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};

export default NotificationStack;
