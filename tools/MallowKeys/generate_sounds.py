#!/usr/bin/env python3
"""Generate the five MallowKeys switch sounds.

The WAVs are intentionally small, mono, 44.1 kHz, and varied so rapid typing
does not sound like a single sample looping.

Usage:
  python generate_sounds.py [output-directory]
"""

from __future__ import annotations

import math
import os
import random
import sys
import wave

import numpy as np

SR = 48000


def one_pole_lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    alpha = 1.0 - math.exp(-2.0 * math.pi * max(20.0, cutoff) / SR)
    y = np.empty_like(x)
    last = 0.0
    for i, sample in enumerate(x):
        last += alpha * (sample - last)
        y[i] = last
    return y


def one_pole_highpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    return x - one_pole_lowpass(x, cutoff)


def biquad_bandpass(x: np.ndarray, freq: float, q: float) -> np.ndarray:
    w0 = 2.0 * math.pi * freq / SR
    alpha = math.sin(w0) / (2.0 * max(0.2, q))
    cos_w0 = math.cos(w0)
    b0 = alpha
    b1 = 0.0
    b2 = -alpha
    a0 = 1.0 + alpha
    a1 = -2.0 * cos_w0
    a2 = 1.0 - alpha
    b0 /= a0
    b1 /= a0
    b2 /= a0
    a1 /= a0
    a2 /= a0
    y = np.empty_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, sample in enumerate(x):
        out = b0 * sample + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1 = x1, sample
        y2, y1 = y1, out
        y[i] = out
    return y


def body_tone(n: int, f0: float, f1: float, decay: float, glide: float, amplitude: float) -> np.ndarray:
    t = np.arange(n, dtype=np.float64) / SR
    freq = f0 + (f1 - f0) * (1.0 - np.exp(-t / max(0.001, glide)))
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    env = np.exp(-t / decay)
    return np.sin(phase) * env * amplitude


def noise_burst(n: int, decay: float, amplitude: float, rng: random.Random) -> np.ndarray:
    t = np.arange(n, dtype=np.float64) / SR
    noise = np.array([rng.gauss(0.0, 1.0) for _ in range(n)], dtype=np.float64)
    return noise * np.exp(-t / decay) * amplitude


def attack_fade(signal: np.ndarray, attack: float = 0.0008, release: float = 0.02) -> np.ndarray:
    n = len(signal)
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    env = np.ones(n)
    env[:a] = np.linspace(0.0, 1.0, a)
    env[-r:] *= np.linspace(1.0, 0.0, r)
    return signal * env


def normalize(signal: np.ndarray, peak: float = 0.82) -> np.ndarray:
    maximum = float(np.max(np.abs(signal)))
    if maximum < 1e-9:
        return signal
    return signal / maximum * peak


def make_red(rng: random.Random) -> np.ndarray:
    duration = 0.235
    n = int(SR * duration)
    detune = rng.uniform(0.92, 1.08)
    f0 = rng.uniform(100.0, 122.0) * detune
    body = body_tone(n, f0, f0 * 0.52, 0.085, 0.012, 0.72)
    noise = noise_burst(n, 0.045, 0.55, rng)
    noise = one_pole_lowpass(noise, rng.uniform(420.0, 620.0))
    knock = noise_burst(n, 0.018, 0.22, rng)
    knock = biquad_bandpass(knock, rng.uniform(700.0, 1000.0), 0.8)
    mix = body + noise * 0.62 + knock * 0.22
    return attack_fade(normalize(mix))


