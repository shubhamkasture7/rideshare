import { BrowserProvider, Contract, parseEther, formatEther, keccak256, toUtf8Bytes } from 'ethers';
import { useCallback, useEffect } from 'react';
import useBlockchainStore from './blockchainStore';
import useNotificationStore from '../../store/notificationStore';
import contractData from './RideEscrow.json';

// ─── Network Definitions ────────────────────────────────────────────────────
// The contract is deployed on this chain; read from .env or fallback to JSON
const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || contractData.chainId || 31337;

const NETWORKS = {
  31337: {
    chainId: '0x7A69',
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org', 'https://sepolia.gateway.tenderly.co'],
    nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  1: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://etherscan.io'],
  },
};

/**
 * useBlockchain — Main hook for all on-chain interactions.
 */
const useBlockchain = () => {
  const {
    walletAddress,
    walletConnected,
    chainId,
    balance,
    isConnecting,
    walletError,
    contractAddress,
    rideOnChain,
    txHash,
    txPending,
    escrowBalance,
    setWallet,
    setConnecting,
    setWalletError,
    setContractAddress,
    setTxPending,
    setTxConfirmed,
    setRideOnChain,
    setEscrowBalance,
    reset,
  } = useBlockchainStore();

  const { showNotification } = useNotificationStore();

  // ─── Provider helpers ──────────────────────────────────────────────────────

  const getProvider = () => {
    if (!window.ethereum) throw new Error('No Ethereum wallet found. Please install MetaMask.');
    return new BrowserProvider(window.ethereum);
  };

  const getContract = async (withSigner = false) => {
    const provider = getProvider();
    const signerOrProvider = withSigner ? await provider.getSigner() : provider;
    return new Contract(contractData.contractAddress, contractData.abi, signerOrProvider);
  };

  // ─── Network Switching ─────────────────────────────────────────────────────

  const switchToCorrectNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    const networkConfig = NETWORKS[EXPECTED_CHAIN_ID];
    if (!networkConfig) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } catch (addError) {
          showNotification('Failed to add network to MetaMask', 'error');
        }
      }
    }
  }, []);

  // ─── Wallet Connection ─────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setWalletError('No Ethereum wallet found. Please install MetaMask (metamask.io).');
      showNotification('Please install MetaMask to use blockchain features', 'error');
      return;
    }

    setConnecting(true);
    try {
      const provider = getProvider();
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      let balanceEth = null;
      try {
        const bal = await provider.getBalance(accounts[0]);
        balanceEth = formatEther(bal);
      } catch {
        balanceEth = '—';
      }

      setWallet(accounts[0], Number(network.chainId), balanceEth);
      setContractAddress(contractData.contractAddress);

      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
        const networkName = NETWORKS[EXPECTED_CHAIN_ID]?.chainName || `Chain ${EXPECTED_CHAIN_ID}`;
        showNotification(`Wrong network! Switching to ${networkName}...`, 'warning');
        await switchToCorrectNetwork();
      } else {
        const shortAddr = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
        showNotification(`✅ Wallet connected: ${shortAddr}`, 'success');
      }
    } catch (err) {
      const msg = err.code === 4001 ? 'Connection rejected.' : err.message;
      setWalletError(msg);
      showNotification(msg, 'error');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(null, null, null);
    reset();
    showNotification('Wallet disconnected', 'info');
  }, []);

  // ─── On-Chain Actions ──────────────────────────────────────────────────────

  const createRideOnChain = useCallback(async (rideId, pickup, drop, fareEth) => {
    try {
      // ⚡ BYPASS FOR FREE RIDES
      if (parseFloat(fareEth) === 0) {
        console.log('⚡ [Blockchain] Free Ride detected: Bypassing MetaMask transaction');
        const rideIdBytes32 = keccak256(toUtf8Bytes(rideId));
        setRideOnChain({ 
          rideId, 
          rideIdBytes32, 
          status: 'CREATED', 
          fareEth: '0', 
          txHash: '0x_MOCKED_FREE_TRANSACTION' 
        });
        return { success: true, txHash: '0x_MOCKED_FREE_TRANSACTION' };
      }

      console.log('🔗 [Blockchain] Creating Ride Escrow:', { rideId, pickup, drop, fareEth });
      
      const contract = await getContract(true);
      const rideIdBytes32 = keccak256(toUtf8Bytes(rideId));
      
      // Ensure we are passing strings to the contract
      const phash = keccak256(toUtf8Bytes(pickup));
      const dhash = keccak256(toUtf8Bytes(drop));
      const valueWei = parseEther(String(fareEth));

      console.log('📊 [Blockchain] Tx Params:', { 
        rideIdBytes32, 
        phash, 
        dhash, 
        valueWei: valueWei.toString() 
      });

      showNotification('Confirm 0.01 ETH lock in your wallet...', 'info');

      const provider = getProvider();
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || parseEther('0.000000001'); // Fallback to 1 Gwei
      
      const tx = await contract.createRide(rideIdBytes32, phash, dhash, {
        value: valueWei,
        gasPrice: gasPrice / 2n > 1000000000n ? gasPrice / 2n : 1000000000n, // Force a lower gas price (min 1 Gwei)
      });

      setTxPending(tx.hash);
      showNotification(`Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`, 'info');

      await tx.wait();
      setTxConfirmed();
      
      setEscrowBalance(String(fareEth));
      setRideOnChain({ rideId, rideIdBytes32, status: 'CREATED', fareEth: String(fareEth), txHash: tx.hash });
      
      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error('❌ [Blockchain] Transaction Error:', err);
      const msg = err.code === 4001 ? 'Transaction rejected.' : (err.reason || err.message);
      showNotification(`Blockchain error: ${msg}`, 'error');
      throw err;
    }
  }, [walletConnected]);

  const acceptRideOnChain = useCallback(async (rideId, isFree = false) => {
    try {
      if (isFree) {
        console.log('⚡ [Blockchain] Free Ride: Bypassing Accept transaction');
        return { success: true, txHash: '0x_MOCKED_FREE_ACCEPT' };
      }
      const provider = getProvider();
      const contract = await getContract(true);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 1000000000n;
      const tx = await contract.acceptRide(keccak256(toUtf8Bytes(rideId)), {
        gasPrice: gasPrice > 1000000000n ? gasPrice / 2n : 1000000000n
      });
      setTxPending(tx.hash);
      await tx.wait();
      setTxConfirmed();
      return { success: true, txHash: tx.hash };
    } catch (err) {
      showNotification(`Blockchain error: ${err.reason || err.message}`, 'error');
      throw err;
    }
  }, [walletConnected]);

  const startRideOnChain = useCallback(async (rideId, isFree = false) => {
    try {
      if (isFree) {
        console.log('⚡ [Blockchain] Free Ride: Bypassing Start transaction');
        return { success: true, txHash: '0x_MOCKED_FREE_START' };
      }
      const provider = getProvider();
      const contract = await getContract(true);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 1000000000n;
      const tx = await contract.startRide(keccak256(toUtf8Bytes(rideId)), {
        gasPrice: gasPrice > 1000000000n ? gasPrice / 2n : 1000000000n
      });
      setTxPending(tx.hash);
      await tx.wait();
      setTxConfirmed();
      return { success: true, txHash: tx.hash };
    } catch (err) {
      showNotification(`Blockchain error: ${err.reason || err.message}`, 'error');
      throw err;
    }
  }, [walletConnected]);

  const completeRideOnChain = useCallback(async (rideId, isFree = false) => {
    try {
      if (isFree) {
        console.log('⚡ [Blockchain] Free Ride: Bypassing Complete transaction');
        return { success: true, txHash: '0x_MOCKED_FREE_COMPLETE' };
      }
      const provider = getProvider();
      const contract = await getContract(true);
      showNotification('💰 Releasing payment from escrow...', 'info');
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 1000000000n;
      const tx = await contract.completeRide(keccak256(toUtf8Bytes(rideId)), {
        gasPrice: gasPrice > 1000000000n ? gasPrice / 2n : 1000000000n
      });
      setTxPending(tx.hash);
      await tx.wait();
      setTxConfirmed();
      reset();
      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error('❌ [Blockchain] Completion Error:', err);
      showNotification(`Blockchain error: ${err.reason || err.message}`, 'error');
      throw err;
    }
  }, [walletConnected]);

  const cancelRideOnChain = useCallback(async (rideId) => {
    try {
      const provider = getProvider();
      const contract = await getContract(true);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 1000000000n;
      const tx = await contract.cancelRide(keccak256(toUtf8Bytes(rideId)), {
        gasPrice: gasPrice > 1000000000n ? gasPrice / 2n : 1000000000n
      });
      setTxPending(tx.hash);
      await tx.wait();
      setTxConfirmed();
      reset();
      return { success: true, txHash: tx.hash };
    } catch (err) {
      showNotification(`Blockchain error: ${err.reason || err.message}`, 'error');
      throw err;
    }
  }, [walletConnected]);

  const fetchOnChainRide = useCallback(async (rideId) => {
    try {
      const contract = await getContract(false);
      const rideIdBytes32 = rideId.startsWith('0x') ? rideId : keccak256(toUtf8Bytes(rideId));
      return await contract.getRide(rideIdBytes32);
    } catch {
      return null;
    }
  }, []);

  /**
   * fetchOnChainHistory — Retrieves all rides associated with the current wallet.
   */
  const fetchOnChainHistory = useCallback(async () => {
    if (!walletAddress) return [];
    try {
      const contract = await getContract(false);
      const riderRideIds = await contract.getRiderRides(walletAddress);
      const driverRideIds = await contract.getDriverRides(walletAddress);
      
      const allIds = [...new Set([...riderRideIds, ...driverRideIds])];
      const history = await Promise.all(
        allIds.map(async (id) => {
          const ride = await contract.getRide(id);
          return {
            id,
            rideId: ride.rideId,
            rider: ride.rider,
            driver: ride.driver,
            fare: formatEther(ride.fare),
            status: Number(ride.status),
            timestamp: Number(ride.createdAt) * 1000,
          };
        })
      );
      
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to fetch on-chain history:', err);
      return [];
    }
  }, [walletAddress]);

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) connectWallet();
    });
    const onAccountsChanged = (acc) => acc.length === 0 ? disconnectWallet() : connectWallet();
    const onChainChanged = () => window.location.reload();
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, []);

  return {
    walletAddress,
    walletConnected,
    chainId,
    balance,
    isConnecting,
    isCorrectNetwork: chainId === EXPECTED_CHAIN_ID,
    expectedChainId: EXPECTED_CHAIN_ID,
    networkName: NETWORKS[EXPECTED_CHAIN_ID]?.chainName || `Chain ${EXPECTED_CHAIN_ID}`,
    contractAddress: contractData.contractAddress,
    rideOnChain,
    txHash,
    txPending,
    escrowBalance,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    createRideOnChain,
    acceptRideOnChain,
    startRideOnChain,
    completeRideOnChain,
    cancelRideOnChain,
    fetchOnChainRide,
    fetchOnChainHistory,
  };
};

export default useBlockchain;
