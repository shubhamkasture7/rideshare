import React from 'react';
import { Card as MuiCard, CardContent, CardHeader, Box, alpha } from '@mui/material';

const GlassCard = ({ title, subtitle, icon, children, action, sx, gradient, ...props }) => {
  return (
    <MuiCard
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...(gradient && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: gradient,
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {(title || icon) && (
        <CardHeader
          avatar={icon && <Box sx={{ color: 'primary.main' }}>{icon}</Box>}
          title={title}
          subheader={subtitle}
          action={action}
          slotProps={{
            title: { variant: 'h6', fontWeight: 600 },
            subheader: { variant: 'body2' },
          }}
        />
      )}
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
};

export default GlassCard;
