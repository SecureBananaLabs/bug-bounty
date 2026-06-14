from decimal import Decimal, getcontext
from math import factorial


EXPECTED_DECIMALS = (
    "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
    "8214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196"
    "4428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273"
    "7245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094"
    "3305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912"
)


def chudnovsky_pi(decimal_places):
    getcontext().prec = decimal_places + 80
    total = Decimal(0)

    # Each Chudnovsky term adds roughly 14 decimal digits of precision.
    terms = decimal_places // 14 + 6
    for k in range(terms):
        numerator = Decimal(factorial(6 * k)) * (13591409 + 545140134 * k)
        denominator = (
            Decimal(factorial(3 * k))
            * (Decimal(factorial(k)) ** 3)
            * (Decimal(-640320) ** (3 * k))
        )
        total += numerator / denominator

    multiplier = Decimal(426880) * Decimal(10005).sqrt()
    return multiplier / total


def main():
    pi_value = chudnovsky_pi(500)
    decimals = str(pi_value).split(".")[1][:500]
    assert decimals == EXPECTED_DECIMALS
    assert len(decimals) == 500
    print("Verified PI to 500 decimal places.")
    print(f"Decimal places 401-500: {decimals[400:500]}")


if __name__ == "__main__":
    main()
