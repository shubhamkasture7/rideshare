const { expect } = require("chai");
const hh = require("hardhat");
const ethers = hh.ethers;
const FARE_ETH = "0.01";

describe("RideEscrow", function () {
  let rideEscrow;
  let owner, rider, driver;

  function makeRideId(seed) {
    return ethers.keccak256(ethers.toUtf8Bytes(seed));
  }

  beforeEach(async function () {
    [owner, rider, driver] = await ethers.getSigners();
    const RideEscrow = await ethers.getContractFactory("RideEscrow");
    rideEscrow = await RideEscrow.deploy();
  });

  it("should create a ride and lock funds", async function () {
    const rideId = makeRideId("ride-001");
    const FARE = ethers.parseEther(FARE_ETH);
    await rideEscrow.connect(rider).createRide(rideId, "pickup_hash", "drop_hash", { value: FARE });
    const ride = await rideEscrow.getRide(rideId);
    expect(ride.fare).to.equal(FARE);
    expect(ride.status).to.equal(1n); // CREATED
    expect(await rideEscrow.getContractBalance()).to.equal(FARE);
    console.log("  ✅ Ride created with", FARE_ETH, "ETH locked in escrow");
  });

  it("should allow driver to accept a ride", async function () {
    const rideId = makeRideId("ride-002");
    const FARE = ethers.parseEther(FARE_ETH);
    await rideEscrow.connect(rider).createRide(rideId, "p", "d", { value: FARE });
    await rideEscrow.connect(driver).acceptRide(rideId);
    const ride = await rideEscrow.getRide(rideId);
    expect(ride.driver).to.equal(driver.address);
    expect(ride.status).to.equal(2n); // ACCEPTED
    console.log("  ✅ Driver", driver.address.slice(0, 10), "accepted ride on-chain");
  });

  it("should release funds to driver on completion (escrow unlocked)", async function () {
    const rideId = makeRideId("ride-003");
    const FARE = ethers.parseEther(FARE_ETH);
    await rideEscrow.connect(rider).createRide(rideId, "p", "d", { value: FARE });
    await rideEscrow.connect(driver).acceptRide(rideId);
    await rideEscrow.connect(driver).startRide(rideId);

    const before = await ethers.provider.getBalance(driver.address);
    const tx = await rideEscrow.connect(driver).completeRide(rideId);
    const receipt = await tx.wait();
    const after = await ethers.provider.getBalance(driver.address);

    const platformFee = (FARE * 5n) / 100n;
    const expectedPayout = FARE - platformFee;

    // Driver received at least 90% of the fare (remainder is gas)
    expect(after - before + receipt.gasUsed * tx.gasPrice).to.be.closeTo(
      expectedPayout,
      ethers.parseEther("0.001")
    );
    console.log("  ✅ Driver paid", ethers.formatEther(expectedPayout), "ETH (5% platform fee deducted)");
  });

  it("should refund rider on cancellation", async function () {
    const rideId = makeRideId("ride-004");
    const FARE = ethers.parseEther(FARE_ETH);
    await rideEscrow.connect(rider).createRide(rideId, "p", "d", { value: FARE });
    const before = await ethers.provider.getBalance(rider.address);
    const tx = await rideEscrow.connect(rider).cancelRide(rideId);
    const receipt = await tx.wait();
    const after = await ethers.provider.getBalance(rider.address);
    expect(after - before + receipt.gasUsed * tx.gasPrice).to.be.closeTo(FARE, ethers.parseEther("0.001"));
    console.log("  ✅ Rider refunded", ethers.formatEther(FARE), "ETH on cancellation");
  });

  it("dispute: owner resolves in rider favour", async function () {
    const rideId = makeRideId("ride-005");
    const FARE = ethers.parseEther(FARE_ETH);
    await rideEscrow.connect(rider).createRide(rideId, "p", "d", { value: FARE });
    await rideEscrow.connect(driver).acceptRide(rideId);
    await rideEscrow.connect(driver).startRide(rideId);
    await rideEscrow.connect(rider).raiseDispute(rideId);

    await expect(rideEscrow.connect(owner).resolveDispute(rideId, true))
      .to.emit(rideEscrow, "DisputeResolved");
    console.log("  ✅ Dispute resolved in rider's favour");
  });
});
