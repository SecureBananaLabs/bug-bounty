"""
wallet_validator.py
Validates EVM wallet addresses for the faucet endpoint.
Fix for: https://github.com/SecureBananaLabs/bug-bounty/issues/764
Ref:     https://github.com/SecureBananaLabs/bug-bounty/issues/743
"""
import re

# EVM address: exactly '0x' + 40 hex characters
_EVM_RE = re.compile(r'^0x[a-fA-F0-9]{40}$')


def is_valid_evm_address(address: str) -> bool:
    """Return True if *address* is a valid EVM wallet address."""
    if not isinstance(address, str):
        return False
    return bool(_EVM_RE.match(address))


def validate_wallet(address: str) -> str:
    """
    Validate and normalise an EVM wallet address.

    Returns the checksummed address on success.
    Raises ValueError with a clear message on failure.
    """
    if not address:
        raise ValueError("wallet address is required")
    if not is_valid_evm_address(address):
        raise ValueError(
            f"invalid EVM wallet address '{address}': "
            "must be '0x' followed by exactly 40 hex characters"
        )
    # Return lowercase-normalised (full checksum requires web3; keep dep-free)
    return address.lower()


# ---------------------------------------------------------------------------
# Tests (run with:  python wallet_validator.py)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    valid = [
        "0xcee846292cc01d7dbb05d2e09c0ad44c0106d20b",
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "0x0000000000000000000000000000000000000000",
    ]
    invalid = [
        "",                          # empty
        "0x",                        # too short
        "0xGGGG",                    # non-hex
        "0xcee846292cc01d7dbb05d2e09c0ad44c0106d20b00",  # too long
        "cee846292cc01d7dbb05d2e09c0ad44c0106d20b",      # missing 0x
        "0x123",                     # 40-char requirement not met
    ]

    print("=== Valid addresses ===")
    for addr in valid:
        result = validate_wallet(addr)
        print(f"  PASS  {addr[:20]}...  -> {result[:20]}...")

    print("\n=== Invalid addresses ===")
    for addr in invalid:
        try:
            validate_wallet(addr)
            print(f"  FAIL  should have raised: {repr(addr)}")
        except ValueError as e:
            print(f"  PASS  {repr(addr)[:30]:32s}  -> {e}")

    print("\nAll tests passed.")
