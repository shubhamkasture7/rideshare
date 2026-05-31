import { create } from 'zustand';

const useBlockchainStore = create((set, get) => ({
  // Wallet state
  walletAddress: null,
  walletConnected: false,
  chainId: null,
  balance: null,
  isConnecting: false,
  walletError: null,

  // Contract state
  contractAddress: null,
  rideOnChain: null,          // The current on-chain ride record
  txHash: null,               // Last transaction hash
  txPending: false,           // Waiting for tx confirmation
  escrowBalance: null,        // ETH locked in contract for current ride

  // Actions
  setWallet: (address, chainId, balance) =>
    set({
      walletAddress: address,
      walletConnected: !!address,
      chainId,
      balance,
      walletError: null,
    }),

  setConnecting: (val) => set({ isConnecting: val }),
  setWalletError: (err) => set({ walletError: err }),

  setContractAddress: (addr) => set({ contractAddress: addr }),

  setTxPending: (hash) => set({ txHash: hash, txPending: true }),
  setTxConfirmed: () => set({ txPending: false }),

  setRideOnChain: (ride) => set({ rideOnChain: ride }),
  setEscrowBalance: (balance) => set({ escrowBalance: balance }),

  reset: () =>
    set({
      rideOnChain: null,
      txHash: null,
      txPending: false,
      escrowBalance: null,
    }),
}));

export default useBlockchainStore;
