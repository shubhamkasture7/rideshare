// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RideEscrow
 * @dev Decentralized ride-sharing escrow contract.
 *      Replaces centralized payment control with transparent smart contract logic.
 *      Funds are locked on booking and released to driver on completion.
 */
contract RideEscrow {
    // ─── Enums ─────────────────────────────────────────────────────────────────

    enum RideStatus {
        NONE,       // Default - doesn't exist
        CREATED,    // Rider created & paid into escrow
        ACCEPTED,   // Driver accepted - funds locked
        STARTED,    // Ride in progress
        COMPLETED,  // Driver marked complete - funds released
        CANCELLED,  // Cancelled - funds returned to rider
        DISPUTED    // Under dispute
    }

    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Ride {
        bytes32 rideId;           // Unique identifier (from backend UUID, keccak256 encoded)
        address payable rider;    // Rider's wallet address
        address payable driver;   // Driver's wallet address (set on accept)
        uint256 fare;             // Fare in wei (locked in contract)
        uint256 platformFee;      // Platform fee in wei (5%)
        uint256 createdAt;        // Block timestamp of creation
        uint256 acceptedAt;       // Block timestamp of acceptance
        uint256 completedAt;      // Block timestamp of completion
        string pickupHash;        // Keccak-hashed pickup location
        string dropHash;          // Keccak-hashed drop location
        RideStatus status;
    }

    // ─── State Variables ────────────────────────────────────────────────────────

    address public owner;
    uint256 public platformFeePercent = 5; // 5% platform fee
    uint256 public totalPlatformEarnings;
    uint256 public totalRidesCreated;
    uint256 public totalRidesCompleted;

    mapping(bytes32 => Ride) public rides;
    mapping(address => bytes32[]) public riderRides;
    mapping(address => bytes32[]) public driverRides;

    // ─── Events ─────────────────────────────────────────────────────────────────

    event RideCreated(
        bytes32 indexed rideId,
        address indexed rider,
        uint256 fare,
        uint256 timestamp
    );

    event RideAccepted(
        bytes32 indexed rideId,
        address indexed driver,
        uint256 timestamp
    );

    event RideStarted(
        bytes32 indexed rideId,
        uint256 timestamp
    );

    event RideCompleted(
        bytes32 indexed rideId,
        address indexed driver,
        uint256 fareReleased,
        uint256 platformFee,
        uint256 timestamp
    );

    event RideCancelled(
        bytes32 indexed rideId,
        address indexed cancelledBy,
        uint256 refundAmount,
        uint256 timestamp
    );

    event DisputeRaised(
        bytes32 indexed rideId,
        address indexed raisedBy,
        uint256 timestamp
    );

    event DisputeResolved(
        bytes32 indexed rideId,
        address indexed resolvedBy,
        address winner,
        uint256 timestamp
    );

    // ─── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }

    modifier rideExists(bytes32 rideId) {
        require(rides[rideId].status != RideStatus.NONE, "Ride does not exist");
        _;
    }

    modifier onlyRider(bytes32 rideId) {
        require(msg.sender == rides[rideId].rider, "Only the ride's rider");
        _;
    }

    modifier onlyDriver(bytes32 rideId) {
        require(msg.sender == rides[rideId].driver, "Only the assigned driver");
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ─────────────────────────────────────────────────────────

    /**
     * @dev Rider creates a ride request. ETH sent is locked in the contract as escrow.
     * @param rideId   Unique ride ID (keccak256 of backend UUID)
     * @param pickupHash Hashed pickup location string
     * @param dropHash   Hashed drop location string
     */
    function createRide(
        bytes32 rideId,
        string calldata pickupHash,
        string calldata dropHash
    ) external payable {
        require(rides[rideId].status == RideStatus.NONE, "Ride ID already exists");
        require(bytes(pickupHash).length > 0, "Pickup hash required");
        require(bytes(dropHash).length > 0, "Drop hash required");

        uint256 platformFee = (msg.value * platformFeePercent) / 100;

        rides[rideId] = Ride({
            rideId: rideId,
            rider: payable(msg.sender),
            driver: payable(address(0)),
            fare: msg.value,
            platformFee: platformFee,
            createdAt: block.timestamp,
            acceptedAt: 0,
            completedAt: 0,
            pickupHash: pickupHash,
            dropHash: dropHash,
            status: RideStatus.CREATED
        });

        riderRides[msg.sender].push(rideId);
        totalRidesCreated++;

        emit RideCreated(rideId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Driver accepts a ride. Funds remain locked in contract.
     * @param rideId The ride to accept
     */
    function acceptRide(bytes32 rideId) external rideExists(rideId) {
        Ride storage ride = rides[rideId];
        require(ride.status == RideStatus.CREATED, "Ride not in CREATED state");
        require(msg.sender != ride.rider, "Rider cannot accept their own ride");

        ride.driver = payable(msg.sender);
        ride.acceptedAt = block.timestamp;
        ride.status = RideStatus.ACCEPTED;

        driverRides[msg.sender].push(rideId);

        emit RideAccepted(rideId, msg.sender, block.timestamp);
    }

    /**
     * @dev Driver marks the ride as started (rider is in the vehicle).
     * @param rideId The ride to start
     */
    function startRide(bytes32 rideId) external rideExists(rideId) onlyDriver(rideId) {
        Ride storage ride = rides[rideId];
        require(ride.status == RideStatus.ACCEPTED, "Ride not in ACCEPTED state");

        ride.status = RideStatus.STARTED;

        emit RideStarted(rideId, block.timestamp);
    }

    /**
     * @dev Driver marks the ride complete. Funds auto-released to driver minus platform fee.
     * @param rideId The ride to complete
     */
    function completeRide(bytes32 rideId) external rideExists(rideId) onlyDriver(rideId) {
        Ride storage ride = rides[rideId];
        require(ride.status == RideStatus.STARTED, "Ride not in STARTED state");

        ride.completedAt = block.timestamp;
        ride.status = RideStatus.COMPLETED;

        // Calculate payout
        uint256 driverPayout = ride.fare - ride.platformFee;

        // Release escrow: pay driver
        (bool driverPaid, ) = ride.driver.call{value: driverPayout}("");
        require(driverPaid, "Driver payment failed");

        // Collect platform fee
        totalPlatformEarnings += ride.platformFee;
        totalRidesCompleted++;

        emit RideCompleted(rideId, ride.driver, driverPayout, ride.platformFee, block.timestamp);
    }

    /**
     * @dev Cancel a ride. Rules:
     *   - If CREATED: full refund to rider
     *   - If ACCEPTED: full refund to rider (driver hasn't started)  
     *   - If STARTED: only rider can dispute, handled separately
     * @param rideId The ride to cancel
     */
    function cancelRide(bytes32 rideId) external rideExists(rideId) {
        Ride storage ride = rides[rideId];
        require(
            msg.sender == ride.rider || msg.sender == ride.driver,
            "Only ride participants can cancel"
        );
        require(
            ride.status == RideStatus.CREATED || ride.status == RideStatus.ACCEPTED,
            "Cannot cancel a started ride - raise dispute"
        );

        uint256 refundAmount = ride.fare;
        ride.status = RideStatus.CANCELLED;

        // Full refund to rider
        (bool refunded, ) = ride.rider.call{value: refundAmount}("");
        require(refunded, "Refund failed");

        emit RideCancelled(rideId, msg.sender, refundAmount, block.timestamp);
    }

    /**
     * @dev Raise a dispute on an in-progress or completed ride.
     * @param rideId The disputed ride
     */
    function raiseDispute(bytes32 rideId) external rideExists(rideId) {
        Ride storage ride = rides[rideId];
        require(
            msg.sender == ride.rider || msg.sender == ride.driver,
            "Only ride participants"
        );
        require(
            ride.status == RideStatus.STARTED || ride.status == RideStatus.ACCEPTED,
            "Can only dispute active rides"
        );

        ride.status = RideStatus.DISPUTED;

        emit DisputeRaised(rideId, msg.sender, block.timestamp);
    }

    /**
     * @dev Owner resolves a dispute by choosing a winner.
     * @param rideId The disputed ride
     * @param favorRider If true, refund rider. If false, pay driver.
     */
    function resolveDispute(
        bytes32 rideId,
        bool favorRider
    ) external onlyOwner rideExists(rideId) {
        Ride storage ride = rides[rideId];
        require(ride.status == RideStatus.DISPUTED, "Ride not in DISPUTED state");

        address payable winner;
        uint256 amount;

        if (favorRider) {
            winner = ride.rider;
            amount = ride.fare;
        } else {
            winner = ride.driver;
            amount = ride.fare - ride.platformFee;
            totalPlatformEarnings += ride.platformFee;
        }

        ride.status = RideStatus.COMPLETED;
        ride.completedAt = block.timestamp;

        (bool paid, ) = winner.call{value: amount}("");
        require(paid, "Resolution payment failed");

        emit DisputeResolved(rideId, msg.sender, winner, block.timestamp);
    }

    // ─── View Functions ─────────────────────────────────────────────────────────

    function getRide(bytes32 rideId) external view returns (Ride memory) {
        return rides[rideId];
    }

    function getRiderRides(address rider) external view returns (bytes32[] memory) {
        return riderRides[rider];
    }

    function getDriverRides(address driver) external view returns (bytes32[] memory) {
        return driverRides[driver];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getPlatformStats() external view returns (
        uint256 totalRides,
        uint256 completedRides,
        uint256 platformEarnings,
        uint256 contractBalance
    ) {
        return (
            totalRidesCreated,
            totalRidesCompleted,
            totalPlatformEarnings,
            address(this).balance
        );
    }

    // ─── Owner Functions ────────────────────────────────────────────────────────

    function withdrawPlatformFees() external onlyOwner {
        uint256 amount = totalPlatformEarnings;
        require(amount > 0, "Nothing to withdraw");
        totalPlatformEarnings = 0;

        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Withdrawal failed");
    }

    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 20, "Fee cannot exceed 20%");
        platformFeePercent = newFeePercent;
    }
}
