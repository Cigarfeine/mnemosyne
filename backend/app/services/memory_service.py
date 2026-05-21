from datetime import datetime, timedelta
import math


def sm2_update(ease_factor: float, interval: int, repetitions: int, quality: int):
    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        repetitions += 1

    new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)

    return new_ef, interval, repetitions


def calculate_retention(ease_factor: float, interval: int, days_since_review: float) -> float:
    if days_since_review <= 0:
        return 1.0
    memory_strength = interval * ease_factor
    retention = math.exp(-days_since_review / memory_strength)
    return max(0.0, min(1.0, retention))


def get_review_priority(retention: float, difficulty: int) -> float:
    urgency = 1.0 - retention
    difficulty_weight = difficulty / 5.0
    return urgency * 0.7 + difficulty_weight * 0.3
