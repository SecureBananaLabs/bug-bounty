from typing import Optional, Tuple, Any

class UploadError(Exception):
    """Custom exception for upload errors."""
    pass

def is_file_empty(file_obj: Any) -> bool:
    """
    Check if the uploaded file is empty.

    Args:
        file_obj: A file-like object supporting read() and seek().

    Returns:
        True if file is empty, False otherwise.
    """
    current_pos = file_obj.tell()
    file_obj.seek(0, 2)  # Seek to end
    size = file_obj.tell()
    file_obj.seek(current_pos)  # Restore position
    return size == 0

def handle_file_upload(file_obj: Any, filename: str) -> Tuple[bool, Optional[str]]:
    """
    Handle the file upload logic, rejecting empty files.

    Args:
        file_obj: A file-like object representing the uploaded file.
        filename: The name of the uploaded file.

    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    if not filename:
        return False, "No filename provided."

    if is_file_empty(file_obj):
        return False, "Uploaded file is empty."

    # Proceed with file saving logic (pseudo-code, replace with actual implementation)
    # save_file(file_obj, filename)
    # For demonstration, we'll just return success
    return True, None

# Example usage in a web handler (pseudo-code)
def upload_endpoint(request: Any) -> dict:
    """
    Example upload endpoint handler.

    Args:
        request: The incoming request object with file data.

    Returns:
        dict: Response dictionary.
    """
    file_obj = getattr(request, 'file', None)
    filename = getattr(request, 'filename', '')

    if file_obj is None:
        return {"success": False, "error": "No file uploaded."}

    success, error = handle_file_upload(file_obj, filename)
    if not success:
        return {"success": False, "error": error}
    return {"success": True, "message": "File uploaded successfully."}