import "@nomicfoundation/hardhat-toolbox";
import { readFileSync } from "fs";

let privateKey;
try {
  const env = readFileSync(".env", "utf8");
  privateKey = env.match(/PRIVATE_KEY=(.+)/)?.[1]?.trim();
} catch {}

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: privateKey ? [privateKey] : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
