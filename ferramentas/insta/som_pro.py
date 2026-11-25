# Trilha do reel "Lenda do Dia" (versão pro): música chiptune + efeitos sincronizados pelos eventos do reel.mjs.
# Uso: python3 som_pro.py <video.mp4> <semente>
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
tLuta, tKO, tVit, tCard = T('luta'), T('ko'), T('vitoria'), T('card')

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
        if tt >= tKO - 0.02: return
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
# gancho: só baixo + riser; luta: tudo
secao(0.0, tLuta, cheio=False)
secao(tLuta, tKO, cheio=True)
drums(tLuta, 40)
# riser antes do K.O.
n = int(1.6 * SR); t = np.arange(n) / SR
riser = (ruido(n) * 0.5 + sq(200 * 2 ** (t / 1.6 * 2), t, 0.5) * 0.15) * (t / 1.6) ** 2
put(fx, tKO - 1.6, riser, 0.25)
# vitória: fanfarra
root = prog[0][0] + 12
FAN = [(0, 0, .12), (.12, 4, .12), (.24, 7, .12), (.36, 12, .55), (.95, 7, .12), (1.07, 12, .7)]
for dt, iv, c in FAN:
    for d, v in ((0, 0.11), (0.012, 0.08)):
        put(musL if d == 0 else musR, tVit + dt + d, tom(lambda t, f=nota(root + 3 + iv): sq(f, t, 0.5), c, 0.003, 1.6), v)
    put(musL, tVit + dt, tom(lambda t, f=nota(root - 9 + iv): tri(f, t), c, 0.003, 1.6), 0.2)
# card: acorde brilhante sustentado + batida leve
for m in (0, 4, 7, 12):
    s2 = tom(lambda t, f=nota(root + 3 + m): (sq(f, t, 0.25) * 0.4 + tri(f, t) * 0.6) * (1 + 0.2 * np.sin(2 * np.pi * 5 * t)), dur - tCard + 0.2, 0.02, 1.4)
    put(musL, tCard, s2, 0.05); put(musR, tCard + 0.01, s2, 0.05)

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
boom(T('impacto'), 0.9)
put(fx, T('impacto'), tom(lambda t: ruido(len(t)), 1.4, 0.001, 4), 0.12)  # prato
whoosh(tLuta - 0.2, 0.3, 0.4)
combo, ult = 0, -9
for e in t_ev.get('hit', []):
    tt = e['f'] / FPS
    if e['lado'] == 'B':
        combo = combo + 1 if tt - ult < 0.6 else 1; ult = tt
        soco(tt, min(0.75, 0.38 + e['d'] / 300), 180 * (1 + 0.08 * min(combo - 1, 5)))
    else:
        soco(tt, 0.3, 110)
for e in t_ev.get('golpe', []):
    whoosh(e['f'] / FPS - 0.05, 0.22, 0.3)
boom(tKO, 1.2, 40)
for d, v in ((0.25, 0.4), (0.5, 0.2), (0.75, 0.1)):  # eco do K.O.
    boom(tKO + d, v, 40)
whoosh(tCard - 0.15, 0.3, 0.3)
for k in range(7):  # brilho do card
    put(fx, tCard + 0.35 + k * 0.06, tom(lambda t, f=nota(96 + k * 2): sq(f, t, 0.125), 0.18, 0.001, 3), 0.05)
put(fx, tCard + 14 / FPS, tom(lambda t: np.sin(2 * np.pi * (700 + 500 * np.exp(-t * 30)) * t), 0.12, 0.001, 4), 0.25)  # "pop" do botão

# ---------------- mix ----------------
# abaixa a música nos golpes (sidechain) e no K.O.
duck = np.ones(N)
for e in t_ev.get('hit', []):
    i = int(e['f'] / FPS * SR); duck[i:i + int(0.12 * SR)] *= 0.6
i0, i1 = int((tKO - 0.03) * SR), int(tVit * SR); duck[i0:i1] = 0.0
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
