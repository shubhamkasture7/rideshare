import React from 'react';
import { Skeleton, Card, CardContent, CardHeader, Stack, Box } from '@mui/material';

export const CardSkeleton = ({ lines = 3 }) => (
  <Card sx={{ mb: 2 }}>
    <CardHeader
      avatar={<Skeleton variant="circular" width={40} height={40} />}
      title={<Skeleton variant="text" width="60%" />}
      subheader={<Skeleton variant="text" width="40%" />}
    />
    <CardContent>
      <Stack spacing={1}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 - i * 15}%`} />
        ))}
      </Stack>
    </CardContent>
  </Card>
);

export const MapSkeleton = () => (
  <Skeleton
    variant="rectangular"
    width="100%"
    height={400}
    sx={{ borderRadius: 3, bgcolor: 'background.card' }}
  />
);

export const ListSkeleton = ({ count = 4 }) => (
  <Stack spacing={1.5}>
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={36} height={36} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" height={14} />
        </Box>
      </Box>
    ))}
  </Stack>
);

export const StatSkeleton = () => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 2,
    }}
  >
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent>
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="30%" height={40} />
        </CardContent>
      </Card>
    ))}
  </Box>
);
