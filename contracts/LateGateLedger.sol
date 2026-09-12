// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LateGateLedger
/// @notice House-only event ledger on Base Sepolia for The Graph Studio.
/// Traveler never calls this. Hedera x402 receipts are cited as strings.
/// Dual-write: same backend writes buy/refuse/settle here and HBAR payments on Hedera.
contract LateGateLedger {
    address public immutable house;

    uint256 public nextPolicyId = 1;
    mapping(bytes32 => bool) public usedHumanKey;

    event PolicyRefused(
        bytes32 indexed flightKeyHash,
        string flightKey,
        uint8 code,
        int32 estDelayMin,
        uint64 at
    );
    event PolicyOpened(
        uint256 indexed policyId,
        bytes32 indexed flightKeyHash,
        string flightKey,
        bytes32 humanKey,
        uint32 premiumCents,
        uint32 payoutCents,
        uint16 tauMinutes,
        uint64 scheduledArrival,
        uint64 cutoffAt
    );
    event ObservationPosted(
        uint256 indexed policyId,
        int32 observedDelayMin,
        bytes32 snapshotHash,
        uint64 observedAt
    );
    event PolicySettled(
        uint256 indexed policyId,
        uint8 outcome,
        uint32 payoutCents,
        string hcsRef
    );
    event X402Receipt(
        bytes32 indexed resource,
        string flightKey,
        uint64 amountTinybar,
        string hederaTxId,
        string payer,
        uint64 at
    );

    error NotHouse();
    error HumanKeyUsed();

    modifier onlyHouse() {
        if (msg.sender != house) revert NotHouse();
        _;
    }

    constructor(address house_) {
        house = house_;
    }

    function refuse(
        bytes32 flightKeyHash,
        string calldata flightKey,
        uint8 code,
        int32 estDelayMin
    ) external onlyHouse {
        emit PolicyRefused(flightKeyHash, flightKey, code, estDelayMin, uint64(block.timestamp));
    }

    function openPolicy(
        bytes32 flightKeyHash,
        string calldata flightKey,
        bytes32 humanKey,
        uint32 premiumCents,
        uint32 payoutCents,
        uint16 tauMinutes,
        uint64 scheduledArrival,
        uint64 cutoffAt
    ) external onlyHouse returns (uint256 policyId) {
        if (usedHumanKey[humanKey]) revert HumanKeyUsed();
        usedHumanKey[humanKey] = true;
        policyId = nextPolicyId++;
        emit PolicyOpened(
            policyId,
            flightKeyHash,
            flightKey,
            humanKey,
            premiumCents,
            payoutCents,
            tauMinutes,
            scheduledArrival,
            cutoffAt
        );
    }

    function observe(
        uint256 policyId,
        int32 observedDelayMin,
        bytes32 snapshotHash
    ) external onlyHouse {
        emit ObservationPosted(policyId, observedDelayMin, snapshotHash, uint64(block.timestamp));
    }

    function settle(
        uint256 policyId,
        uint8 outcome,
        uint32 payoutCents,
        string calldata hcsRef
    ) external onlyHouse {
        emit PolicySettled(policyId, outcome, payoutCents, hcsRef);
    }

    function recordX402(
        bytes32 resource,
        string calldata flightKey,
        uint64 amountTinybar,
        string calldata hederaTxId,
        string calldata payer
    ) external onlyHouse {
        emit X402Receipt(resource, flightKey, amountTinybar, hederaTxId, payer, uint64(block.timestamp));
    }
}
