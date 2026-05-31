import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying RideEscrow contract...");
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  const RideEscrow = await ethers.getContractFactory("RideEscrow");
  const rideEscrow = await RideEscrow.deploy();
  await rideEscrow.waitForDeployment();

  const address = await rideEscrow.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("\n✅ RideEscrow deployed successfully!");
  console.log("Contract address:", address);
  console.log("Network:", network.name, "| ChainId:", Number(network.chainId));

  const deploymentInfo = {
    contractAddress: address,
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  // Save to deployments.json
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentsPath);

  // Copy ABI + address to frontend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/RideEscrow.sol/RideEscrow.json"
  );
  const frontendDir = path.join(
    __dirname,
    "../../frontend/src/features/blockchain"
  );

  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendDir, "RideEscrow.json"),
      JSON.stringify({ abi: artifact.abi, ...deploymentInfo }, null, 2)
    );
    console.log("✅ ABI + deployment info copied to frontend!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
