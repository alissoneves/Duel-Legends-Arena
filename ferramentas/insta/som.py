# Coloca música chiptune + efeitos sonoros num reel da Lenda do Dia.
# Vídeos do confronto/recurso (final com logo): passe 66 como 4º argumento.
# Uso: python3 som.py <video.mp4> <semente> <saida.mp4>
# Os golpes e o nocaute são lidos das barras de vida do próprio vídeo.
import subprocess, sys, wave, numpy as np

vid, seed, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
SR = 44100; FPS = 30
rng = np.random.default_rng(seed)

# ---------- eventos a partir das barras de vida ----------
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', vid, '-vf', 'crop=1080:2:0:338', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.uint8).reshape(-1, 2, 1080, 3)[:, 0].astype(int)
nf = len(a); dur = nf / FPS
cor = (a.max(2) - a.min(2)) > 60
hpA = cor[:, 196:496].sum(1); hpB = cor[:, 584:884].sum(1)
INTRO, FINAL, VIT = 48, (int(sys.argv[4]) if len(sys.argv) > 4 else 78), 42
fimLuta = nf - FINAL - VIT
hits = []  # (tempo, lado que apanhou)
for i in range(INTRO + 3, fimLuta):
    for lado, hp in (('A', hpA), ('B', hpB)):
        if hp[i - 1] - hp[i] >= 1 and hp[i - 2] - hp[i - 1] < 1 and hp[i - 3] - hp[i - 2] < 1 and hp[i - 1] > 0: hits.append((i / FPS, lado))
ko = next((i for i in range(INTRO, fimLuta) if (hpB[i] == 0 and hpB[i - 1] > 0) or (hpA[i] == 0 and hpA[i - 1] > 0)), fimLuta - 30)
tKO, tVit, tFim = ko / FPS, fimLuta / FPS, (nf - FINAL) / FPS

n = int(SR * dur) + SR
mus = np.zeros(n); sfx = np.zeros(n)
def nota(m): return 440 * 2 ** ((m - 69) / 12)
def sq(f, t, d=0.5): return np.where((t * f) % 1 < d, 1.0, -1.0)
def tri(f, t): return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1
def ruido(L): return rng.uniform(-1, 1, L)
def add(buf, ini, comp, fn, vol, dec=3.0):
    i = int(ini * SR); j = min(n, i + int(comp * SR))
    if i >= n or j <= i: return
    t = np.arange(j - i) / SR; env = np.minimum(1, t / 0.004) * np.exp(-t * dec / comp)
    buf[i:j] += fn(t) * env * vol

# ---------- música (varia por lenda) ----------
PROGS = [[(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])],   # Am F C G
         [(50, [50, 53, 57]), (46, [46, 50, 53]), (48, [48, 52, 55]), (45, [45, 49, 52])],   # Dm Bb C A
         [(52, [52, 55, 59]), (48, [48, 52, 55]), (50, [50, 54, 57]), (47, [47, 51, 54])],   # Em C D B
         [(48, [48, 52, 55]), (55, [55, 59, 62]), (57, [57, 60, 64]), (53, [53, 57, 60])]]   # C G Am F
prog = PROGS[seed % 4]; tr = int(rng.integers(-2, 3))
BPM = [150, 160, 144, 156][seed % 4]; b = 60 / BPM; bar = 4 * b
escala = sorted({(x - prog[0][0]) % 12 for _, c in prog for x in c})
def frase_lead():
    m, notas = 0, []
    for _ in range(8): m = max(-3, min(9, m + int(rng.choice([-2, -1, 1, 2, 3])))); notas.append(m)
    return notas
