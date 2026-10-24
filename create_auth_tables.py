
from backend.database import engine
from backend.models import User, OTPVerification

# Create only the two authentication tables.
# Existing project tables will not be modified.
User.metadata.create_all(
    bind=engine,
    tables=[
        User.__table__,
        OTPVerification.__table__,
    ],
)

print("Authentication tables created successfully.")
