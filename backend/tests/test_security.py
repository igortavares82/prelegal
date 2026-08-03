from app.security import generate_session_token, hash_password, verify_password


def test_hash_password_is_not_the_plaintext() -> None:
    assert hash_password("correct-horse") != "correct-horse"


def test_verify_password_accepts_the_correct_password() -> None:
    stored = hash_password("correct-horse")
    assert verify_password("correct-horse", stored) is True


def test_verify_password_rejects_the_wrong_password() -> None:
    stored = hash_password("correct-horse")
    assert verify_password("wrong-password", stored) is False


def test_hash_password_salts_each_call_differently() -> None:
    assert hash_password("correct-horse") != hash_password("correct-horse")


def test_verify_password_rejects_malformed_stored_hashes() -> None:
    assert verify_password("correct-horse", "not-a-valid-hash") is False


def test_generate_session_token_is_unique_each_call() -> None:
    assert generate_session_token() != generate_session_token()
