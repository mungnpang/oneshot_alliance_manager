import hashlib
import time

import httpx

from app.core.exceptions import KingshotAPIException

_KINGSHOT_API_URL = "https://kingshot-giftcode.centurygame.com/api/player"
_SECRET = "mN4!pQs6JrYwV9"


def _generate_sign(fid: int, time_ms: int) -> str:
    raw = f"fid={fid}&time={time_ms}{_SECRET}"
    return hashlib.md5(raw.encode()).hexdigest()


async def fetch_player(fid: int) -> dict:
    time_ms = int(time.time() * 1000)
    sign = _generate_sign(fid, time_ms)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                _KINGSHOT_API_URL,
                data={"fid": fid, "time": time_ms, "sign": sign},
            )
            resp.raise_for_status()
            body = resp.json()
    except httpx.HTTPError as e:
        raise KingshotAPIException(f"Kingshot API network error: {e}") from e

    if body.get("code") != 0:
        raise KingshotAPIException(f"Kingshot API error (code={body.get('code')}): fid={fid} user not found")

    return body["data"]
