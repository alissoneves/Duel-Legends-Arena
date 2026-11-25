# Trilha dos reels de recurso (feature.mjs): música chiptune contínua + efeitos nos cortes e toques.
# Uso: python3 som_feat.py <video.mp4> <semente>
#   lê <video.mp4>.mudo.mp4 e <video.mp4>.json, grava <video.mp4> com som (AAC estéreo).
import json, os, subprocess, sys, wave
import numpy as np

vid, seed = sys.argv[1], int(sys.argv[2])
J = json.load(open(vid + '.json'))
FPS, SR = J['fps'], 44100
dur = J['total'] / FPS
N = int(dur * SR) + SR
rng = np.random.default_rng(seed)
t_ev = {}
for e in J['ev']:
    t_ev.setdefault(e['t'], []).append(e)
T = lambda nome: t_ev[nome][0]['f'] / FPS
tCard = T('card')

musL = np.zeros(N); musR = np.zeros(N); fx = np.zeros(N)
nota = lambda m: 440 * 2 ** ((m - 69) / 12)
def sq(f, t, d=0.5): return np.where((t * f) % 1 < d, 1.0, -1.0)
def tri(f, t): return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1
def saw(f, t): return 2 * ((t * f) % 1) - 1
def ruido(n): return rng.uniform(-1, 1, n)
def lp(sig, a):  # passa-baixa de 1 polo
    out = np.empty_like(sig); acc = 0.0; a = np.broadcast_to(np.asarray(a, float), sig.shape)
    for i in range(len(sig)): acc += a[i] * (sig[i] - acc); out[i] = acc
    return out
def env_ad(n, atk, comp, curva=4.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(atk, 1e-4)) * np.exp(-t * curva / comp)
def put(buf, ini, sig, vol=1.0):
    i = int(ini * SR)
    if i < 0: sig = sig[-i:]; i = 0
    j = min(len(buf), i + len(sig))
    if j > i: buf[i:j] += sig[:j - i] * vol
def tom(fn, comp, atk=0.004, curva=4.0):
    n = int(comp * SR); t = np.arange(n) / SR
    return fn(t) * env_ad(n, atk, comp, curva)

# ---------------- música ----------------
PROGS = [[(57, (57, 60, 64)), (53, (53, 57, 60)), (48, (48, 52, 55)), (55, (55, 59, 62))],   # Am F C G
         [(50, (50, 53, 57)), (46, (46, 50, 53)), (48, (48, 52, 55)), (45, (45, 49, 52))],   # Dm Bb C A
         [(52, (52, 55, 59)), (48, (48, 52, 55)), (50, (50, 54, 57)), (47, (47, 51, 54))],   # Em C D B
         [(45, (45, 48, 52)), (41, (41, 45, 48)), (43, (43, 47, 50)), (40, (40, 44, 47))]]   # Am F G E
prog = PROGS[seed % 4]
BPM = 150; b = 60 / BPM; step = b / 4
# riffs de melodia (graus do acorde: 0,1,2 = notas; 3 = oitava da fundamental)
RIFFS = [[0, None, 2, 1, 0, 2, None, 3, 2, None, 1, 2, 3, None, 2, 1],
         [3, 2, None, 0, 2, None, 1, 2, 0, None, 2, 3, None, 2, 1, None]]
riff = RIFFS[seed % 2]
def drums(t0, nbar, forte=True):
    for k in range(nbar * 16):
        tt = t0 + k * step
        if tt >= tCard - 0.02: return
        if k % 4 == 0:  # bumbo
            put(musL, tt, tom(lambda t: np.sin(2 * np.pi * (55 + 120 * np.exp(-t * 35)) * t), 0.22, 0.001, 5), 0.55)
        if k % 8 == 4:  # caixa
            put(musL, tt, tom(lambda t: ruido(len(t)) * 0.7 + np.sin(2 * np.pi * 190 * t) * 0.4, 0.16, 0.001, 6), 0.28)
        if forte and k % 2 == 1:  # chimbal
            put(musL, tt, tom(lambda t: ruido(len(t)), 0.035, 0.0005, 5), 0.07)
def secao(t0, t1, cheio=True):
    k = 0; tt = t0
    while tt < t1 - 0.01:
        root, ch = prog[k % 4]
        for s in range(16):
            ts = tt + s * step
            if ts >= t1: break
            # baixo pulsante (colcheias) com saw filtrada
            if s % 2 == 0:
                m = root - 12 + (12 if s % 4 == 2 else 0)
                put(musL, ts, tom(lambda t, f=nota(m): saw(f, t) * 0.6 + sq(f, t, 0.5) * 0.4, step * 1.9, 0.002, 2.5), 0.16)
            # arpejo
            if cheio:
                put(musR, ts, tom(lambda t, f=nota(ch[s % 3] + 24): sq(f, t, 0.25), step * 0.9, 0.001, 3), 0.045)
            # melodia
            g = riff[s]
            if cheio and g is not None:
                m = (ch[g] if g < 3 else ch[0] + 12) + 12
                sig = tom(lambda t, f=nota(m): (sq(f, t, 0.5) + sq(f * 1.005, t, 0.5)) * 0.5 * (1 + 0.15 * np.sin(2 * np.pi * 6 * t)), step * 1.8, 0.003, 2)
                put(musL, ts, sig, 0.05); put(musR, ts + 0.012, sig, 0.05)
        k += 1; tt += 16 * step
