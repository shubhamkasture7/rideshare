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
            borderColor: '#6C5CE7',
            color: '#6C5CE7',
            fontSize: '0.7rem',
            py: 0.5,
            '&:hover': { background: alpha('#6C5CE7', 0.1) },
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
        icon={<CheckCircle sx={{ fontSize: '16px !important', color: '#00B894' }} />}
        label={shortAddress}
        onClick={copyAddress}
        size="small"
        sx={{
          background: alpha('#00B894', 0.12),
          color: '#00B894',
          border: `1px solid ${alpha('#00B894', 0.3)}`,
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontWeight: 600,
          '&:hover': { background: alpha('#00B894', 0.2) },
        }}
      />
    );
  }

  // ─── Full mode (Blockchain Dashboard / RideRequestPanel) ───────────────────

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: walletConnected && isCorrectNetwork
          ? `linear-gradient(135deg, ${alpha('#00B894', 0.08)}, ${alpha('#00CEC9', 0.08)})`
          : walletConnected
          ? `linear-gradient(135deg, ${alpha('#FD79A8', 0.08)}, ${alpha('#FDCB6E', 0.08)})`
          : `linear-gradient(135deg, ${alpha('#6C5CE7', 0.08)}, ${alpha('#A29BFE', 0.08)})`,
        border: '1px solid',
        borderColor: walletConnected && isCorrectNetwork
          ? alpha('#00B894', 0.25)
          : walletConnected
          ? alpha('#FD79A8', 0.25)
          : alpha('#6C5CE7', 0.25),
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
                  bgcolor: isCorrectNetwork ? '#00B894' : '#FD79A8',
                  boxShadow: `0 0 6px ${isCorrectNetwork ? '#00B894' : '#FD79A8'}`,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }}
              />
              <Typography
                variant="caption"
                color={isCorrectNetwork ? '#00B894' : '#FD79A8'}
                fontWeight={700}
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
            <AccountBalanceWallet sx={{ fontSize: 18, color: '#6C5CE7' }} />
            <Typography variant="body2" fontFamily="monospace" color="text.primary" fontWeight={600}>
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
                background: balance === '—' ? alpha('#636e72', 0.12) : alpha('#6C5CE7', 0.12),
                color: balance === '—' ? '#636e72' : '#A29BFE',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            />
            <Chip
              label={networkName || `Chain ${chainId}`}
              size="small"
              icon={isCorrectNetwork ? undefined : <Warning sx={{ fontSize: '12px !important' }} />}
              sx={{
                background: isCorrectNetwork ? alpha('#FDCB6E', 0.12) : alpha('#FD79A8', 0.12),
                color: isCorrectNetwork ? '#FDCB6E' : '#FD79A8',
                fontWeight: 700,
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
        <Stack spacing={2} alignItems="center">
          <AccountBalanceWallet sx={{ fontSize: 40, color: alpha('#6C5CE7', 0.5) }} />
          <Box textAlign="center">
            <Typography variant="body2" fontWeight={700} color="text.primary" gutterBottom>
              Connect Your Ethereum Wallet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Works with MetaMask, Coinbase Wallet, or any EVM-compatible wallet
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
              background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
              py: 1.2,
              fontWeight: 700,
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            Don't have MetaMask?{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#A29BFE' }}
            >
              Install it free →
            </a>
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export default WalletConnect;
