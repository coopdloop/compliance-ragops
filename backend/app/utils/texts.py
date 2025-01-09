from typing import Union, Dict, Any
import yaml
import json
import xml.etree.ElementTree as ET
import logging

logger = logging.getLogger(__name__)


def extract_text_from_binary(
    content: bytes, file_ext: str
) -> Union[str, Dict[str, Any]]:
    """Extract text from various file formats"""
    try:
        if file_ext in {".yaml", ".yml"}:
            return yaml.safe_load(content)

        elif file_ext == ".xml":
            root = ET.fromstring(content)
            return _xml_to_dict(root)

        elif file_ext == ".json":
            return json.loads(content)

        elif file_ext in {".pdf", ".doc", ".docx"}:
            # For demonstration, returning raw text
            # In production, you'd want to use libraries like:
            # - PyPDF2 for PDFs
            # - python-docx for DOCX files
            return content.decode("utf-8", errors="ignore")

        else:
            # For text files, just decode
            return content.decode("utf-8")

    except Exception as e:
        logger.error(f"Error extracting text from {file_ext} file: {str(e)}")
        raise ValueError(f"Failed to process {file_ext} file: {str(e)}")


def _xml_to_dict(element: ET.Element) -> Union[Dict[str, Any], str]:
    """Convert XML to dictionary"""
    result: Dict[str, Any] = {}

    # Process attributes
    for key, value in element.attrib.items():
        result[f"@{key}"] = value

    # Process children
    for child in element:
        child_data = _xml_to_dict(child)
        if child.tag in result:
            if isinstance(result[child.tag], list):
                result[child.tag].append(child_data)
            else:
                result[child.tag] = [result[child.tag], child_data]
        else:
            result[child.tag] = child_data

    # Process text content
    if element.text and element.text.strip():
        if result:
            result["#text"] = element.text.strip()
        else:
            return element.text.strip()

    return result


def sanitize_text(text: str) -> str:
    """Clean and sanitize text"""
    return text.strip().replace("\x00", "")