lead = [frase_lead() for _ in range(2)]
k = 0; t0 = 0.0
while t0 < tFim:
    root, ch = prog[k % 4]; root += tr; ch = [c + tr for c in ch]
    for i in range(8):  # baixo
        add(mus, t0 + i * b / 2, b / 2 * 0.9, lambda t, f=nota(root - 12 + (12 if i % 2 else 0)): tri(f, t), 0.22, 1.5)
    if t0 > 1.5:
        for i in range(16):  # arpejo
            add(mus, t0 + i * b / 4, b / 4 * 0.85, lambda t, f=nota(ch[i % 3] + 12): sq(f, t, 0.25), 0.035)
        fr = lead[(k // 2) % 2]
        for i in range(8):  # melodia
            v = abs(fr[i]); m = ch[v % 3] + 12 * (1 + (v // 3) % 2)
            if rng.random() < 0.85: add(mus, t0 + i * b / 2, b / 2 * 0.8, lambda t, f=nota(m): sq(f, t, 0.5) * 0.6 + sq(f * 1.004, t, 0.5) * 0.4, 0.045, 2.0)
    for i in range(4):  # bateria
        tb = t0 + i * b
        add(mus, tb, 0.12, lambda t: np.sin(2 * np.pi * (130 * np.exp(-t * 28) + 45) * t), 0.4)
        if i % 2: add(mus, tb, 0.1, lambda t: ruido(len(t)), 0.13)
        add(mus, tb + b / 2, 0.03, lambda t: ruido(len(t)), 0.05)
    k += 1; t0 += bar
# câmera lenta: música abafada e baixa perto do nocaute
env = np.ones(n); a0, a1 = int((tKO - 1.3) * SR), int((tKO + 0.8) * SR)
env[max(0, a0):a1] = 0.35; env[int(tVit * SR):] = 0
from numpy.lib.stride_tricks import sliding_window_view as _sw
sm = np.convolve(env, np.ones(2000) / 2000, 'same'); mus *= sm

# ---------- efeitos ----------
# abertura: whoosh dos lutadores + impacto do VS
L = int(0.5 * SR); w = np.convolve(ruido(L), np.ones(8) / 8, 'same') * np.linspace(0, 1, L) ** 2; sfx[int(0.05 * SR):int(0.05 * SR) + L] += w * 0.5
add(sfx, 0.56, 0.5, lambda t: np.sin(2 * np.pi * (150 * np.exp(-t * 10) + 40) * t), 0.7)
add(sfx, 0.56, 0.9, lambda t: ruido(len(t)) * 0.6 + sq(nota(76), t) * 0.4, 0.18)
# golpes
ult = -1
for t, lado in hits:
    if t - ult < 0.16: continue
    ult = t; p = rng.uniform(0.85, 1.2)
    if lado == 'B':  # a lenda acerta: soco agudo
        add(sfx, t, 0.09, lambda tt, p=p: np.sin(2 * np.pi * (520 * p * np.exp(-tt * 30) + 90) * tt) * 0.7 + ruido(len(tt)) * 0.3, 0.32)
    else:            # a lenda apanha: baque grave
        add(sfx, t, 0.12, lambda tt, p=p: sq(170 * p * np.exp(-tt * 12) + 50, tt) * 0.5 + ruido(len(tt)) * 0.5, 0.22)
# nocaute: estouro + eco
for d, v in ((0, 0.9), (0.18, 0.35), (0.36, 0.15)):
    add(sfx, tKO + d, 0.7, lambda t: np.sin(2 * np.pi * (110 * np.exp(-t * 6) + 35) * t) * 0.6 + ruido(len(t)) * 0.4, v)
# vitória: jingle
J = [(0, 72, .12), (.12, 76, .12), (.24, 79, .12), (.36, 84, .5)]
for dt, m, c in J:
    add(sfx, tVit + dt, c, lambda t, f=nota(m + tr): sq(f, t, 0.5), 0.13, 1.5)
    add(sfx, tVit + dt, c, lambda t, f=nota(m + tr - 12): tri(f, t), 0.2, 1.5)
# card final: acorde brilhante + brilho
for m in (72, 76, 79, 84):
    add(sfx, tFim, 2.2, lambda t, f=nota(m + tr): sq(f, t, 0.25) * 0.5 + tri(f, t) * 0.5, 0.06, 2.5)
for i in range(6):
    add(sfx, tFim + 0.05 + i * 0.07, 0.15, lambda t, f=nota(96 + i * 2): sq(f, t, 0.125), 0.04)

mix = mus * 0.8 + sfx
mix = mix[:int(dur * SR)]
fo = int(0.6 * SR); mix[-fo:] *= np.linspace(1, 0, fo)
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.3) * 0.85
wav = out + '.wav'
with wave.open(wav, 'wb') as wv:
    wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((mix * 32767).astype(np.int16).tobytes())
r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', vid, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out + '.tmp.mp4'])
import os
if r.returncode == 0: os.replace(out + '.tmp.mp4', out)
os.remove(wav)
print(vid.split('/')[-1], f'golpes={len(hits)} ko={tKO:.1f}s vit={tVit:.1f}s fim={tFim:.1f}s', 'ok' if r.returncode == 0 else 'FALHA')
