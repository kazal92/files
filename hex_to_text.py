import base64

hex_str = "48656c6c6f20776f726c6421"  # "Hello world!"의 HEX 표현

b64en = base64.b64encode(hex_str.encode('utf-8')) # Base64 Encode (Hex -> Base64)
print(f"B64 Encode : {b64en.decode('utf-8')}")

b64de = base64.b64decode(b64en).decode('utf-8') # Base64 Decode (Base64 -> Hex)
print(f"B64 Decode : {b64de}\n")

text = bytes.fromhex(b64de) # Hex -> Plain TEXT
print(f"Plain Text : {text.decode('utf-8')}")

