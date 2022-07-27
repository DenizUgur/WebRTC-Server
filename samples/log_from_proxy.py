import time
import matplotlib.pyplot as plt
from lib.pc import *

if __name__ == "__main__":
    # Instantiate ProxyConnection with host, port and frequency
    PC = ProxyConnection("localhost", 8080, 0.1)

    first_time = None
    log_fp = open("log.csv", "w")

    for t in range(5):
        print(f"{4-t}...")
        time.sleep(1)

    while True:
        # Read payload from ProxyConnection. This is the latest syncronized data
        data = PC.read()

        if "time_us" not in data:
            continue

        if first_time is None:
            first_time = data["time_us"]

        # Log data
        log_fp.write("{},{},{},{}\n".format(data["time_us"], data["ssim"], data["psnr"], data["sse"]))

        elapsed_time = data["time_us"] - first_time
        elapsed_time_ms = elapsed_time / 1000
        print("Elapsed time: {} ms".format(elapsed_time_ms))

        if elapsed_time_ms > (30 * 1000):
            log_fp.close()
            PC.STATUS = Status.ABORTED
            time.sleep(1)
            exit(0)

        time.sleep(0.1)