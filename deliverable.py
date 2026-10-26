"""
Smart Contract Invariant Fuzzing & Reentrancy Test Suite
Deliverable for SecureBananaLabs/bug-bounty

This module provides an invariant fuzzing framework and reentrancy analysis
suite for smart contract accounting logic and reentrancy protection patterns.
"""

from dataclasses import dataclass, field
import random
import time
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
import unittest


# =====================================================================
# Domain Exceptions
# =====================================================================


class SmartContractException(Exception):
    """Base exception for smart contract simulation errors."""


class InsufficientFundsError(SmartContractException):
    """Raised when an account attempts to spend or withdraw more than balance."""


class ReentrancyError(SmartContractException):
    """Raised when reentrancy is detected by a reentrancy guard."""


class InvariantViolationError(SmartContractException):
    """Raised when a system invariant is broken during fuzzing."""


# =====================================================================
# Simulated Smart Contracts
# =====================================================================


class BaseVault:
    """Base smart contract vault implementing balance tracking."""

    def __init__(self, initial_ether: int = 0) -> None:
        self.balances: Dict[str, int] = {}
        self.total_deposited: int = 0
        self.ether_balance: int = initial_ether

    def get_balance(self, account: str) -> int:
        return self.balances.get(account, 0)

    def deposit(self, sender: str, amount: int) -> None:
        if amount <= 0:
            raise ValueError("Deposit amount must be positive.")
        self.balances[sender] = self.get_balance(sender) + amount
        self.total_deposited += amount
        self.ether_balance += amount


class VulnerableVault(BaseVault):
    """
    Vulnerable vault implementation susceptible to classic reentrancy.
    Violates the Checks-Effects-Interactions pattern by transferring assets
    (via callback) BEFORE updating internal accounting.
    """

    def withdraw(
        self,
        sender: str,
        amount: int,
        callback: Optional[Callable[[int], None]] = None,
    ) -> None:
        sender_bal = self.get_balance(sender)
        # 1. Checks
        if sender_bal < amount:
            raise InsufficientFundsError(
                f"Insufficient balance: {sender_bal} < {amount}"
            )
        if self.ether_balance < amount:
            raise InsufficientFundsError(
                f"Vault reserve deficient: {self.ether_balance} < {amount}"
            )

        # 2. Interactions (Premature external call)
        self.ether_balance -= amount
        if callback is not None:
            callback(amount)

        # 3. Effects (Belated state update)
        self.balances[sender] = sender_bal - amount
        self.total_deposited -= amount


class SecureVault(BaseVault):
    """
    Secure vault implementation protected by:
    1. Checks-Effects-Interactions (CEI) pattern.
    2. Mutex-based nonReentrant guard modifier.
    """

    def __init__(self, initial_ether: int = 0) -> None:
        super().__init__(initial_ether=initial_ether)
        self._reentrancy_lock: bool = False

    def withdraw(
        self,
        sender: str,
        amount: int,
        callback: Optional[Callable[[int], None]] = None,
    ) -> None:
        # Reentrancy Guard (nonReentrant modifier)
        if self._reentrancy_lock:
            raise ReentrancyError(
                "ReentrancyGuard: reentrant call detected during execution."
            )
        self._reentrancy_lock = True

        try:
            sender_bal = self.get_balance(sender)
            # 1. Checks
            if sender_bal < amount:
                raise InsufficientFundsError(
                    f"Insufficient balance: {sender_bal} < {amount}"
                )
            if self.ether_balance < amount:
                raise InsufficientFundsError(
                    f"Vault reserve deficient: {self.ether_balance} < {amount}"
                )

            # 2. Effects (State mutation occurs before external call)
            self.balances[sender] = sender_bal - amount
            self.total_deposited -= amount
            self.ether_balance -= amount

            # 3. Interactions (Safe external execution)
            if callback is not None:
                callback(amount)

        finally:
            self._reentrancy_lock = False


# =====================================================================
# Simulated Adversary
# =====================================================================


class MaliciousReentrancyReceiver:
    """
    Simulates a malicious receiver contract attempting recursive reentrancy
    upon receiving control flow during a withdrawal.
    """

    def __init__(
        self,
        target_vault: BaseVault,
        attacker_address: str,
        max_reentrancy_depth: int = 5,
    ) -> None:
        self.target_vault = target_vault
        self.attacker_address = attacker_address
        self.max_depth = max_reentrancy_depth
        self.current_depth = 0
        self.total_stolen = 0
        self.successful_reentries = 0

    def receive_funds(self, amount: int) -> None:
        self.total_stolen += amount
        if self.current_depth < self.max_depth:
            self.current_depth += 1
            remaining = self.target_vault.get_balance(self.attacker_address)
            if remaining > 0 and self.target_vault.ether_balance >= remaining:
                self.successful_reentries += 1
                # Trigger reentrant callback
                self.target_vault.withdraw(
                    sender=self.attacker_address,
                    amount=remaining,
                    callback=self.receive_funds,
                )
            self.current_depth -= 1