T0 = T('impacto')
secao(0.0, T0, cheio=False)
secao(T0, tCard, cheio=True)
drums(T0, 40)
root = prog[0][0] + 12
for m in (0, 4, 7, 12):
    s2 = tom(lambda t, f=nota(root + 3 + m): (sq(f, t, 0.25) * 0.4 + tri(f, t) * 0.6) * (1 + 0.2 * np.sin(2 * np.pi * 5 * t)), dur - tCard + 0.2, 0.02, 1.4)
    put(musL, tCard, s2, 0.06); put(musR, tCard + 0.01, s2, 0.06)

# ---------------- efeitos ----------------
def boom(t0, vol, grave=50):
    put(fx, t0, tom(lambda t: np.sin(2 * np.pi * (grave + 160 * np.exp(-t * 18)) * t), 0.9, 0.001, 5), vol)
    nb = int(0.7 * SR); put(fx, t0, lp(ruido(nb), 0.15) * env_ad(nb, 0.001, 0.7, 6), vol * 0.9)
def whoosh(t0, comp, vol):
    nb = int(comp * SR); tt = np.arange(nb) / SR
    sig = lp(ruido(nb), 0.08 + 0.3 * (tt / comp)) * np.sin(np.pi * tt / comp) ** 2
    put(fx, t0, sig, vol)
def soco(t0, vol, tom_):
    put(fx, t0, tom(lambda t: np.sin(2 * np.pi * (tom_ * 0.5 + tom_ * np.exp(-t * 40)) * t), 0.16, 0.0005, 5), vol)
    nb = int(0.09 * SR); put(fx, t0, lp(ruido(nb), 0.35) * env_ad(nb, 0.0005, 0.09, 5), vol * 0.8)
    put(fx, t0, tom(lambda t: sq(tom_ * 2.2, t, 0.3), 0.03, 0.0005, 6), vol * 0.25)


whoosh(0.0, 0.25, 0.35)
boom(T0, 0.9)
put(fx, T0, tom(lambda t: ruido(len(t)), 1.4, 0.001, 4), 0.12)
for e in t_ev.get('cena', []):
    whoosh(e['f'] / FPS - 0.18, 0.3, 0.4)
for e in t_ev.get('toque', []):
    tt = e['f'] / FPS
    put(fx, tt, tom(lambda t: np.sin(2 * np.pi * (1200 + 900 * np.exp(-t * 60)) * t), 0.06, 0.0005, 5), 0.35)
    put(fx, tt + 0.03, tom(lambda t: sq(nota(84), t, 0.25), 0.1, 0.001, 4), 0.12)
whoosh(tCard - 0.15, 0.3, 0.3)
put(fx, tCard + 0.05, tom(lambda t: np.sin(2 * np.pi * (60 + 140 * np.exp(-t * 20)) * t), 0.5, 0.001, 5), 0.6)
for k in range(7):
    put(fx, tCard + 0.35 + k * 0.06, tom(lambda t, f=nota(96 + k * 2): sq(f, t, 0.125), 0.18, 0.001, 3), 0.05)

# ---------------- mix ----------------
# abaixa a música nos golpes (sidechain) e no K.O.
duck = np.ones(N)
for e in t_ev.get('hit', []):
    i = int(e['f'] / FPS * SR); duck[i:i + int(0.12 * SR)] *= 0.6
duck = np.convolve(duck, np.ones(600) / 600, 'same')
L = musL * duck + musR * duck * 0.55 + fx
R_ = musR * duck + musL * duck * 0.55 + fx
m = max(np.max(np.abs(L)), np.max(np.abs(R_)))
L, R_ = np.tanh(L / m * 1.6) / np.tanh(1.6), np.tanh(R_ / m * 1.6) / np.tanh(1.6)
k = int(dur * SR); L, R_ = L[:k] * 0.9, R_[:k] * 0.9
fo = int(0.5 * SR); L[-fo:] *= np.linspace(1, 0, fo); R_[-fo:] *= np.linspace(1, 0, fo)
st = np.stack([L, R_], 1)
wav = vid + '.wav'
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', vid + '.mudo.mp4', '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', '44100', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', vid + '.tmp.mp4'])
os.remove(wav)
if r.returncode == 0:
    os.replace(vid + '.tmp.mp4', vid); print('Pronto com som:', vid)
else:
    sys.exit('ffmpeg falhou')
