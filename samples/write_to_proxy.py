import time
from lib.pc import *

if __name__ == "__main__":
    PC = ProxyConnection("localhost", 8080, 1)

    while True:
        time.sleep(1)

        bps = input("Enter bitrate (bit/s): ")
        if bps == "":
            continue

        data = {
            "encoder": {
                "encoder_bitrate": int(bps),
                "encoder_fps": 60.0,
            }
        }

        # Send data to ProxyConnection
        PC.send(data)