# =====================================================================
# Invariant Definitions & Checker
# =====================================================================


@dataclass
class InvariantResult:
    passed: bool
    name: str
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)


class InvariantEngine:
    """Evaluates core protocol invariants on vault states."""

    @staticmethod
    def check_solvency(vault: BaseVault) -> InvariantResult:
        """Invariant 1: Vault reserve must match tracked total deposits."""
        summed = sum(vault.balances.values())
        if vault.ether_balance != vault.total_deposited:
            return InvariantResult(
                passed=False,
                name="Solvency_EtherToTotalDeposited",
                message=f"Ether reserve ({vault.ether_balance}) != Total deposited ({vault.total_deposited})",
            )
        if vault.total_deposited != summed:
            return InvariantResult(
                passed=False,
                name="Accounting_TotalDepositedToSumBalances",
                message=f"Total deposited ({vault.total_deposited}) != Sum of balances ({summed})",
            )
        return InvariantResult(passed=True, name="Solvency")

    @staticmethod
    def check_non_negative_balances(vault: BaseVault) -> InvariantResult:
        """Invariant 2: No account balance can ever be negative."""
        for acct, bal in vault.balances.items():
            if bal < 0:
                return InvariantResult(
                    passed=False,
                    name="NonNegativeBalances",
                    message=f"Negative balance detected for {acct}: {bal}",
                    details={"account": acct, "balance": bal},
                )
        return InvariantResult(passed=True, name="NonNegativeBalances")

    @staticmethod
    def check_all(vault: BaseVault) -> List[InvariantResult]:
        return [
            InvariantEngine.check_solvency(vault),
            InvariantEngine.check_non_negative_balances(vault),
        ]


# =====================================================================
# Invariant Fuzzer
# =====================================================================


@dataclass
class FuzzAction:
    action_type: str  # 'deposit', 'withdraw'
    account: str
    amount: int


class StatefulInvariantFuzzer:
    """
    Property-based stateful invariant fuzzer for smart contract vaults.
    Generates pseudo-random sequences of protocol interactions and
    verifies invariants after each operation.
    """

    def __init__(
        self,
        vault_factory: Callable[[], BaseVault],
        accounts: Optional[List[str]] = None,
        seed: Optional[int] = 42,
    ) -> None:
        self.vault_factory = vault_factory
        self.accounts = accounts or ["alice", "bob", "charlie", "dave"]
        self.rng = random.Random(seed)

    def generate_action(
        self, current_vault: BaseVault, max_val: int = 1000
    ) -> FuzzAction:
        acct = self.rng.choice(self.accounts)
        action_type = self.rng.choice(["deposit", "withdraw"])

        if action_type == "deposit":
            amount = self.rng.randint(1, max_val)
        else:
            cur_bal = current_vault.get_balance(acct)
            if cur_bal > 0 and self.rng.random() > 0.3:
                # Normal withdraw within balance
                amount = self.rng.randint(1, cur_bal)
            else:
                # Boundary fuzzing: test potential underflow / overdraft
                amount = self.rng.randint(1, max_val * 2)

        return FuzzAction(action_type=action_type, account=acct, amount=amount)

    def run_campaign(
        self, num_sequences: int = 50, ops_per_sequence: int = 30
    ) -> Dict[str, Any]:
        """
        Executes an invariant fuzzing campaign.
        Returns a summary report of tested properties and outcomes.
        """
        total_ops = 0
        violations: List[Dict[str, Any]] = []

        for seq_idx in range(num_sequences):
            vault = self.vault_factory()
            action_history: List[FuzzAction] = []

            for op_idx in range(ops_per_sequence):
                action = self.generate_action(vault)
                action_history.append(action)
                total_ops += 1

                # Execute action
                try:
                    if action.action_type == "deposit":
                        vault.deposit(action.account, action.amount)
                    elif action.action_type == "withdraw":
                        vault.withdraw(action.account, action.amount)
                except SmartContractException:
                    # Expected reverts (e.g. overdrafts) are valid behavior
                    pass

                # Check invariants
                results = InvariantEngine.check_all(vault)
                for res in results:
                    if not res.passed:
                        violations.append(
                            {
                                "sequence": seq_idx,
                                "operation": op_idx,
                                "invariant": res.name,
                                "error": res.message,
                                "action": action,
                                "history_len": len(action_history),
                            }
                        )
                        # Cease this sequence upon state corruption
                        break
                if violations and violations[-1]["sequence"] == seq_idx:
                    break

        return {
            "sequences_run": num_sequences,
            "total_operations": total_ops,
            "violations_found": len(violations),
            "violations": violations,
        }


