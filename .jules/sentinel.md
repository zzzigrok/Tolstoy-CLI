## 2024-05-15 - Insecure Deserialization (Pickle)
**Vulnerability:** The application used `pickle.load()` directly across the codebase (`tolstoy_cli.py`, `utils/model_utils.py`, `tokenizers/bpe_tokenizer.py`, `training/trainer.py`) to deserialize user-provided `.pkl` and config files.
**Learning:** `pickle` allows arbitrary object execution during unpickling. Because `tolstoy_cli.py` interacts with local files and accepts file paths from users, an attacker could load a malicious file, leading to RCE (Remote Code Execution) or LPE (Local Privilege Escalation).
**Prevention:** Always restrict the unpickling classes using a custom `RestrictedUnpickler` that overrides `find_class` to throw exceptions, preventing arbitrary instantiation of objects, or migrate to safer serialization formats like `json` or `safetensors`.

## 2025-01-24 - Insecure XML Parsing (XXE)
**Vulnerability:** The application used standard `xml.etree.ElementTree` to parse XML files, which is vulnerable to XML External Entity (XXE) and billion laughs attacks.
**Learning:** Standard XML parsers in Python often have external entities enabled by default or are susceptible to recursive entity expansion, allowing for local file disclosure or Denial of Service (DoS).
**Prevention:** Use `defusedxml` as a drop-in replacement for standard library XML parsers to mitigate XXE and entity expansion risks.
