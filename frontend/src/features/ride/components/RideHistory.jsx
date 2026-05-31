import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocalTaxi,
  Route,
  Payment,
  Visibility,
  FileDownload,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import useRideStore from '../store/rideStore';

const stats = [
  { label: 'Total Trips', value: '142', icon: <LocalTaxi />, color: '#cc97ff' },
  { label: 'Total Distance', value: '1,240 km', icon: <Route />, color: '#00CEC9' },
  { label: 'Total Savings', value: '₹3,120', icon: <Payment />, color: '#55EFC4' },
];

const RideHistory = () => {
  const { rideHistory, fetchRideHistory, isLoading } = useRideStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchRideHistory();
  }, [fetchRideHistory]);

  const filteredHistory = rideHistory.filter((ride) => {
    const matchesSearch = ride.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.dropAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ride.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4, fontFamily: 'Space Grotesk' }}>
        Ride History
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} md={4} key={stat.label}>
            <GlassCard sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: alpha(stat.color, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* Filters & Table */}
      <GlassCard title="Trip Logs" subtitle="Historical telemetry data">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            sx={{ minWidth: 150 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
          <Button startIcon={<FileDownload />} variant="outlined">
            Export
          </Button>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#fff', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Distance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fare</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistory.map((ride) => (
                <TableRow key={ride.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(ride.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap sx={{ opacity: 0.8 }}>
                        {ride.pickupAddress}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        to {ride.dropAddress}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{ride.distance} km</TableCell>
                  <TableCell>₹{ride.actualFare || ride.estimatedFare}</TableCell>
                  <TableCell>
                    <Chip
                      label={ride.status}
                      size="small"
                      color={ride.status === 'COMPLETED' ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<Visibility />}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No matching records found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
    </Box>
  );
};

export default RideHistory;
