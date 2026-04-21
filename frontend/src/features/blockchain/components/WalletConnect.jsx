import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Tooltip,
  alpha,
  Alert,
} from '@mui/material';
import {
  AccountBalanceWallet,
  LinkOff,
  CheckCircle,
  Warning,
  ContentCopy,
  SwapHoriz,
} from '@mui/icons-material';
import useBlockchain from '../useBlockchain';

const WalletConnect = ({ compact = false }) => {
  const {
    walletAddress,
    walletConnected,
    chainId,
    balance,
    isConnecting,
    walletError,
    isCorrectNetwork,
    networkName,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
  } = useBlockchain();

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const copyAddress = () => {
    if (walletAddress) navigator.clipboard.writeText(walletAddress);
  };

  // ─── Compact mode (AppBar) ─────────────────────────────────────────────────

  if (compact) {
    if (!walletConnected) {
      return (
        <Button
          size="small"
          variant="outlined"
          onClick={connectWallet}
          disabled={isConnecting}
          startIcon={isConnecting ? <CircularProgress size={12} /> : <AccountBalanceWallet />}
          sx={{
            borderColor: '#FF6B00',
            color: '#FF6B00',
            fontSize: '0.7rem',
            py: 0.5,
            borderRadius: 2,
            '&:hover': { 
              background: alpha('#FF6B00', 0.08),
              borderColor: '#FF6B00'
            },
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>

      );
    }

    if (!isCorrectNetwork) {
      return (
        <Chip
          icon={<Warning sx={{ fontSize: '14px !important', color: '#FD79A8' }} />}
          label="Wrong Network"
          onClick={switchToCorrectNetwork}
          size="small"
          sx={{
            background: alpha('#FD79A8', 0.12),
            color: '#FD79A8',
            border: `1px solid ${alpha('#FD79A8', 0.3)}`,
            cursor: 'pointer',
            fontWeight: 600,
            '&:hover': { background: alpha('#FD79A8', 0.2) },
          }}
        />
      );
    }

    return (
        <Chip
          icon={<CheckCircle sx={{ fontSize: '16px !important', color: '#10B981' }} />}
          label={shortAddress}
          onClick={copyAddress}
          size="small"
          sx={{
            background: alpha('#10B981', 0.1),
            color: '#10B981',
            border: `1px solid ${alpha('#10B981', 0.2)}`,
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontWeight: 700,
            '&:hover': { background: alpha('#10B981', 0.15) },
          }}
        />

    );
  }

  // ─── Full mode (Blockchain Dashboard / RideRequestPanel) ───────────────────

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 4,
        background: walletConnected && isCorrectNetwork
          ? `linear-gradient(135deg, ${alpha('#10B981', 0.05)}, ${alpha('#3B82F6', 0.05)})`
          : walletConnected
          ? `linear-gradient(135deg, ${alpha('#EF4444', 0.05)}, ${alpha('#F59E0B', 0.05)})`
          : `linear-gradient(135deg, ${alpha('#FF6B00', 0.05)}, ${alpha('#FF8533', 0.05)})`,
        border: '1px solid',
        borderColor: walletConnected && isCorrectNetwork
          ? alpha('#10B981', 0.2)
          : walletConnected
          ? alpha('#EF4444', 0.2)
          : alpha('#FF6B00', 0.2),
      }}
    >

      {walletConnected ? (
        <Stack spacing={1.5}>
          {/* Connection indicator */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isCorrectNetwork ? '#10B981' : '#EF4444',
                  boxShadow: `0 0 8px ${isCorrectNetwork ? '#10B981' : '#EF4444'}`,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }}
              />
              <Typography
                variant="caption"
                color={isCorrectNetwork ? '#10B981' : '#EF4444'}
                fontWeight={800}
                textTransform="uppercase"
                letterSpacing={1}
              >
                {isCorrectNetwork ? 'Wallet Connected' : 'Wrong Network'}
              </Typography>

            </Stack>
            <Tooltip title="Disconnect wallet">
              <Button
                size="small"
                variant="text"
                onClick={disconnectWallet}
                startIcon={<LinkOff sx={{ fontSize: 14 }} />}
                sx={{ color: 'text.secondary', fontSize: '0.7rem', minWidth: 'auto' }}
              >
                Disconnect
              </Button>
            </Tooltip>
          </Stack>

          {/* Wrong network warning */}
          {!isCorrectNetwork && (
            <Alert
              severity="warning"
              action={
                <Button
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={switchToCorrectNetwork}
                  startIcon={<SwapHoriz sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                >
                  Switch to {networkName}
                </Button>
              }
              sx={{
                py: 0.5,
                fontSize: '0.75rem',
                background: alpha('#FDCB6E', 0.08),
                border: `1px solid ${alpha('#FDCB6E', 0.25)}`,
                '.MuiAlert-message': { display: 'flex', alignItems: 'center' },
              }}
            >
              Contract is on <strong style={{ margin: '0 4px' }}>{networkName}</strong>
            </Alert>
          )}

          {/* Wallet address */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccountBalanceWallet sx={{ fontSize: 18, color: '#FF6B00' }} />
            <Typography variant="body2" fontFamily="monospace" color="text.primary" fontWeight={700}>
              {shortAddress}
            </Typography>
            <Tooltip title="Copy address">
              <ContentCopy
                sx={{ fontSize: 14, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                onClick={copyAddress}
              />
            </Tooltip>
          </Stack>


          {/* Balance + Network */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={balance === '—' ? 'Balance unavailable' : `${parseFloat(balance || 0).toFixed(4)} ETH`}
              size="small"
              sx={{
                background: balance === '—' ? alpha('#64748B', 0.1) : alpha('#FF6B00', 0.1),
                color: balance === '—' ? '#64748B' : '#FF6B00',
                fontWeight: 800,
                fontSize: '0.72rem',
              }}
            />
            <Chip
              label={networkName || `Chain ${chainId}`}
              size="small"
              icon={isCorrectNetwork ? undefined : <Warning sx={{ fontSize: '12px !important' }} />}
              sx={{
                background: isCorrectNetwork ? alpha('#F59E0B', 0.1) : alpha('#EF4444', 0.1),
                color: isCorrectNetwork ? '#D97706' : '#EF4444',
                fontWeight: 800,
                fontSize: '0.72rem',
              }}
            />
          </Stack>


          {/* Local node not running hint */}
          {balance === '—' && chainId === 31337 && (
            <Typography variant="caption" sx={{ color: '#FDCB6E', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              ⚠️ Run <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0 4px', borderRadius: 4 }}>npx hardhat node</code> in the blockchain folder
            </Typography>
          )}
        </Stack>
      ) : (
        // ─── Not connected ─────────────────────────────────────────────────
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <AccountBalanceWallet sx={{ fontSize: 48, color: alpha('#FF6B00', 0.2) }} />
          <Box textAlign="center">
            <Typography variant="body1" fontWeight={800} color="text.primary" gutterBottom>
              Connect Ethereum Wallet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Securely lock your ride fare with any EVM-compatible wallet
            </Typography>
          </Box>

          {walletError && (
            <Typography variant="caption" color="error.main" textAlign="center">
              {walletError}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={connectWallet}
            disabled={isConnecting}
            startIcon={isConnecting ? <CircularProgress size={16} color="inherit" /> : <AccountBalanceWallet />}
            sx={{
              background: 'linear-gradient(135deg, #FF6B00, #FF8533)',
              py: 1.5,
              fontWeight: 800,
              fontSize: '0.9rem',
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(255, 107, 0, 0.2)',
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            New to Crypto?{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FF6B00', fontWeight: 700 }}
            >
              Get MetaMask →
            </a>
          </Typography>

        </Stack>
      )}
    </Box>
  );
};

export default WalletConnect;