def make_brown(rng: random.Random) -> np.ndarray:
    duration = 0.21
    n = int(SR * duration)
    detune = rng.uniform(0.94, 1.06)
    f0 = rng.uniform(132.0, 156.0) * detune
    body = body_tone(n, f0, f0 * 0.55, 0.062, 0.008, 0.64)
    noise = noise_burst(n, 0.038, 0.58, rng)
    noise = one_pole_lowpass(noise, rng.uniform(720.0, 980.0))
    snap = noise_burst(n, 0.024, 0.34, rng)
    snap = biquad_bandpass(snap, rng.uniform(1250.0, 1750.0), 1.4)
    snap = np.roll(snap, int(SR * rng.uniform(0.004, 0.009)))
    snap[: int(SR * 0.004)] = 0.0
    mix = body + noise * 0.52 + snap * 0.28
    return attack_fade(normalize(mix))


def make_blue(rng: random.Random) -> np.ndarray:
    duration = 0.17
    n = int(SR * duration)
    detune = rng.uniform(0.93, 1.07)
    click = noise_burst(n, 0.012, 0.9, rng)
    click = biquad_bandpass(click, rng.uniform(2800.0, 4100.0), 0.9)
    high = noise_burst(n, 0.018, 0.38, rng)
    high = one_pole_highpass(high, rng.uniform(3800.0, 5400.0))
    ping_freq = rng.uniform(3100.0, 3700.0) * detune
    t = np.arange(n, dtype=np.float64) / SR
    ping = np.sin(2.0 * np.pi * ping_freq * t) * np.exp(-t / 0.032) * 0.22
    body = body_tone(n, 180.0 * detune, 105.0 * detune, 0.03, 0.006, 0.23)
    mix = click * 0.75 + high * 0.28 + ping + body
    return attack_fade(normalize(mix, 0.72), attack=0.0005, release=0.012)


def make_thock(rng: random.Random) -> np.ndarray:
    duration = 0.27
    n = int(SR * duration)
    detune = rng.uniform(0.94, 1.05)
    f0 = rng.uniform(88.0, 108.0) * detune
    body = body_tone(n, f0, f0 * 0.48, 0.105, 0.016, 0.78)
    sub = body_tone(n, f0 * 0.5, f0 * 0.34, 0.12, 0.02, 0.25)
    noise = noise_burst(n, 0.05, 0.5, rng)
    noise = one_pole_lowpass(noise, rng.uniform(330.0, 470.0))
    mix = body + sub + noise * 0.55
    return attack_fade(normalize(mix, 0.78))


def make_clack(rng: random.Random) -> np.ndarray:
    duration = 0.14
    n = int(SR * duration)
    detune = rng.uniform(0.94, 1.06)
    noise = noise_burst(n, 0.022, 0.8, rng)
    noise = biquad_bandpass(noise, rng.uniform(1800.0, 2400.0), 1.1)
    high = noise_burst(n, 0.008, 0.28, rng)
    high = one_pole_highpass(high, 3300.0)
    t = np.arange(n, dtype=np.float64) / SR
    ping = np.sin(2.0 * np.pi * rng.uniform(3900.0, 4700.0) * t) * np.exp(-t / 0.012) * 0.16
    body = body_tone(n, 240.0 * detune, 140.0 * detune, 0.026, 0.004, 0.25)
    mix = noise * 0.9 + high * 0.24 + ping + body
    return attack_fade(normalize(mix, 0.76), attack=0.0005, release=0.01)


GENERATORS = {
    "red": make_red,
    "brown": make_brown,
    "blue": make_blue,
    "thock": make_thock,
    "clack": make_clack,
}


def write_wav(path: str, signal: np.ndarray) -> None:
    pcm = np.clip(signal, -1.0, 1.0)
    pcm = (pcm * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(pcm.tobytes())


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "sounds")
    os.makedirs(out, exist_ok=True)
    master = random.Random(680068)
    for mode, generator in GENERATORS.items():
        for variant in range(1, 5):
            rng = random.Random(master.randint(0, 2**31 - 1))
            signal = generator(rng)
            path = os.path.join(out, "{0}-{1}.wav".format(mode, variant))
            write_wav(path, signal)
            print("wrote", path, "{0:.0f} ms".format(len(signal) / SR * 1000))


if __name__ == "__main__":
    main()
