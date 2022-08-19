import time
from lib.pc import *

if __name__ == "__main__":
    PC = ProxyConnection("localhost", 8080, 1)

    while True:
        time.sleep(1)

        data = {
            "renderer": {
                "vSyncCount": 0,
                "targetFrameRate": 30,
            },
            "encoder": {
                "encoder_bitrate": 10_000_000,
                "encoder_fps": 30.0,
            }
        }

        # Send data to ProxyConnection
        PC.send(data)
