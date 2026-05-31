import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  Chip,
  Button,
  alpha,
  Divider,
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Shield,
  AccountBalanceWallet,
  Receipt,
  Bolt,
  Lock,
  LockOpen,
  CheckCircle,
  OpenInNew,
  Info,
  History,
  TrendingUp,
  SwapHoriz,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import WalletConnect from '../../blockchain/components/WalletConnect';
import useBlockchain from '../../blockchain/useBlockchain';
import contractData from '../../blockchain/RideEscrow.json';

// --- Helpers ---
const rideStatusLabels = ['None', 'Created', 'Accepted', 'Started', 'Completed', 'Cancelled', 'Disputed'];
const rideStatusColors = ['#636e72', '#FDCB6E', '#74B9FF', '#6C5CE7', '#00B894', '#FD79A8', '#E17055'];

const FlowStep = ({ number, title, description, color, icon }) => (
  <Stack direction="row" spacing={2} alignItems="flex-start">
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: alpha(color, 0.15),
        border: `1px solid ${alpha(color, 0.3)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color,
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      {number}
    </Box>
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
        {description}
      </Typography>
    </Box>
  </Stack>
);

const BlockchainDashboard = () => {
  const {
    walletConnected,
    walletAddress,
    chainId,
    txHash,
    rideOnChain,
    escrowBalance,
    fetchOnChainRide,
    fetchOnChainHistory,
  } = useBlockchain();

  const [lookupId, setLookupId] = useState('');
  const [lookedUpRide, setLookedUpRide] = useState(null);
  const [isLooking, setIsLooking] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (walletConnected) {
      loadHistory();
    }
  }, [walletConnected, walletAddress]);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    const data = await fetchOnChainHistory();
    setHistory(data);
    setIsHistoryLoading(false);
  };

  const handleLookup = async () => {
    if (!lookupId) return;
    setIsLooking(true);
    const ride = await fetchOnChainRide(lookupId);
    setLookedUpRide(ride);
    setIsLooking(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield sx={{ color: 'white', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              On-Chain Payments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time escrow & settlement history
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={`Contract: ${contractData.contractAddress?.slice(0, 8)}...`}
              size="small"
              sx={{
                fontFamily: 'monospace',
                background: alpha('#6C5CE7', 0.1),
                color: '#A29BFE',
                border: `1px solid ${alpha('#6C5CE7', 0.25)}`,
              }}
            />
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Wallet & History */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Wallet Panel */}
            <GlassCard title="Connected Wallet" icon={<AccountBalanceWallet />} gradient="linear-gradient(135deg, #6C5CE7, #A29BFE)">
              <WalletConnect />
            </GlassCard>

            {/* Smart Contract History */}
            <GlassCard 
              title="Recent On-Chain Activity" 
              icon={<History />} 
              action={
                <Button size="small" onClick={loadHistory} disabled={isHistoryLoading || !walletConnected}>
                  Refresh
                </Button>
              }
            >
              {!walletConnected ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Connect your wallet to see your on-chain ride history.
                  </Typography>
                </Box>
              ) : isHistoryLoading ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CircularProgress size={30} sx={{ mb: 1 }} />
                  <Typography variant="caption" display="block">Scanning Blockchain...</Typography>
                </Box>
              ) : history.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No rides found for your address on this network.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Box} sx={{ background: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'text.secondary' }}>Date</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'text.secondary' }}>Role</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'text.secondary' }}>Fare (ETH)</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'text.secondary' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ color: 'text.primary', fontSize: '0.75rem' }}>
                            {new Date(item.timestamp).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.rider.toLowerCase() === walletAddress.toLowerCase() ? 'Rider' : 'Driver'}
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem',
                                background: item.rider.toLowerCase() === walletAddress.toLowerCase() ? alpha('#A29BFE', 0.1) : alpha('#74B9FF', 0.1),
                                color: item.rider.toLowerCase() === walletAddress.toLowerCase() ? '#A29BFE' : '#74B9FF'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.light' }}>
                            {parseFloat(item.fare).toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rideStatusLabels[item.status]}
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem',
                                border: `1px solid ${alpha(rideStatusColors[item.status], 0.3)}`,
                                color: rideStatusColors[item.status],
                                background: alpha(rideStatusColors[item.status], 0.1)
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </GlassCard>
          </Stack>
        </Grid>

        {/* Right Column: Active Escrow & Info */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Active Escrow */}
            <GlassCard title="Active Escrow" icon={<Lock />} gradient="linear-gradient(135deg, #00B894, #00CEC9)">
              {rideOnChain ? (
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Locked Amount</Typography>
                    <Typography variant="h6" fontWeight={800} color="#00B894">
                      {escrowBalance || rideOnChain.fareEth} ETH
                    </Typography>
                  </Stack>
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                    label="Funds locked in smart contract"
                    size="small"
                    sx={{ background: alpha('#00B894', 0.1), color: '#00B894', fontWeight: 600 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Payment will be released automatically when the driver completes the ride.
                  </Typography>
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <LockOpen sx={{ fontSize: 36, color: alpha('#fff', 0.15), mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No funds in escrow
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Book a ride to start on-chain payment
                  </Typography>
                </Box>
              )}
            </GlassCard>

            {/* Ride Lookup */}
            <GlassCard title="Verify Ride On-Chain" icon={<SwapHoriz />}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                Every ride ID is hashed and stored immutably. Verify any ride status here.
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Ride UUID"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                variant="outlined"
                fullWidth
                onClick={handleLookup}
                disabled={isLooking || !walletConnected || !lookupId}
              >
                {isLooking ? <CircularProgress size={16} /> : 'Verify Status'}
              </Button>

              {lookedUpRide && lookedUpRide.status !== 0n && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha('#fff', 0.03) }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Typography variant="caption" color={rideStatusColors[Number(lookedUpRide.status)]} fontWeight={700}>
                      {rideStatusLabels[Number(lookedUpRide.status)]}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Fare</Typography>
                    <Typography variant="caption" color="text.primary">{(Number(lookedUpRide.fare) / 1e18).toFixed(6)} ETH</Typography>
                  </Stack>
                </Box>
              )}
            </GlassCard>

            {/* How It Works */}
            <GlassCard title="The Escrow Flow" icon={<Info />}>
              <Stack spacing={2}>
                <FlowStep
                  number="1"
                  color="#A29BFE"
                  icon={<AccountBalanceWallet sx={{ fontSize: 14 }} />}
                  title="Payment Locked"
                  description="Rider sends ETH to contract. Funds are held securely in a trustless vault."
                />
                <FlowStep
                  number="2"
                  color="#FDCB6E"
                  icon={<Lock sx={{ fontSize: 14 }} />}
                  title="Ride Validated"
                  description="Driver accepts the ride and records their identity on-chain."
                />
                <FlowStep
                  number="3"
                  color="#00B894"
                  icon={<LockOpen sx={{ fontSize: 14 }} />}
                  title="Auto-Settlement"
                  description="On completion, the contract splits the payment: 95% to driver, 5% platform fee."
                />
              </Stack>
            </GlassCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlockchainDashboard;
