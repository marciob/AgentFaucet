// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FaucetPool is Ownable, ReentrancyGuard {
    address public relayer;
    uint256 public maxClaimAmount;

    event TokensClaimed(address indexed recipient, uint256 amount, uint256 timestamp, uint256 agentTokenId);
    event TokensDeposited(address indexed sender, uint256 amount);
    event SponsorDeposited(address indexed sender, uint256 amount, string campaignId, string metadata);
    event TokensReturned(address indexed sender, uint256 amount, string developerId);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event MaxClaimAmountUpdated(uint256 oldMax, uint256 newMax);
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    error OnlyRelayer();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error ExceedsMaxClaim();
    error TransferFailed();

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert OnlyRelayer();
        _;
    }

    constructor(address _relayer) Ownable(msg.sender) {
        if (_relayer == address(0)) revert ZeroAddress();
        relayer = _relayer;
        maxClaimAmount = 10 ether;
    }

    function claim(address recipient, uint256 amount, uint256 agentTokenId) external onlyRelayer nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > maxClaimAmount) revert ExceedsMaxClaim();
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool success,) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit TokensClaimed(recipient, amount, block.timestamp, agentTokenId);
    }

    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        emit TokensDeposited(msg.sender, msg.value);
    }

    function sponsorDeposit(string calldata campaignId, string calldata metadata) external payable {
        if (msg.value == 0) revert ZeroAmount();
        emit SponsorDeposited(msg.sender, msg.value, campaignId, metadata);
    }

    function returnTokens(string calldata developerId) external payable {
        if (msg.value == 0) revert ZeroAmount();
        emit TokensReturned(msg.sender, msg.value, developerId);
    }

    function setRelayer(address _relayer) external onlyOwner {
        if (_relayer == address(0)) revert ZeroAddress();
        address oldRelayer = relayer;
        relayer = _relayer;
        emit RelayerUpdated(oldRelayer, _relayer);
    }

    function setMaxClaimAmount(uint256 _max) external onlyOwner {
        uint256 oldMax = maxClaimAmount;
        maxClaimAmount = _max;
        emit MaxClaimAmountUpdated(oldMax, _max);
    }

    function emergencyWithdraw(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        (bool success,) = to.call{value: balance}("");
        if (!success) revert TransferFailed();
        emit EmergencyWithdrawal(to, balance);
    }

    receive() external payable {
        emit TokensDeposited(msg.sender, msg.value);
    }
}
