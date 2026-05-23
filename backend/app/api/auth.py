from fastapi import Header, HTTPException

def get_user_id(x_user_id: str = Header(default="default")):
    """
    Extracts the X-User-ID header to identify the anonymous device session.
    If not provided, falls back to "default", but we enforce it on the frontend.
    """
    if not x_user_id or x_user_id.strip() == "":
        raise HTTPException(status_code=401, detail="X-User-ID header missing or invalid")
    return x_user_id
