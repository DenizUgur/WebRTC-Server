import time
from lib.pc import *

if __name__ == "__main__":
    # Instantiate ProxyConnection with host, port and frequency
    PC = ProxyConnection("localhost", 80, 1)

    while True:
        # Prepare payload data
        # This can be subset of the payload
        # However, the parent key must specify which part we want to modify
        dummy_data = {
            "renderer": {
                "key": "value",
            },
            "encoder": {
                "key": "value",
            }
        }

        # Send dummy_data to ProxyConnection
        PC.send(dummy_data)

        # Read payload from ProxyConnection. This is the latest syncronized data
        print(PC.STATUS, PC.read())

        time.sleep(1)