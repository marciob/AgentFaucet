// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {FaucetPool} from "../src/FaucetPool.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FaucetPoolTest is Test {
    FaucetPool public pool;

    address public owner = makeAddr("owner");
    address public relayer = makeAddr("relayer");
    address public user = makeAddr("user");
    address public recipient = makeAddr("recipient");

    event TokensClaimed(address indexed recipient, uint256 amount, uint256 timestamp, uint256 agentTokenId);
    event TokensDeposited(address indexed sender, uint256 amount);
    event SponsorDeposited(address indexed sender, uint256 amount, string campaignId, string metadata);
    event TokensReturned(address indexed sender, uint256 amount, string developerId);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event MaxClaimAmountUpdated(uint256 oldMax, uint256 newMax);
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    function setUp() public {
        vm.prank(owner);
        pool = new FaucetPool(relayer);
        vm.deal(address(pool), 100 ether);
    }

    // ========================
    // Deployment
    // ========================

    function test_DeploymentSetsOwner() public view {
        assertEq(pool.owner(), owner);
    }

    function test_DeploymentSetsRelayer() public view {
        assertEq(pool.relayer(), relayer);
    }

    function test_DeploymentSetsDefaultMaxClaimAmount() public view {
        assertEq(pool.maxClaimAmount(), 10 ether);
    }

    function test_DeploymentRevertsZeroRelayer() public {
        vm.prank(owner);
        vm.expectRevert(FaucetPool.ZeroAddress.selector);
        new FaucetPool(address(0));
    }

    // ========================
    // claim()
    // ========================

    function test_ClaimByRelayer() public {
        uint256 balanceBefore = recipient.balance;

        vm.prank(relayer);
        pool.claim(recipient, 1 ether, 42);

        assertEq(recipient.balance, balanceBefore + 1 ether);
    }

    function test_ClaimEmitsEvent() public {
        vm.prank(relayer);
        vm.expectEmit(true, false, false, true);
        emit TokensClaimed(recipient, 1 ether, block.timestamp, 42);
        pool.claim(recipient, 1 ether, 42);
    }

    function test_ClaimRevertsNonRelayer() public {
        vm.prank(user);
        vm.expectRevert(FaucetPool.OnlyRelayer.selector);
        pool.claim(recipient, 1 ether, 42);
    }

    function test_ClaimRevertsExceedsBalance() public {
        // Drain pool first, then try to claim within max but above balance
        vm.prank(owner);
        pool.emergencyWithdraw(owner);

        vm.prank(relayer);
        vm.expectRevert(FaucetPool.InsufficientBalance.selector);
        pool.claim(recipient, 1 ether, 42);
    }

    function test_ClaimRevertsExceedsMaxClaim() public {
        vm.prank(relayer);
        vm.expectRevert(FaucetPool.ExceedsMaxClaim.selector);
        pool.claim(recipient, 11 ether, 42);
    }

    function test_ClaimRevertsZeroAmount() public {
        vm.prank(relayer);
        vm.expectRevert(FaucetPool.ZeroAmount.selector);
        pool.claim(recipient, 0, 42);
    }

    function test_ClaimRevertsZeroAddress() public {
        vm.prank(relayer);
        vm.expectRevert(FaucetPool.ZeroAddress.selector);
        pool.claim(address(0), 1 ether, 42);
    }

    // ========================
    // deposit()
    // ========================

    function test_DepositIncreasesBalance() public {
        uint256 balanceBefore = address(pool).balance;

        vm.deal(user, 5 ether);
        vm.prank(user);
        pool.deposit{value: 5 ether}();

        assertEq(address(pool).balance, balanceBefore + 5 ether);
    }

    function test_DepositEmitsEvent() public {
        vm.deal(user, 5 ether);
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit TokensDeposited(user, 5 ether);
        pool.deposit{value: 5 ether}();
    }

    function test_DepositRevertsZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(FaucetPool.ZeroAmount.selector);
        pool.deposit{value: 0}();
    }

    // ========================
    // sponsorDeposit()
    // ========================

    function test_SponsorDepositIncreasesBalance() public {
        uint256 balanceBefore = address(pool).balance;

        vm.deal(user, 5 ether);
        vm.prank(user);
        pool.sponsorDeposit{value: 5 ether}("campaign-1", "metadata-xyz");

        assertEq(address(pool).balance, balanceBefore + 5 ether);
    }

    function test_SponsorDepositEmitsEvent() public {
        vm.deal(user, 5 ether);
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit SponsorDeposited(user, 5 ether, "campaign-1", "metadata-xyz");
        pool.sponsorDeposit{value: 5 ether}("campaign-1", "metadata-xyz");
    }

    function test_SponsorDepositRevertsZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(FaucetPool.ZeroAmount.selector);
        pool.sponsorDeposit{value: 0}("campaign-1", "metadata-xyz");
    }

    // ========================
    // returnTokens()
    // ========================

    function test_ReturnTokensIncreasesBalance() public {
        uint256 balanceBefore = address(pool).balance;

        vm.deal(user, 3 ether);
        vm.prank(user);
        pool.returnTokens{value: 3 ether}("dev-123");

        assertEq(address(pool).balance, balanceBefore + 3 ether);
    }

    function test_ReturnTokensEmitsEvent() public {
        vm.deal(user, 3 ether);
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit TokensReturned(user, 3 ether, "dev-123");
        pool.returnTokens{value: 3 ether}("dev-123");
    }

    function test_ReturnTokensRevertsZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(FaucetPool.ZeroAmount.selector);
        pool.returnTokens{value: 0}("dev-123");
    }

    // ========================
    // setRelayer()
    // ========================

    function test_SetRelayerByOwner() public {
        address newRelayer = makeAddr("newRelayer");

        vm.prank(owner);
        pool.setRelayer(newRelayer);

        assertEq(pool.relayer(), newRelayer);
    }

    function test_SetRelayerEmitsEvent() public {
        address newRelayer = makeAddr("newRelayer");

        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit RelayerUpdated(relayer, newRelayer);
        pool.setRelayer(newRelayer);
    }

    function test_SetRelayerRevertsNonOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        pool.setRelayer(makeAddr("newRelayer"));
    }

    function test_SetRelayerRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(FaucetPool.ZeroAddress.selector);
        pool.setRelayer(address(0));
    }

    // ========================
    // setMaxClaimAmount()
    // ========================

    function test_SetMaxClaimAmountByOwner() public {
        vm.prank(owner);
        pool.setMaxClaimAmount(20 ether);

        assertEq(pool.maxClaimAmount(), 20 ether);
    }

    function test_SetMaxClaimAmountEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit MaxClaimAmountUpdated(10 ether, 20 ether);
        pool.setMaxClaimAmount(20 ether);
    }

    function test_SetMaxClaimAmountRevertsNonOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        pool.setMaxClaimAmount(20 ether);
    }

    // ========================
    // emergencyWithdraw()
    // ========================

    function test_EmergencyWithdrawByOwner() public {
        uint256 poolBalance = address(pool).balance;
        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        pool.emergencyWithdraw(owner);

        assertEq(address(pool).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + poolBalance);
    }

    function test_EmergencyWithdrawEmitsEvent() public {
        uint256 poolBalance = address(pool).balance;

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit EmergencyWithdrawal(owner, poolBalance);
        pool.emergencyWithdraw(owner);
    }

    function test_EmergencyWithdrawRevertsNonOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        pool.emergencyWithdraw(user);
    }

    function test_EmergencyWithdrawRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(FaucetPool.ZeroAddress.selector);
        pool.emergencyWithdraw(address(0));
    }

    // ========================
    // Edge cases
    // ========================

    function test_MultipleClaimsDrainPool() public {
        // Set max high enough, fund pool with exactly 10 ether
        vm.prank(owner);
        pool.setMaxClaimAmount(5 ether);

        // Drain initial 100 ether via emergency, then fund with exactly 10
        vm.prank(owner);
        pool.emergencyWithdraw(owner);
        vm.deal(address(pool), 10 ether);

        // 2 claims of 5 ether each should drain it
        vm.startPrank(relayer);
        pool.claim(recipient, 5 ether, 1);
        pool.claim(recipient, 5 ether, 2);
        vm.stopPrank();

        assertEq(address(pool).balance, 0);

        // Next claim should revert
        vm.prank(relayer);
        vm.expectRevert(FaucetPool.InsufficientBalance.selector);
        pool.claim(recipient, 1 ether, 3);
    }

    function test_ConcurrentDepositsAndClaims() public {
        uint256 initialBalance = address(pool).balance;

        // Deposit 5 ether
        vm.deal(user, 5 ether);
        vm.prank(user);
        pool.deposit{value: 5 ether}();

        // Claim 3 ether
        vm.prank(relayer);
        pool.claim(recipient, 3 ether, 1);

        // Balance should be initial + 5 - 3
        assertEq(address(pool).balance, initialBalance + 5 ether - 3 ether);
    }

    function test_ReceiveFunctionAcceptsEther() public {
        uint256 balanceBefore = address(pool).balance;

        vm.deal(user, 1 ether);
        vm.prank(user);
        (bool success,) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(address(pool).balance, balanceBefore + 1 ether);
    }
}
