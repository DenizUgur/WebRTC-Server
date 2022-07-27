import json
import signal
import asyncio
import threading
from enum import Enum
from websockets import connect


class Status(Enum):
    OK = 0
    ERROR = 1
    STOPPED = 2
    ABORTED = 3


class ProxyConnection:

    STATUS = Status.STOPPED

    def __init__(self, host, port, frequency):
        self.host = host
        self.port = port
        self.frequency = frequency
        self.uri = "ws://{}:{}/proxy/peer".format(host, port)

        # Payload
        self.payload_send = {}
        self.payload_recv = {}

        loop = asyncio.get_event_loop()
        t = threading.Thread(target=self.loop_in_thread, args=(loop,))
        t.start()

        signal.signal(signal.SIGINT, self.signal_handler)

    def signal_handler(self, signal, frame):
        self.STATUS = Status.ABORTED
        exit(0)

    def send(self, payload):
        self.payload_send = payload

    def read(self):
        return self.payload_recv

    @asyncio.coroutine
    async def main(self):
        try:
            if self.STATUS == Status.ABORTED:
                return

            async with connect(self.uri) as websocket:
                ProxyConnection.STATUS = Status.OK

                await websocket.send(json.dumps(self.payload_send))
                self.payload_recv = json.loads(await websocket.recv())
                self.payload_send = {}

                await asyncio.sleep(self.frequency)
                await self.main()
        except:
            ProxyConnection.STATUS = Status.ERROR
        finally:
            ProxyConnection.STATUS = Status.STOPPED

    def loop_in_thread(self, loop):
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.main())
