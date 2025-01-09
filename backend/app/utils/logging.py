import logging
import sys
from typing import Any, Dict
import json


class ColorFormatter(logging.Formatter):
    """Custom formatter with colors"""

    grey = "\x1b[38;20m"
    blue = "\x1b[34;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    green = "\x1b[32;20m"
    reset = "\x1b[0m"

    COLORS = {
        logging.DEBUG: blue,
        logging.INFO: green,
        logging.WARNING: yellow,
        logging.ERROR: red,
        logging.CRITICAL: bold_red,
    }

    def format(self, record: logging.LogRecord) -> str:
        if not record.exc_info:
            level_color = self.COLORS.get(record.levelno)
            record.levelname = f"{level_color}{record.levelname}{self.reset}"
            record.msg = f"{level_color}{record.msg}{self.reset}"
        return super().format(record)


def setup_logging() -> None:
    """Setup application logging"""
    logger = logging.getLogger("app")
    logger.setLevel(logging.DEBUG)

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    formatter = ColorFormatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler for all logs
    file_handler = logging.FileHandler("app.log")
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)


def log_api_call(
    function_name: str, args: Dict[str, Any], result: Any, logger: logging.Logger
) -> None:
    """Log API call with colored output"""
    try:
        logger.info(
            f"\n🔧 Function Call: {function_name}\n"
            f"📝 Arguments:\n{json.dumps(args, indent=2)}\n"
            f"✅ Result:\n{json.dumps(result, indent=2)}"
        )
    except Exception as e:
        logger.error(f"Error logging API call: {str(e)}")