# =====================================================================
# Test Suite Implementation
# =====================================================================


class TestSmartContractInvariants(unittest.TestCase):
    """Test suite evaluating invariant preservation and reentrancy resilience."""

    def setUp(self) -> None:
        self.accounts = ["user_1", "user_2", "attacker"]

    def test_secure_vault_fuzzing_invariants_hold(self) -> None:
        """Verify that SecureVault maintains solvency invariants across random fuzzing."""
        fuzzer = StatefulInvariantFuzzer(
            vault_factory=lambda: SecureVault(initial_ether=0),
            accounts=self.accounts,
            seed=1337,
        )
        report = fuzzer.run_campaign(num_sequences=40, ops_per_sequence=25)
        self.assertEqual(
            report["violations_found"],
            0,
            f"Invariants failed in SecureVault: {report['violations']}",
        )
        self.assertGreater(report["total_operations"], 0)

    def test_vulnerable_vault_exploited_via_reentrancy(self) -> None:
        """
        Verify that VulnerableVault allows reentrancy and breaks invariant
        when exploited by MaliciousReentrancyReceiver.
        """
        vault = VulnerableVault(initial_ether=0)
        # Legitimate users deposit funds
        vault.deposit("user_1", 500)
        vault.deposit("user_2", 500)
        self.assertEqual(vault.ether_balance, 1000)

        # Attacker deposits 100
        attacker_id = "attacker"
        vault.deposit(attacker_id, 100)

        # Attacker executes reentrancy
        attacker = MaliciousReentrancyReceiver(
            target_vault=vault,
            attacker_address=attacker_id,
            max_reentrancy_depth=10,
        )

        vault.withdraw(
            sender=attacker_id,
            amount=100,
            callback=attacker.receive_funds,
        )

        # In VulnerableVault, attacker extracted more than their original 100
        self.assertGreater(
            attacker.total_stolen,
            100,
            "Reentrancy attack failed to extract excess funds.",
        )
        self.assertGreater(attacker.successful_reentries, 0)

        # Check invariant failure
        solvency = InvariantEngine.check_solvency(vault)
        self.assertFalse(
            solvency.passed,
            "VulnerableVault should have broken solvency invariant after reentrancy.",
        )

    def test_secure_vault_blocks_reentrancy(self) -> None:
        """
        Verify that SecureVault raises ReentrancyError and preserves
        solvency when subjected to recursive callback attacks.
        """
        vault = SecureVault(initial_ether=0)
        vault.deposit("user_1", 500)
        vault.deposit("user_2", 500)
        vault.deposit("attacker", 100)

        attacker = MaliciousReentrancyReceiver(
            target_vault=vault,
            attacker_address="attacker",
            max_reentrancy_depth=5,
        )

        # Attempt withdrawal with malicious recursive callback
        with self.assertRaises(ReentrancyError):
            vault.withdraw(
                sender="attacker",
                amount=100,
                callback=attacker.receive_funds,
            )

        # Accounting state must remain completely uncorrupted
        solvency = InvariantEngine.check_solvency(vault)
        self.assertTrue(
            solvency.passed,
            f"Solvency broken after caught reentrancy: {solvency.message}",
        )

        non_neg = InvariantEngine.check_non_negative_balances(vault)
        self.assertTrue(non_neg.passed, "Non-negative balance invariant violated.")

    def test_checks_effects_interactions_state_coherence(self) -> None:
        """Verify state is committed prior to interaction in SecureVault."""
        vault = SecureVault()
        vault.deposit("alice", 200)

        observed_balance_during_callback = []

        def spy_callback(amount: int) -> None:
            # During callback, alice's balance should already be reduced
            observed_balance_during_callback.append(vault.get_balance("alice"))

        vault.withdraw("alice", 150, callback=spy_callback)

        self.assertEqual(len(observed_balance_during_callback), 1)
        self.assertEqual(
            observed_balance_during_callback[0],
            50,
            "CEI violated: balance was not updated prior to external interaction.",
        )
        self.assertEqual(vault.get_balance("alice"), 50)


# =====================================================================
# Standalone Execution Runner
# =====================================================================


def run_full_verification() -> bool:
    """Executes the test suite and fuzzing analysis, returning overall status."""
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestSmartContractInvariants)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_full_verification()
    status_str = "SUCCESS" if success else "FAILED"
    print(f"\n[+] Smart contract verification suite finished: {status_str}")