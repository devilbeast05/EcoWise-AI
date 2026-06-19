import unittest
from datetime import timedelta
from jose import jwt
from app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)

class TestAuthentication(unittest.TestCase):
    def test_password_hashing(self):
        password = "my_secure_password"
        hashed = get_password_hash(password)
        
        # Ensure hash is not the plain text
        self.assertNotEqual(password, hashed)
        
        # Verify matching
        self.assertTrue(verify_password(password, hashed))
        
        # Verify non-matching
        self.assertFalse(verify_password("wrong_password", hashed))

    def test_jwt_token_generation_and_decoding(self):
        email = "test@ecowise.ai"
        token = create_access_token(data={"sub": email})
        
        # Decode token and verify subject
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        self.assertEqual(payload.get("sub"), email)
        self.assertIn("exp", payload)

    def test_jwt_token_expiry(self):
        email = "expire@ecowise.ai"
        # Create a token that expires immediately (negative delta)
        token = create_access_token(data={"sub": email}, expires_delta=timedelta(seconds=-10))
        
        with self.assertRaises(Exception):
            # Decoding expired token should raise ExpiredSignatureError
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

if __name__ == "__main__":
    unittest.main()
