from datetime import date, datetime, time, timedelta, timezone

# Aplikasi memakai WIB (UTC+7) sebagai acuan "hari": jadwal praktik psikolog,
# batas 1 check-in mood per hari, dsb. Offset tetap (Indonesia tidak memakai DST),
# jadi tidak perlu database zona waktu (tzdata) di Windows.
WIB = timezone(timedelta(hours=7), "WIB")


def today_wib() -> date:
    return datetime.now(WIB).date()


def wib_day_bounds(start: date, end: date | None = None) -> tuple[str, str]:
    """Rentang [00:00 WIB `start`, 00:00 WIB hari setelah `end`) dalam ISO-8601."""
    end = end or start
    lower = datetime.combine(start, time.min, tzinfo=WIB)
    upper = datetime.combine(end + timedelta(days=1), time.min, tzinfo=WIB)
    return lower.isoformat(), upper.isoformat()
