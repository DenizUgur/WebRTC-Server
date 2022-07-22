import json
import asyncio
import threading
from enum import Enum
from websockets import connect


class Status(Enum):
    OK = 0
    ERROR = 1
    STOPPED = 2


class ProxyConnection:

    STATUS = Status.STOPPED

    def __init__(self, host, port, frequency):
        self.host = host
        self.port = port
        self.frequency = frequency
        self.uri = "ws://{}:{}/proxy/peer".format(host, port)

        # Payload
        self.payload_send = None
        self.payload_recv = None

        loop = asyncio.get_event_loop()
        t = threading.Thread(target=self.loop_in_thread, args=(loop,))
        t.start()

    def send(self, payload):
        self.payload_send = payload

    def read(self):
        return self.payload_recv

    @asyncio.coroutine
    async def main(self):
        try:
            async with connect(self.uri) as websocket:
                ProxyConnection.STATUS = Status.OK

                if self.payload_send is not None:
                    await websocket.send(json.dumps(self.payload_send))
                    self.payload_recv = json.loads(await websocket.recv())
                    self.payload_send = None

                await asyncio.sleep(self.frequency)
                await self.main()
        except:
            ProxyConnection.STATUS = Status.ERROR
        finally:
            ProxyConnection.STATUS = Status.STOPPED

    def loop_in_thread(self, loop):
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.main())
