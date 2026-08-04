// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProofOfIntent
 * @notice On-chain verification log for decoded mempool intents and risk mitigations.
 */
contract ProofOfIntent {
    struct IntentLog {
        address targetContract;
        string attackType;
        uint256 riskScorePercentage;
        uint256 timestamp;
        bytes32 intentHash;
    }

    mapping(bytes32 => IntentLog) public verifiedIntents;
    mapping(address => uint256) public validatorSubmissions;

    event IntentRecorded(
        bytes32 indexed intentHash,
        address indexed targetContract,
        string attackType,
        uint256 riskScorePercentage
    );

    address public immutable guardian;

    modifier onlyGuardian() {
        require(msg.sender == guardian, "Only authorized sentinel guardian can record intents");
        _;
    }

    constructor() {
        guardian = msg.sender;
    }

    function recordIntent(
        address _targetContract,
        string calldata _attackType,
        uint256 _riskScorePercentage,
        bytes32 _intentHash
    ) external onlyGuardian {
        require(verifiedIntents[_intentHash].timestamp == 0, "Intent already logged");

        verifiedIntents[_intentHash] = IntentLog({
            targetContract: _targetContract,
            attackType: _attackType,
            riskScorePercentage: _riskScorePercentage,
            timestamp: block.timestamp,
            intentHash: _intentHash
        });

        validatorSubmissions[msg.sender]++;

        emit IntentRecorded(_intentHash, _targetContract, _attackType, _riskScorePercentage);
    }

    function getIntent(bytes32 _intentHash) external view returns (IntentLog memory) {
        require(verifiedIntents[_intentHash].timestamp != 0, "Intent not found");
        return verifiedIntents[_intentHash];
    }
}