import { expect } from "chai";
import { ethers } from "hardhat";

describe("RideEscrow", function () {
  let rideEscrow;
  let owner, rider, driver;
  const FARE = ethers.parseEther("0.01");

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
    await rideEscrow.connect(rider).createRide(rideId, "pickup_hash", "drop_hash", { value: FARE });
    const ride = await rideEscrow.getRide(rideId);
    expect(ride.fare).to.equal(FARE);
    expect(ride.status).to.equal(1); // CREATED
    expect(await rideEscrow.getContractBalance()).to.equal(FARE);
  });

  it("should allow driver to accept a ride", async function () {
    const rideId = makeRideId("ride-002");
    await rideEscrow.connect(rider).createRide(rideId, "p", "d", { value: FARE });
    await rideEscrow.connect(driver).acceptRide(rideId);
    const ride = await rideEscrow.getRide(rideId);
    expect(ride.driver).to.equal(driver.address);
    expect(ride.status).to.equal(2); // ACCEPTED
  });

  it("should release funds to driver on completion", async function () {
    const rideId = makeRideId("ride-003");
    await rideEscrow.connect(rider).createRide(rideId, "p", "d", { value: FARE });
    await rideEscrow.connect(driver).acceptRide(rideId);
    await rideEscrow.connect(driver).startRide(rideId);

    const before = await ethers.provider.getBalance(driver.address);
    const tx = await rideEscrow.connect(driver).completeRide(rideId);
    const receipt = await tx.wait();
    const after = await ethers.provider.getBalance(driver.address);

    const platformFee = (FARE * 5n) / 100n;
    const expectedPayout = FARE - platformFee;
    // Driver should have received approximately the payout (minus gas)
    expect(after - before + receipt.gasUsed * tx.gasPrice).to.be.closeTo(
      expectedPayout,
      ethers.parseEther("0.001")
    );
  });

  it("should refund rider on cancellation", async function () {
    const rideId = makeRideId("ride-004");
    await rideEscrow.connect(rider).createRide(rideId, "p", "d", { value: FARE });
    const before = await ethers.provider.getBalance(rider.address);
    const tx = await rideEscrow.connect(rider).cancelRide(rideId);
    const receipt = await tx.wait();
    const after = await ethers.provider.getBalance(rider.address);
    expect(after - before + receipt.gasUsed * tx.gasPrice).to.be.closeTo(FARE, ethers.parseEther("0.001"));
  });
});
