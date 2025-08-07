import asyncio
import os
import re

import httpx
from prometheus_client import Gauge, start_http_server

LIVEKIT_METRICS_URL = os.getenv("LIVEKIT_METRICS_URL", "http://livekit:7880/metrics")

latency_ms = Gauge("livekit_latency_ms", "LiveKit average round trip time in ms")
packet_loss = Gauge("livekit_packet_loss", "LiveKit packet loss percentage")


async def _poll_metrics():
    pattern_latency = re.compile(r"livekit_.*rtt_seconds")
    pattern_packet = re.compile(r"livekit_.*packet_loss_percent")
    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(LIVEKIT_METRICS_URL, timeout=5)
                text = resp.text.splitlines()
                for line in text:
                    if pattern_latency.match(line) and not line.startswith("#"):
                        value = float(line.split()[-1]) * 1000
                        latency_ms.set(value)
                    if pattern_packet.match(line) and not line.startswith("#"):
                        value = float(line.split()[-1])
                        packet_loss.set(value)
            except Exception:
                pass
            await asyncio.sleep(5)


def start_collector():
    if getattr(start_collector, "_started", False):
        return
    start_http_server(8001)
    asyncio.create_task(_poll_metrics())
    start_collector._started = True
