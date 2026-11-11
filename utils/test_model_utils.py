import unittest
import pickle
import io
import os
import sys
import tempfile
from unittest.mock import MagicMock

# Mock torch before it's imported via utils
sys.modules['torch'] = MagicMock()

from utils.model_utils import safe_pickle_load, clean_text, validate_pkl_file, save_model_config, load_model_config

# Global classes for pickling in tests
class SimpleClass:
    pass

class MaliciousClass:
    def __reduce__(self):
        return (os.system, ('echo hacked',))

class TestModelUtils(unittest.TestCase):
    def test_safe_pickle_load_basic(self):
        # Test loading basic data types that don't require globals
        data = {"key": "value", "list": [1, 2, 3], "int": 42}
        pickled_data = pickle.dumps(data)
        loaded_data = safe_pickle_load(io.BytesIO(pickled_data))
        self.assertEqual(data, loaded_data)

    def test_safe_pickle_load_forbidden_global(self):
        # Create a malicious payload using MaliciousClass
        pickled_malicious = pickle.dumps(MaliciousClass())

        with self.assertRaises(pickle.UnpicklingError) as cm:
            safe_pickle_load(io.BytesIO(pickled_malicious))

        self.assertIn("forbidden for security reasons", str(cm.exception))

    def test_safe_pickle_load_forbidden_custom_class(self):
        # Even a harmless looking custom class should be forbidden
        pickled_simple = pickle.dumps(SimpleClass())

        with self.assertRaises(pickle.UnpicklingError):
            safe_pickle_load(io.BytesIO(pickled_simple))

    def test_clean_text(self):
        self.assertEqual(clean_text("Hello\x00World"), "HelloWorld")
        self.assertEqual(clean_text("  multiple   spaces  "), "multiple spaces")
        self.assertEqual(clean_text("\n\t  mixed \r spaces  "), "mixed spaces")
        self.assertEqual(clean_text(""), "")
        self.assertEqual(clean_text(None), "")

    def test_validate_pkl_file(self):
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            pickle.dump({"a": 1}, tmp)
            tmp_path = tmp.name

        try:
            is_valid, data, msg = validate_pkl_file(tmp_path)
            self.assertTrue(is_valid)
            self.assertEqual(data, {"a": 1})
            self.assertEqual(msg, "OK")

            # Test with malicious file
            with open(tmp_path, 'wb') as f:
                pickle.dump(MaliciousClass(), f)

            is_valid, data, msg = validate_pkl_file(tmp_path)
            self.assertFalse(is_valid)
            self.assertIn("forbidden", msg)

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_save_load_model_config(self):
        config = {"n_embd": 128, "n_layer": 4}
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp_path = tmp.name

        try:
            save_model_config(config, tmp_path)
            loaded_config = load_model_config(tmp_path)
            self.assertEqual(config, loaded_config)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

if __name__ == "__main__":
    unittest.main()
