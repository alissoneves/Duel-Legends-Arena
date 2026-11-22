extends Node2D
## Duel Legends Arena — base do jogo (porte do protótipo web para o Godot 4).
## Tudo é desenhado em _draw() numa tela de 480 x 270, ampliada sem borrar.
## Estados: title -> draw (sorteio) -> countdown -> fight -> result.

const Sprites = preload("res://scripts/sprites.gd")
const Items = preload("res://scripts/items.gd")
const Ranked = preload("res://scripts/ranked.gd")

const W := 480.0
const H := 270.0
# limites da arena: mudam a cada partida (o mapa é maior que a tela; a câmera segue o jogador)
var BX1 := 12.0
var BY1 := 40.0
var BX2 := 468.0
var BY2 := 262.0
var WW := 480.0
var WH := 270.0
const WORLD := {"1x1": [720, 420], "2x2": [800, 460], "3x3": [820, 480], "5x5": [920, 540], "ffa": [920, 540]}
var cam := Vector2.ZERO
var xf_base := Transform2D.IDENTITY

# ---------- BALANCEAMENTO (valores da simulação de 8.640 lutas) ----------
const BAL := {
	# ritmo (mais lento que a primeira versão) e equilíbrio corpo a corpo x distância (simulação v0.4.1)
	"move": 0.75, "proj": 0.72, "atk_rate": 0.72, "b_rate": 0.8, "charge_rate": 0.8, "react": 1.3,
	"fire_slow": [0.28, 0.68], "melee_dash": [80.0, 0.7], "melee_proj": 0.88, "stick": [0.35, 0.78],
	"melee_mul": 1.3, "melee_range": 5.0, "lunge": 100.0, "melee_speed": 1.15,
	"proj_near": 0.8, "proj_far": 0.65, "heal_c": 150, "buff_b": 50, "drain": 0.85, "gap_dash": 0.04,
}

# multiplicador por personagem (ajuste fino da simulação)
const TUNE := {"Apolo": 0.8, "Fênix": 0.85, "Rainha da Neve": 0.9, "Rei Arthur": 0.93, "Kraken": 0.95, "Saci": 0.92, "Lobisomem": 0.93, "Gênio da Lâmpada": 0.93, "Guardiã Celestial": 0.93, "Valquíria": 1.1, "Árvore Ancestral": 1.1, "Sherlock Holmes": 1.12, "Drácula": 1.1, "Merlin": 1.18, "Rasga-Mortalha": 1.12, "Benzedeira": 1.15, "Mecânica Engenhoca": 1.18, "Mímico": 1.1}

# ---------- MODOS E RANQUEADA ----------
const MODES := {"1x1": [1, "Duelo 1x1"], "2x2": [2, "Duplas 2x2"], "3x3": [3, "Trios 3x3"], "5x5": [5, "Equipes 5x5"], "ffa": [6, "Todos contra todos"]}
const ROUNDS := ["Oitavas de final", "Quartas de final", "Semifinal", "Final"]

# ---------- ELEMENTOS ----------
const STRONG := {
	"Fogo": ["Gelo", "Natureza", "Vampiro"], "Água": ["Fogo", "Terra", "Máquina"], "Gelo": ["Água", "Terra"],
	"Elétrico": ["Água", "Máquina"], "Natureza": ["Água", "Terra"], "Terra": ["Fogo", "Elétrico"],
	"Luz": ["Trevas", "Vampiro"], "Trevas": ["Luz", "Humano", "Elfo"], "Humano": ["Elfo", "Elétrico"],
	"Vampiro": ["Humano", "Natureza"], "Elfo": ["Vampiro", "Máquina"], "Máquina": ["Gelo", "Natureza"], "Neutro": [],
}
const ELCOL := {
	"Fogo": "#ff6a3d", "Água": "#4fa8ff", "Gelo": "#9fe3ff", "Luz": "#ffd23f", "Vampiro": "#e0396a", "Elfo": "#5fd4c4",
	"Neutro": "#c9cbe6", "Elétrico": "#ffe14d", "Natureza": "#7ed957", "Terra": "#d9a04a", "Trevas": "#b07aff",
	"Humano": "#ff9a7a", "Máquina": "#4fc3ff",
}
const RAR := {"Comum": [45, "#9aa3c7"], "Raro": [30, "#4f8dff"], "Épico": [18, "#b07aff"], "Lendário": [7, "#ffa53d"]}
const GEMS := ["Sem patente", "Quartzo", "Ametista", "Topázio", "Esmeralda", "Safira", "Rubi", "Diamante", "Diamante Negro"]
const GEMCOL := ["#9aa3c7", "#e8e8f0", "#b07aff", "#ffc04d", "#46d160", "#4f8dff", "#ff4d5e", "#bff4ff", "#6a5acd"]
const HANDK := {
	"saci": [150, false], "iara": [140, false], "mula": [26, true], "yeti": [28, true], "zeus": [170, false], "dracula": [24, true],
}
const ARENAS := [
	{"id": "vulcao", "name": "Vulcão", "el": "Fogo", "tiles": ["#3a2828", "#402c2b", "#35242a"], "wall": "#1a1214", "deco": "#5a3b33", "hz": "lava"},
	{"id": "recife", "name": "Recife", "el": "Água", "tiles": ["#1d4e6b", "#1f5674", "#1a4862"], "wall": "#0e2a3b", "deco": "#2f7194", "hz": "current"},
	{"id": "tundra", "name": "Tundra Congelada", "el": "Gelo", "tiles": ["#dbe6f0", "#e4edf5", "#d0deea"], "wall": "#8aa3bd", "deco": "#b8cde0", "hz": "ice"},
	{"id": "templo", "name": "Templo do Sol", "el": "Luz", "tiles": ["#c4a257", "#cbab61", "#b9984f"], "wall": "#6e5627", "deco": "#e0c27a", "hz": "beam"},
	{"id": "castelo", "name": "Castelo do Conde", "el": "Vampiro", "tiles": ["#2b2233", "#30263a", "#271f2f"], "wall": "#130e18", "deco": "#43354f", "hz": "beam"},
	{"id": "bosque", "name": "Bosque Feérico", "el": "Elfo", "tiles": ["#1e4d36", "#22573d", "#1b4630"], "wall": "#0f2a1d", "deco": "#2f6b4c", "hz": "mush"},
	{"id": "coliseu", "name": "Coliseu", "el": "Neutro", "tiles": ["#b89a74", "#c2a47d", "#ad8f6a"], "wall": "#5e4a35", "deco": "#d1b48b", "hz": "none"},
]

# ---------- ESTADO ----------
var chars: Array = []
var sprites := {}          # id -> [textura, textura branca]
var arena_tex := {}        # id -> textura do chão
var font: Font
var state := "title"
var paused := false
var time := 0.0
var G: Dictionary = {}
var pick: Dictionary = {}
var draw_t := 0.0
var result_t := 0.0
var cd_t := 0.0
var revealed := [false, false, false]
var buttons: Array = []
var save := {"mastery": {}, "seen": {}, "wins": 0, "games": 0, "rank": {"pts": 0, "best": 0, "season": 1}, "hist": []}
var last_mode := "1x1"
var T: Dictionary = {}       # torneio
var alb_sel := -1
var alb_page := 0
const SAVE_PATH := "user://save.json"
var opt := {"diff": 1, "tips": true}
const DIFFN := ["Fácil", "Normal", "Difícil"]
const DIFFM := [0.72, 1.0, 1.3]
var how_page := 0
var how_next := "title"
var prep: Dictionary = {}
var prep_slot := ""
var bag_sel := -1
var bag_filter := "all"
var bag_page := 0
var bag_back := "title"
var msg := {"txt": "", "col": "#ffffff", "t": -9.0}
var box_anim: Dictionary = {}
var shop_tab := "destaques"
var cat_slot := "all"
var cat_rar := -1
var cat_page := 0
var cat_sel: Dictionary = {}
var cos_cat := "aura"
var pass_page := 0
var modal: Dictionary = {}
var ask: Control = null
# ---------- visuais, gemas e passe (Gemas só compram visuais e o Passe) ----------
const GEM_PACKS := [[100, 0, "R$ 4,90"], [450, 50, "R$ 19,90"], [950, 150, "R$ 39,90"], [2000, 400, "R$ 79,90"]]
const COS := {
	"aura": ["Auras", [["a_fogo", "Aura de Fogo", "#ff6a13", 250], ["a_gelo", "Aura de Gelo", "#7fe0ff", 250], ["a_sombra", "Aura Sombria", "#8a5cff", 300], ["a_ouro", "Aura Dourada", "#ffd23f", 450], ["a_arco", "Aura Arco-íris", "rainbow", 600]]],
	"trail": ["Rastros", [["t_faisca", "Faíscas", "#ffd23f", 150], ["t_petala", "Pétalas", "#ff9ad5", 200], ["t_estrela", "Estrelas", "#bfeaff", 250], ["t_fumaca", "Fumaça", "#8a8290", 150], ["t_raio", "Raios", "#4fd1ff", 300]]],
	"title": ["Títulos", [["ti_sortudo", "O Sortudo", "#46d160", 100], ["ti_lenda", "Lenda Viva", "#ffb02e", 300], ["ti_cacador", "Caçador de Bots", "#ff6a6a", 150], ["ti_recife", "Rei do Recife", "#4fc3ff", 150], ["ti_imbativel", "Imbatível", "#ff4d5e", 400]]],
	"emote": ["Emotes", [["e_gg", "GG!", "#ffffff", 0], ["e_uhu", "Uhuuu!", "#ffd23f", 100], ["e_sorte", "Foi sorte!", "#8ef0a0", 100], ["e_bora", "Bora!", "#ff8a3d", 100], ["e_hmm", "Hmm...", "#c77dff", 150]]],
	"frame": ["Molduras", [["f_bronze", "Moldura de Bronze", "#b9773f", 100], ["f_prata", "Moldura de Prata", "#b4c3d3", 200], ["f_ouro", "Moldura de Ouro", "#efbf4f", 350], ["f_neon", "Moldura Neon", "#4fd1ff", 400]]],
}
const PASS_LV := 30
const PASS_XP := 500
const PASS_PRICE := 600
const PASS_PREM := {2: "t_faisca", 4: "ti_sortudo", 6: "a_fogo", 8: "e_uhu", 10: "f_bronze", 12: "t_petala", 14: "ti_cacador", 16: "a_gelo", 18: "e_bora", 20: "f_prata", 22: "t_estrela", 24: "ti_lenda", 26: "a_sombra", 28: "f_ouro", 30: "a_arco"}
# ---------- online ----------
const DEFAULT_SERVER := "wss://duel-legends-arena.onrender.com"
const NET_MAX := {"1x1": 2, "2x2": 4, "3x3": 6, "ffa": 6}
var net := {"on": false, "status": "off", "id": -1, "rooms": [], "room": {}, "chat": [], "quick": [], "start": {}, "role": "", "my_slot": -1,
	"inputs": {}, "snap_t": 0.0, "in_t": 0.0, "new_pops": [], "ping": 0, "prep_ready": [], "err": "", "err_t": -9.0, "cnt": {"b": 0, "c": 0, "d": 0, "e": 0}, "order": [], "go": {}, "ping_t": 0.0}
var ws: WebSocketPeer = null
var create_mode := "1x1"

# ---------- ENTRADA ----------
var is_touch := false
var pressed := {"b": false, "c": false, "dash": false}
var touch := {"joy": -1, "joy_o": Vector2.ZERO, "joy_v": Vector2.ZERO, "a": -1, "blk": -1}
const TB := {"a": [442, 232, 20], "b": [404, 248, 13], "c": [448, 190, 15], "dash": [406, 212, 12], "blk": [368, 244, 12]}


class Fighter:
	var d: Dictionary
	var pos := Vector2.ZERO
	var vel := Vector2.ZERO
	var hp := 1000.0
	var charge := 0.0
	var cd_a := 0.0
	var cd_b := 0.0
	var cd_dash := 0.0
	var face := 1.0
	var aim := 0.0
	var slow_t := 0.0
	var slow_f := 1.0
	var stun := 0.0
	var freeze := 0.0
	var inv := 0.0
	var dash_t := 0.0
	var dash_v := Vector2.ZERO
	var dash_atk: Dictionary = {}
	var flash := 0.0
	var drain := 0.0
	var haste := 0.0
	var channel: Dictionary = {}
	var flurry: Dictionary = {}
	var bot := false
	var walk := 0.0
	var tp_cd := 0.0
	var spin := 0.0
	var trail: Array = []
	var foe: Fighter
	var mods := 1.0
	var st := {}
	var speed := 0.0
	var dash_cd := 0.0
	var guard_max := 0.0
	var guard := 0.0
	var blocking := false
	var block_start := -9.0
	var guard_regen := 0.0
	var broken := 0.0
	var shield_t := 0.0
	var ghost := 0.0
	var power := 0.0
	var marked := 0.0
	var reflect := 0.0
	var big := 0.0
	var env_acc := 0.0
	var mv := Vector2.ZERO
	var team := 0
	var dead := false
	var stats := {}
	var last_by: Fighter
	var cover := -1
	var reveal_t := 0.0
	var blind := false
	var fire_t := 0.0
	var dodged := false
	var colr := "#ffffff"
	var gear := {}
	var slot := -1
	var remote := false
	var net_name := ""
	var cos := {}
	var dummy := false
	var emote := ""
	var emote_t := 0.0
	var emote_cd := 0.0
	var nx := 0.0
	var ny := 0.0
	var moving := false
	var last_in := {"b": 0, "c": 0, "d": 0, "e": 0}
	var ai := {"strafe": 1.0, "strafe_t": 0.0, "react": 0.0, "think_b": 2.0, "block_t": 0.0, "lx": null, "ly": 0.0}


# =====================================================================
func _ready() -> void:
	font = ThemeDB.fallback_font
	randomize()
	_load_save()
	Items.load_data()
	Ranked.init_save(save)
	Items.init_save(save)
	opt.merge(save.get("opt", {}), true)
	save["opt"] = opt
	if not save.has("cos"):
		save["cos"] = {"owned": [], "eq": {"emote": "e_gg"}}
	if not save.has("gems"):
		save["gems"] = 0
	if not save.has("pass"):
		save["pass"] = {"season": 1, "xp": 0, "premium": false, "cf": [], "cp": []}
	var raw = JSON.parse_string(FileAccess.get_file_as_string("res://data/characters.json"))
	for i in raw.size():
		var d: Dictionary = raw[i]
		var hand: String = d.get("hand", "")
		var is_melee: bool = HANDK[hand][1] if hand != "" else d["A"]["t"] == "melee"
		var rng: float = HANDK[hand][0] if hand != "" else (float(d["A"].get("r", 26)) if is_melee else 150.0)
		var pw: Array = []
		for t in d["p"]:
			pw.append((t as String).split(":")[0].strip_edges())
		var c := {
			"id": hand if hand != "" else "c%d" % i, "hand": hand != "", "name": d["n"], "el": d["e"], "rar": d["r"],
			"atk": d["s"][0], "def": d["s"][1], "vel": d["s"][2], "esp": d["s"][3], "esq": d["s"][4],
			"melee": is_melee, "range": rng, "pw": pw, "kit": {"A": d["A"], "B": d["B"], "C": d["C"], "Bret": d.get("Bret", 0)},
		}
		chars.append(c)
		sprites[c["id"]] = Sprites.build_hand(hand) if hand != "" else Sprites.build_proc(d["spr"])
	for a in ARENAS:
		arena_tex[a["id"]] = _build_arena(a)


func _load_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		var s = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
		if s is Dictionary:
			save.merge(s, true)


func _persist() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save))


# ---------- utilidades ----------
func col(hex: String, a := 1.0) -> Color:
	var c := Color.html(hex)
	c.a = a
	return c


func mult(a: String, d: String) -> float:
	if (STRONG.get(a, []) as Array).has(d):
		return 1.5
	if (STRONG.get(d, []) as Array).has(a):
		return 0.75
	return 1.0


func weak_to(el: String) -> Array:
	var out: Array = []
	for k in STRONG:
		if (STRONG[k] as Array).has(el):
			out.append(k)
	return out


func arena_mod(arena: Dictionary, el: String) -> float:
	if el == "Neutro" or arena["el"] == "Neutro":
		return 1.0
	if el == arena["el"]:
		return 1.1
	if weak_to(arena["el"]).has(el):
		return 0.9
	return 1.0


func ang_diff(a: float, b: float) -> float:
	return absf(wrapf(a - b, -PI, PI))


func gem_of(pts: int) -> int:
	return mini(8, int(pts / 100))


func cxl(v: float) -> float:
	return clampf(v, BX1 + 16, BX2 - 16)


func cyl(v: float) -> float:
	return clampf(v, BY1 + 18, BY2 - 6)


func _build_arena(a: Dictionary, w := 480.0, h := 270.0, b := Rect2(12, 40, 456, 222)) -> ImageTexture:
	var img := Image.create(int(w), int(h), false, Image.FORMAT_RGBA8)
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(a["id"])
	for ty in range(0, int(h), 16):
		for tx in range(0, int(w), 16):
			img.fill_rect(Rect2i(tx, ty, 16, 16), Color.html(a["tiles"][rng.randi() % 3]))
			if rng.randf() < 0.18:
				img.fill_rect(Rect2i(tx + rng.randi_range(2, 11), ty + rng.randi_range(2, 11), 4, 2), Color.html(a["deco"]))
	var wall := Color.html(a["wall"])
	img.fill_rect(Rect2i(0, 0, int(w), int(b.position.y)), wall)
	img.fill_rect(Rect2i(0, int(b.end.y), int(w), int(h - b.end.y)), wall)
	img.fill_rect(Rect2i(0, 0, int(b.position.x), int(h)), wall)
	img.fill_rect(Rect2i(int(b.end.x), 0, int(w - b.end.x), int(h)), wall)
	if a["id"] == "castelo":
		img.fill_rect(Rect2i(int(b.position.x) + 40, int(b.get_center().y) - 11, int(b.size.x) - 80, 22), Color.html("#5a1426"))
	return ImageTexture.create_from_image(img)


func set_world(mode: String) -> void:
	var d: Array = WORLD.get(mode, WORLD["1x1"])
	WW = d[0]
	WH = d[1]
	BX1 = 16.0
	BY1 = 16.0
	BX2 = WW - 16.0
	BY2 = WH - 16.0


func cam_clamp(v: Vector2) -> Vector2:
	return Vector2(clampf(v.x, -8, WW - W + 8), clampf(v.y, -46, WH - H + 34))


func seen_by(f: Fighter, team: int) -> bool:
	if f.team == team or G["over"] or f.cover < 0 or f.reveal_t > 0:
		return true
	for v: Fighter in G["all"]:
		if v.team == team and not v.dead and (v.cover == f.cover or v.pos.distance_to(f.pos) < 38):
			return true
	return false


func stat(f: Fighter, k: String, v: float) -> void:
	f.stats[k] = float(f.stats.get(k, 0.0)) + v


func build_covers() -> Array:
	var out: Array = []
	var n := roundi(WW * WH / 34000.0)
	var tries := 0
	while out.size() < n and tries < 600:
		tries += 1
		var r := randf_range(20, 30)
		var c := Vector2(randf_range(BX1 + 40, BX2 - 40), randf_range(BY1 + 40, BY2 - 40))
		var ok := true
		for f: Fighter in G["all"]:
			if f.pos.distance_to(c) < r + 60:
				ok = false
		for o in out:
			if (o["p"] as Vector2).distance_to(c) < float(o["r"]) + r + 34:
				ok = false
		for k in ["lava", "ice"]:
			for rr in G["hz"][k]:
				if (rr as Rect2).grow(r + 12).has_point(c):
					ok = false
		for cu in G["hz"]["cur"]:
			if (cu[0] as Rect2).grow(r + 12).has_point(c):
				ok = false
		for m in G["hz"]["mush"]:
			if (m[0] as Vector2).distance_to(c) < r + 24:
				ok = false
		if ok:
			out.append({"p": c, "r": r, "seed": randf() * 100.0})
	return out


# =====================================================================
# ENTRADA
func _input(e: InputEvent) -> void:
	if e is InputEventScreenTouch:
		is_touch = true
		var p: Vector2 = e.position
		if e.pressed:
			if state == "fight" and not paused:
				for k in ["a", "b", "c", "dash", "blk"]:
					var b: Array = TB[k]
					if p.distance_to(Vector2(b[0], b[1])) < b[2] + 6:
						if k == "a" or k == "blk":
							touch[k] = e.index
						else:
							pressed[k] = true
						return
				if p.x < W * 0.5 and touch["joy"] == -1:
					touch["joy"] = e.index
					touch["joy_o"] = p
					touch["joy_v"] = Vector2.ZERO
					return
			_ui_click(p)
		else:
			if touch["joy"] == e.index:
				touch["joy"] = -1
				touch["joy_v"] = Vector2.ZERO
			if touch["a"] == e.index:
				touch["a"] = -1
			if touch["blk"] == e.index:
				touch["blk"] = -1
	elif e is InputEventScreenDrag:
		if touch["joy"] == e.index:
			var v: Vector2 = e.position - touch["joy_o"]
			if v.length() > 28:
				v = v.normalized() * 28
			touch["joy_v"] = v / 28.0
	elif e is InputEventMouseButton and e.pressed:
		if e.button_index == MOUSE_BUTTON_LEFT and (state != "fight" or paused or _hit_ui(e.position)):
			_ui_click(e.position)
	elif e is InputEventKey and e.pressed and not e.echo:
		match e.physical_keycode:
			KEY_E, KEY_K:
				pressed["b"] = true
			KEY_Q, KEY_L:
				pressed["c"] = true
			KEY_T:
				if state == "fight" and not G.is_empty():
					do_emote(G["p"])
			KEY_SPACE:
				pressed["dash"] = true
				if state != "fight":
					_ui_key()
			KEY_ENTER:
				_ui_key()
			KEY_ESCAPE:
				if state == "fight":
					paused = not paused


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT or what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_WINDOW_FOCUS_OUT:
		reset_touch()


func reset_touch() -> void:
	touch["joy"] = -1
	touch["joy_v"] = Vector2.ZERO
	touch["a"] = -1
	touch["blk"] = -1


func _hit_ui(p: Vector2) -> bool:
	for b in buttons:
		if (b["r"] as Rect2).has_point(p):
			return true
	return false


func _ui_click(p: Vector2) -> void:
	if ask != null:
		return
	for i in range(buttons.size() - 1, -1, -1):
		var b: Dictionary = buttons[i]
		if (b["r"] as Rect2).has_point(p):
			on_button(b["id"])
			return


func _ui_key() -> void:
	if state == "bracket" and not T.is_empty() and T["champion"] == null:
		on_button("tfight")
	elif state == "result" and G.get("tour", false) and result_t > 1.0:
		on_button("tcont")
	elif state == "title":
		on_button("play")
	elif state == "draw" and draw_t > 5.2:
		on_button("fight")
	elif state == "prep":
		on_button("ready")
	elif state == "result" and result_t > 1.0:
		on_button("again")


func weighted_pick() -> Dictionary:
	var pool: Array = []
	var tot := 0.0
	for c in chars:
		var n := 0
		for x in chars:
			if x["rar"] == c["rar"]:
				n += 1
		var w: float = RAR[c["rar"]][0] / float(n) * (1.0 + 0.1 * gem_of(int(save["mastery"].get(c["id"], 0)))) * (3.0 if c["id"] == week_legend()["id"] else 1.0)
		pool.append([c, w])
		tot += w
	var r := randf() * tot
	for p in pool:
		r -= p[1]
		if r <= 0:
			return p[0]
	return pool[0][0]


func draw_unique(used: Dictionary) -> Dictionary:
	var c: Dictionary = chars[randi() % chars.size()]
	while used.has(c["id"]):
		c = chars[randi() % chars.size()]
	used[c["id"]] = true
	return c


func new_pick(mode: String, ranked: bool) -> void:
	var used := {}
	var fx: Dictionary = wk_hero_active() if (not ranked and save.get("use_fixed", true) != false) else {}
	var me: Dictionary = fx if not fx.is_empty() else weighted_pick()
	used[me["id"]] = true
	var allies: Array = []
	var foes: Array = []
	if mode == "ffa":
		for i in 5:
			foes.append(draw_unique(used))
	else:
		var n: int = MODES[mode][0]
		for i in range(1, n):
			allies.append(draw_unique(used))
		for i in n:
			foes.append(draw_unique(used))
	pick = {"me": me, "allies": allies, "foes": foes, "foe": foes[0], "arena": ARENAS[randi() % ARENAS.size()], "mode": mode, "ranked": ranked, "fixed": not fx.is_empty()}
	last_mode = "ranked" if ranked else mode
	state = "draw"
	draw_t = 0.0
	revealed = [false, false, false]


func on_button(id: String) -> void:
	if id == "again":
		id = "rankgo" if last_mode == "ranked" else ("toroom" if last_mode == "online" else "m:" + last_mode)
	if id == "play":
		id = "m:1x1"
	if id.begins_with("m:"):
		new_pick(id.substr(2), false)
		return
	if id.begins_with("alb:"):
		alb_sel = int(id.substr(4))
		return
	if not modal.is_empty() and not id.begins_with("mod:"):
		return
	if _item_button(id) or _shop2_button(id) or _net_button(id) or _feat_button(id) or _v16_button(id):
		return
	match id:
		"ranked":
			if str(save.get("user", "")) == "":
				open_modal("RANQUEADA", ["Para jogar a ranqueada, crie uma conta.", "Assim seu elo fica salvo e ninguém consegue trapacear."], [["mod:accreg", "CRIAR CONTA", "#ffd23f"], ["mod:acclog", "ENTRAR", "#4fd1ff"], ["mod:x", "AGORA NÃO", "#c9cbe6"]])
				return
			state = "rank_lobby"
			if net["status"] != "on":
				net_connect()
		"rankgo":
			if str(save.get("user", "")) == "":
				on_button("ranked")
				return
			if net["status"] != "on":
				net_connect()
				net["err"] = "Conectando ao servidor… toque de novo em instantes."
				net["err_t"] = time
			else:
				net["on"] = false
				net["role"] = ""
				net["rank_q"] = true
				net_send({"t": "rankqueue", "mmr": int(save["rank"]["mmr"])})
		"leader":
			state = "leader"
			LB["page"] = 0
			LB["err"] = ""
			if net["status"] != "on":
				net_connect()
				LB["loading"] = false
				LB["err"] = "Conectando ao servidor… toque em ATUALIZAR."
			else:
				LB["loading"] = true
				net_send({"t": "top"})
		"ldr":
			if net["status"] == "on":
				LB["loading"] = true
				net_send({"t": "top"})
			else:
				net_connect()
		"ldp":
			LB["page"] = maxi(0, int(LB["page"]) - 1)
		"ldn":
			LB["page"] = mini(maxi(0, int(ceil((LB["list"] as Array).size() / 10.0)) - 1), int(LB["page"]) + 1)
		"ldback":
			state = "rank_lobby"
		"rankback":
			net["on"] = false
			net["role"] = ""
			state = "rank_lobby"
		"modes":
			if not save.get("tut_asked", false) and int(save["games"]) == 0:
				save["tut_asked"] = true
				_persist()
				open_modal("PRIMEIRA VEZ NA ARENA?", ["Faça o tutorial rápido (1 minuto) e aprenda", "a andar, atacar, esquivar, bloquear e usar o especial.", "Vencendo, você ganha 100 GD!"], [["mod:tut", "FAZER TUTORIAL", "#ffd23f"], ["mod:skiptut", "PULAR", "#c9cbe6"]])
				return
			if not save.get("howto", false):
				save["howto"] = true
				_persist()
				how_page = 0
				how_next = "modes"
				state = "howto"
			else:
				state = "modes"
		"profile", "album", "options", "shop", "box":
			state = id
		"bag":
			if state != "bag" and state != "shop":
				bag_back = state
			state = "bag"
		"howto":
			how_page = 0
			how_next = "title"
			state = "howto"
		"hprev":
			how_page = maxi(0, how_page - 1)
		"hnext":
			if how_page < 2:
				how_page += 1
			else:
				state = how_next
		"hclose":
			state = how_next
		"full":
			if DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
			else:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
		"fight":
			if pick.get("online", false):
				enter_net_prep()
			else:
				enter_prep("match")
		"ready":
			if not prep.is_empty() and prep.get("net", false):
				net_prep_ready()
			elif not prep.is_empty() and not prep["ready"]:
				prep["ready"] = true
				prep["ready_at"] = prep["t"]
		"tour":
			start_tournament()
		"tfight":
			pick = {"me": T["me"], "foe": t_foe(), "foes": [t_foe()], "allies": [], "arena": ARENAS[0], "mode": "1x1"}
			enter_prep("tour")
		"tcont":
			if not G.is_empty() and G.get("tour", false):
				t_advance(bool(G["res"]["win"]))
				G["tour"] = false
				state = "bracket"
		"menu":
			if state == "shop" and not prep.is_empty() and bag_back == "prep":
				state = "bag"
			elif state == "bag" and bag_back == "prep" and not prep.is_empty():
				prep["t"] = minf(prep["t"], 15.0)
				state = "prep"
			else:
				state = "title"
		"pause":
			paused = not paused
		"quit":
			if G.get("net", false):
				net_send({"t": "leave"})
				net["on"] = false
				net["role"] = ""
				net["room"] = {}
				paused = false
				state = "online"
				return
			paused = false
			state = "title"


# ---------- TORNEIO (16 vagas com bots) ----------
func _flash(txt: String, c: String) -> void:
	msg = {"txt": txt, "col": c, "t": time}


func _item_button(id: String) -> bool:
	if id.begins_with("buy:"):
		var o: Dictionary = save["shop"]["items"][int(id.substr(4))]
		var pr := int(Items.RARI[int(o["r"])][3])
		if o["sold"]:
			return true
		if int(save["gd"]) < pr:
			_flash("GD insuficiente", "#ff9a9a")
			return true
		save["gd"] = int(save["gd"]) - pr
		o["sold"] = true
		var it := Items.new_item(save, o["b"], int(o["r"]))
		save["inv"].append(it)
		bag_sel = it["id"]
		_persist()
		_flash("Comprado: " + Items.item_name(it), "#8ef0a0")
		return true
	if id.begins_with("buypo:"):
		var n := int(id.substr(6))
		var pr := 400 if n == 5 else 90
		if int(save["gd"]) < pr:
			_flash("GD insuficiente", "#ff9a9a")
			return true
		save["gd"] = int(save["gd"]) - pr
		save["po"] = int(save["po"]) + n
		_persist()
		_flash("+%d Pó Mágico" % n, "#c77dff")
		return true
	if id == "reroll":
		if int(save["gd"]) >= 40:
			save["gd"] = int(save["gd"]) - 40
			Items.shop_roll(save)
			_persist()
		else:
			_flash("GD insuficiente", "#ff9a9a")
		return true
	if id.begins_with("bf:"):
		bag_filter = id.substr(3)
		bag_page = 0
		return true
	if id.begins_with("bpg:"):
		bag_page = maxi(0, bag_page + int(id.substr(4)))
		return true
	if id.begins_with("bsel:"):
		bag_sel = int(id.substr(5))
		return true
	if id == "beq":
		var it := Items.by_id(save, bag_sel)
		if not it.is_empty():
			var sl := Items.slot_of(it)
			if save["equip"].get(sl, null) != null and int(save["equip"][sl]) == int(it["id"]):
				save["equip"].erase(sl)
			else:
				save["equip"][sl] = it["id"]
			_persist()
		return true
	if id == "bsell":
		var it := Items.by_id(save, bag_sel)
		if not it.is_empty():
			save["gd"] = int(save["gd"]) + Items.sell_price(it)
			for k in save["equip"].keys():
				if int(save["equip"][k]) == int(it["id"]):
					save["equip"].erase(k)
			save["inv"].erase(it)
			bag_sel = -1
			_persist()
			_flash("Vendido!", "#ffd23f")
		return true
	if id == "bup":
		var it := Items.by_id(save, bag_sel)
		if not it.is_empty():
			var res := Items.upgrade(save, it)
			if res == "":
				_flash("Falta pó ou GD", "#ff9a9a")
			else:
				_flash(res, "#8ef0a0" if res.begins_with("SUCESSO") else "#ff9a9a")
				_persist()
		return true
	if id == "boxopen":
		if box_anim.is_empty():
			box_anim = Items.open_box(save)
			if not box_anim.is_empty():
				var left: Array = []
				for n in ICON_BOX:
					var bid := id_of(n)
					if bid != "" and not icon_owned(bid):
						left.append(bid)
				if not left.is_empty() and randf() < 0.5:
					box_anim["icon"] = left[randi() % left.size()]
					give_icon(box_anim["icon"])
			_persist()
		return true
	if id == "boxok":
		if not box_anim.is_empty() and box_anim["done"]:
			bag_sel = box_anim["win"]["id"]
			box_anim = {}
		return true
	if id.begins_with("pslot:"):
		var sl := id.substr(6)
		prep_slot = "" if prep_slot == sl else sl
		return true
	if id.begins_with("punq:"):
		save["equip"].erase(id.substr(5))
		_persist()
		return true
	if id.begins_with("pitem:"):
		var iid := int(id.substr(6))
		if iid > 0:
			save["equip"][prep_slot] = iid
		else:
			save["equip"].erase(prep_slot)
		_persist()
		prep_slot = ""
		return true
	if id.begins_with("opt:"):
		var parts := id.split(":")
		if parts[1] == "diff":
			opt["diff"] = clampi(int(opt["diff"]) + int(parts[2]), 0, 2)
		elif parts[1] == "tips":
			opt["tips"] = not opt["tips"]
		save["opt"] = opt
		_persist()
		return true
	return false


# ---------- PREPARAÇÃO: equipar e PRONTO ----------
func enter_prep(next: String) -> void:
	var players: Array = [{"n": "Você", "c": pick["me"], "me": true, "team": 0, "at": 1e9}]
	for c in pick.get("allies", []):
		players.append({"n": "Aliado", "c": c, "me": false, "team": 0, "at": 0.0})
	for c in pick.get("foes", [pick["foe"]]):
		players.append({"n": "Rival" if pick.get("mode", "") == "ffa" else "Bot", "c": c, "me": false, "team": 1, "at": 0.0})
	for i in players.size():
		if not players[i]["me"]:
			players[i]["at"] = randf_range(1.2, 5.5) + i * 0.25
	prep = {"t": 0.0, "ready": false, "ready_at": 0.0, "next": next, "players": players}
	prep_slot = ""
	state = "prep"


func update_prep(dt: float) -> void:
	if prep.is_empty():
		return
	prep["t"] = float(prep["t"]) + dt
	var el: float = prep["t"]
	if prep.get("net", false):
		if el >= 30:
			net_prep_ready()
		for q in prep["players"]:
			q["at"] = 0.0 if (q.get("bot", false) or (net["prep_ready"] as Array).has(q.get("pid", -99)) or (q["me"] and prep["ready"])) else 1e9
		return
	if el >= 30 and not prep["ready"]:
		prep["ready"] = true
		prep["ready_at"] = el
	if prep["ready"] and el - float(prep["ready_at"]) > 0.6:
		for q in prep["players"]:
			if not q["me"] and float(q["at"]) > el:
				return
		var nx: String = prep["next"]
		prep = {}
		if nx == "tour":
			t_start_match()
		else:
			start_match()


func start_tournament() -> void:
	var me := weighted_pick()
	var used := {me["id"]: true}
	var slots: Array = [me]
	while slots.size() < 16:
		slots.append(draw_unique(used))
	slots.shuffle()
	T = {"me": me, "rounds": [slots], "r": 0, "alive": true, "champion": null, "lost_at": -1, "bonus": 0}
	save["seen"][me["id"]] = true
	_persist()
	state = "bracket"


func t_foe() -> Dictionary:
	var cur: Array = T["rounds"][T["r"]]
	var i := cur.find(T["me"])
	return cur[i ^ 1]


func t_start_match() -> void:
	pick = {"me": T["me"], "foe": t_foe(), "foes": [t_foe()], "allies": [], "arena": ARENAS[randi() % ARENAS.size()], "mode": "1x1", "tour": true}
	start_match()


# luta entre bots: estimativa rápida pela vantagem de elemento e ajuste fino
func sim_fight(a: Dictionary, b: Dictionary) -> Dictionary:
	var pa: float = float(TUNE.get(a["name"], 1.0)) * mult(a["el"], b["el"])
	var pb: float = float(TUNE.get(b["name"], 1.0)) * mult(b["el"], a["el"])
	return a if randf() < pa / (pa + pb) else b


func t_advance(player_won: bool) -> void:
	var cur: Array = T["rounds"][T["r"]]
	var nxt: Array = []
	for k in range(0, cur.size(), 2):
		var a: Dictionary = cur[k]
		var b: Dictionary = cur[k + 1]
		if a == T["me"] or b == T["me"]:
			nxt.append(T["me"] if player_won else (b if a == T["me"] else a))
		else:
			nxt.append(sim_fight(a, b))
	if not player_won and T["alive"]:
		T["alive"] = false
		T["lost_at"] = T["r"]
	T["rounds"].append(nxt)
	T["r"] = int(T["r"]) + 1
	if nxt.size() == 1:
		T["champion"] = nxt[0]
		if nxt[0] == T["me"]:
			stx()["tour"] = int(stx()["tour"]) + 1
			ach_check()
			var id: String = T["me"]["id"]
			save["mastery"][id] = int(save["mastery"].get(id, 0)) + 20
			_persist()
			T["bonus"] = 20
	elif not T["alive"]:
		t_advance(false)


# =====================================================================
# PARTIDA
func make_fighter(d: Dictionary, p: Vector2, bot: bool, arena: Dictionary) -> Fighter:
	var f := Fighter.new()
	f.d = d
	f.pos = p
	f.bot = bot
	f.face = -1.0 if bot else 1.0
	f.aim = PI if bot else 0.0
	f.mods = arena_mod(arena, d["el"])
	f.st = {"atk": d["atk"] * f.mods, "def": d["def"] * f.mods, "vel": d["vel"] * f.mods, "esp": d["esp"] * f.mods, "esq": d["esq"] * f.mods}
	f.speed = (70.0 + 0.7 * f.st["vel"]) * (BAL["melee_speed"] if d["melee"] else 1.0) * BAL["move"]
	f.dash_cd = 6.0 - f.st["esq"] / 25.0
	f.guard_max = f.st["def"] * 3.0
	f.guard = f.guard_max
	f.ai["think_b"] = randf_range(1, 3)
	return f


func apply_gear(f: Fighter, g: Dictionary) -> void:
	f.gear = g
	for k in g:
		f.st[k] = float(f.st[k]) + float(g[k])
	f.guard_max = f.st["def"] * 3.0
	f.guard = f.guard_max
	f.speed = (70.0 + 0.7 * f.st["vel"]) * (BAL["melee_speed"] if f.d["melee"] else 1.0) * BAL["move"]
	f.dash_cd = 6.0 - f.st["esq"] / 25.0


func start_match() -> void:
	reset_touch()
	var a: Dictionary = pick["arena"]
	set_world(pick.get("mode", "1x1"))
	G = {
		"arena": a, "proj": [], "zones": [], "parts": [], "pops": [], "slashes": [], "decoys": [],
		"time": 120.0, "shake": 0.0, "hitstop": 0.0, "over": false, "ko_t": 0.0, "winner": null,
		"zone": Rect2(BX1, BY1, BX2 - BX1, BY2 - BY1), "zt": Rect2(BX1, BY1, BX2 - BX1, BY2 - BY1), "shrink_t": 40.0,
		"hz": build_hazards(a), "res": {}, "ftime": 0.0,
	}
	var cy0 := (BY1 + BY2) / 2
	var p := make_fighter(pick["me"], Vector2(BX1 + (BX2 - BX1) * 0.3, cy0), false, a)
	var b := make_fighter(pick["foe"], Vector2(BX1 + (BX2 - BX1) * 0.7, cy0 - 10), true, a)
	p.team = 0
	b.team = 1
	p.foe = b
	b.foe = p
	G["p"] = p
	G["b"] = b
	G["all"] = [p, b]
	G["diff"] = 1.0
	var mode: String = pick.get("mode", "1x1")
	if mode == "ffa":
		G["multi"] = true
		G["ffa"] = true
		G["time"] = 180.0
		var list: Array = [p]
		for c in pick["foes"]:
			list.append(make_fighter(c, Vector2.ZERO, true, a))
		for i in list.size():
			var f: Fighter = list[i]
			f.team = i
			var ang := PI + i * TAU / list.size()
			var cc := Vector2((BX1 + BX2) / 2, cy0)
			f.pos = cc + Vector2(cos(ang) * (BX2 - BX1) * 0.38, sin(ang) * (BY2 - BY1) * 0.36)
			f.face = -1.0 if cos(ang) > 0 else 1.0
			f.aim = (cc - f.pos).angle()
		G["b"] = list[1]
		G["all"] = list
	elif mode != "1x1":
		G["multi"] = true
		G["time"] = 180.0 if mode == "5x5" else 150.0
		var mine: Array = [p]
		for c in pick["allies"]:
			mine.append(make_fighter(c, Vector2.ZERO, true, a))
		var theirs: Array = [b]
		for i in range(1, pick["foes"].size()):
			theirs.append(make_fighter(pick["foes"][i], Vector2.ZERO, true, a))
		_place(mine, BX1 + (BX2 - BX1) * 0.16, 0, 1.0)
		_place(theirs, BX1 + (BX2 - BX1) * 0.84, 1, -1.0)
		G["all"] = mine + theirs
	G["diff"] = DIFFM[int(opt["diff"])]
	if pick.get("ranked", false):
		G["diff"] = Ranked.bot_diff(save["rank"])
	if pick.get("tour", false):
		G["tour"] = true
		G["diff"] = [0.8, 0.9, 1.0, 1.15][int(T["r"])] * DIFFM[int(opt["diff"])]
	# itens: os seus (com teto) e os dos bots com poder parecido
	var mg := Items.my_gear(save, pick.get("ranked", false))
	apply_gear(p, mg)
	var pw := Items.total(mg)
	var cap: int = Items.ITEM_CAP_RANK if pick.get("ranked", false) else Items.ITEM_CAP
	var pal := ["#ff5a5a", "#ffb02e", "#c77dff", "#ff7ad9", "#4fd1ff", "#ffe066", "#b5ff6a"]
	var all_f: Array = G["all"]
	for i in all_f.size():
		var f: Fighter = all_f[i]
		if f != p:
			apply_gear(f, Items.bot_gear(f.d, mini(cap, roundi(pw * randf_range(0.75, 1.1)))))
		f.colr = "#8ef0a0" if f == p else (pal[(i - 1) % pal.size()] if G.get("ffa", false) else ("#7fc8ff" if f.team == p.team else "#ff6a6a"))
	G["bg"] = _build_arena(a, WW, WH, Rect2(BX1, BY1, BX2 - BX1, BY2 - BY1))
	G["covers"] = build_covers()
	G["tips"] = {"on": bool(opt["tips"]) and int(save["games"]) < 4, "q": [], "cur": {}, "done": {}}
	cam = cam_clamp(p.pos - Vector2(W / 2, H / 2 + 10))
	state = "countdown"
	cd_t = 3.2
	save["seen"][pick["me"]["id"]] = true
	_persist()


func _place(arr: Array, x: float, team: int, face: float) -> void:
	for i in arr.size():
		var f: Fighter = arr[i]
		f.team = team
		f.pos = Vector2(x + (i % 2) * (18.0 if team == 1 else -18.0), BY1 + 50 + (BY2 - BY1 - 100) * (0.5 if arr.size() == 1 else float(i) / (arr.size() - 1)))
		f.face = face
		f.aim = 0.0 if face > 0 else PI


func build_hazards(a: Dictionary) -> Dictionary:
	var hz := _build_hazards_base(a)
	var sx := (BX2 - BX1) / 456.0
	var sy := (BY2 - BY1) / 222.0
	var X := func(x: float) -> float: return BX1 + (x - 12.0) * sx
	var Y := func(y: float) -> float: return BY1 + (y - 40.0) * sy
	for k in ["lava", "ice"]:
		var L: Array = []
		for r in hz[k]:
			L.append(Rect2(X.call(r.position.x), Y.call(r.position.y), r.size.x * sx, r.size.y * sy))
		hz[k] = L
	var C: Array = []
	for c in hz["cur"]:
		var r: Rect2 = c[0]
		C.append([Rect2(X.call(r.position.x), Y.call(r.position.y), r.size.x * sx, r.size.y * sy), c[1]])
	hz["cur"] = C
	var Bm: Array = []
	for bm in hz["beam"]:
		var nb: Array = (bm as Array).duplicate()
		nb[0] = X.call(bm[0])
		nb[1] = bm[1] * 1.2
		Bm.append(nb)
	hz["beam"] = Bm
	var Mu: Array = []
	for m in hz["mush"]:
		var nm: Array = (m as Array).duplicate()
		nm[0] = Vector2(X.call(m[0].x), Y.call(m[0].y))
		Mu.append(nm)
	hz["mush"] = Mu
	return hz


func _build_hazards_base(a: Dictionary) -> Dictionary:
	var h := {"lava": [], "ice": [], "cur": [], "beam": [], "mush": []}
	match a["hz"]:
		"lava":
			h["lava"] = [Rect2(220, 88, 44, 22), Rect2(96, 200, 40, 20), Rect2(330, 214, 46, 20)]
		"ice":
			h["ice"] = [Rect2(150, 70, 80, 50), Rect2(250, 170, 110, 56)]
		"current":
			h["cur"] = [[Rect2(180, 60, 120, 40), Vector2(0, 1)], [Rect2(180, 190, 120, 40), Vector2(0, -1)]]
		"beam":
			h["beam"] = [[150.0, 22.0, 0.0], [310.0, 22.0, 2.0]]
		"mush":
			h["mush"] = [[Vector2(70, 70), 1], [Vector2(410, 240), 0], [Vector2(410, 70), 3], [Vector2(70, 240), 2]]
	return h


func beam_state(b: Array) -> String:
	var c := fposmod(G["time"] + b[2], 4.0)
	return "warn" if c < 1.0 else ("on" if c < 2.0 else "off")


func popup(p: Vector2, txt: String, c: String, sub := "", size := 8) -> void:
	if G.get("net", false) and net["role"] == "host":
		net["new_pops"].append([roundi(p.x), roundi(p.y), txt, c, sub, size])
	G["pops"].append({"p": p, "t": 0.0, "txt": txt, "col": c, "sub": sub, "size": size})


func sparks(p: Vector2, c: String, n := 8, sp := 90.0) -> void:
	for i in n:
		var a := randf() * TAU
		var s := randf_range(20, sp)
		G["parts"].append({"p": p, "v": Vector2(cos(a), sin(a)) * s, "life": randf_range(0.2, 0.5), "t": 0.0, "col": c, "sz": 2.0 if randf() < 0.5 else 1.0})


func hit(src: Fighter, tgt: Fighter, base: float, o: Dictionary = {}) -> Variant:
	if tgt.inv > 0 and tgt.dash_t > 0 and not G["over"] and not tgt.dead and not tgt.dodged and src.team != tgt.team:
		tgt.dodged = true
		stat(tgt, "dodges", 1)
		popup(tgt.pos - Vector2(0, 34), "ESQUIVOU!", "#8ef0a0")
	if tgt.inv > 0 or G["over"] or tgt.dead or src.team == tgt.team:
		return false
	src.reveal_t = maxf(src.reveal_t, 1.2)
	tgt.reveal_t = maxf(tgt.reveal_t, 0.8)
	var atk: float = src.st["esp"] if o.get("special", false) else src.st["atk"]
	var el := mult(src.d["el"], tgt.d["el"])
	var dmg: float = maxf(1, roundf(base * (atk + 100) / (tgt.st["def"] + 100) * el * float(TUNE.get(src.d["name"], 1.0)) * (1.4 if src.power > 0 else 1.0) * (1.35 if tgt.marked > 0 else 1.0)))
	if tgt.reflect > 0 and o.get("proj", false):
		sparks(tgt.pos, "#ffd23f", 10)
		return "reflect"
	if tgt.d["melee"] and o.get("proj", false):
		dmg = maxf(1, roundf(dmg * BAL["melee_proj"]))
	if tgt.shield_t > 0:
		dmg = maxf(1, roundf(dmg * 0.25))
		o = o.duplicate()
		o["slow"] = null; o["stun"] = 0.0; o["freeze"] = 0.0; o["kb"] = 0.0; o["pull"] = 0.0
	var fr: Vector2 = o.get("from", src.pos)
	var blocked := false
	if tgt.blocking and ang_diff((fr - (tgt.pos - Vector2(0, 8))).angle(), tgt.aim) <= 1.3:
		if not o.get("special", false) and time - tgt.block_start <= 0.22:
			stat(tgt, "perfect", 1)
			popup(tgt.pos - Vector2(0, 34), "PERFEITO!", "#ffd23f")
			sparks(tgt.pos + Vector2(cos(tgt.aim), sin(tgt.aim)) * 10 - Vector2(0, 8), "#ffd23f", 16, 120)
			tgt.charge = minf(100, tgt.charge + 8)
			if o.get("proj", false):
				return "reflect"
			src.stun = maxf(src.stun, 0.7)
			return false
		blocked = true
		var raw := dmg
		dmg = maxf(1, roundf(dmg * (0.5 if o.get("special", false) else (0.1 if o.get("proj", false) else 0.25))))
		tgt.guard -= tgt.guard_max * 0.6 if o.get("special", false) else raw * 0.45
		tgt.guard_regen = 1.0
		if tgt.guard <= 0:
			tgt.guard = 0
			tgt.blocking = false
			tgt.broken = 1.2
			tgt.stun = maxf(tgt.stun, 1.0)
			popup(tgt.pos - Vector2(0, 34), "GUARDA QUEBROU!", "#ff7a7a")
			G["shake"] = maxf(G["shake"], 4)
		else:
			o = o.duplicate()
			o["slow"] = null; o["stun"] = 0.0; o["freeze"] = 0.0; o["pull"] = 0.0
			o["kb"] = o.get("kb", 0.0) * 0.3
	tgt.hp -= dmg
	tgt.flash = 0.1
	stat(src, "dmg", dmg)
	stat(src, "hits", 1)
	stat(tgt, "taken", dmg)
	tgt.last_by = src
	src.charge = minf(100, src.charge + 4)
	tgt.charge = minf(100, tgt.charge + 2)
	if src.drain > 0:
		var hl := roundf(dmg * BAL["drain"])
		src.hp = minf(1000, src.hp + hl)
		popup(src.pos - Vector2(0, 26), "+%d" % int(hl), "#46d160")
	if o.get("slow") != null:
		tgt.slow_t = o["slow"][1]
		tgt.slow_f = o["slow"][0]
	elif src.d["melee"] and not o.get("proj", false) and not o.get("special", false) and not blocked and tgt.slow_t <= 0:
		tgt.slow_t = BAL["stick"][0]
		tgt.slow_f = BAL["stick"][1]
	if o.get("stun", 0.0) > 0:
		tgt.stun = maxf(tgt.stun, o["stun"])
	if o.get("freeze", 0.0) > 0:
		tgt.freeze = maxf(tgt.freeze, o["freeze"])
		tgt.stun = maxf(tgt.stun, o["freeze"])
	if o.get("kb", 0.0) > 0:
		var a: float = o["kba"] if o.has("kba") else (tgt.pos - src.pos).angle()
		tgt.vel += Vector2(cos(a), sin(a)) * o["kb"]
	if o.get("pull", 0.0) > 0:
		tgt.vel += (src.pos - tgt.pos).normalized() * o["pull"]
	var c := "#bfeaff" if blocked else ("#ffd23f" if el > 1 else ("#9aa3c7" if el < 1 else "#ffffff"))
	var sub := "bloqueado" if blocked else ("SUPER!" if el > 1 else ("fraco" if el < 1 else ""))
	popup(tgt.pos + Vector2(randf_range(-4, 4), -24), "-%d" % int(dmg), c, sub, 10 if o.get("special", false) else 8)
	G["shake"] = maxf(G["shake"], 5.0 if o.get("special", false) else 2.0)
	if o.get("special", false):
		G["hitstop"] = 0.07
	sparks(tgt.pos - Vector2(0, 9), o.get("col", "#ffffff"), 16 if o.get("special", false) else 7, 140.0 if o.get("special", false) else 90.0)
	if tgt.hp <= 0:
		ko_check(tgt)
	return true


func env_damage(f: Fighter, dps: float, dt: float, c: String) -> void:
	if f.inv > 0 or G["over"]:
		return
	f.hp -= dps * dt
	f.env_acc += dps * dt
	if f.env_acc >= 20:
		popup(f.pos - Vector2(0, 24), "-%d" % roundi(f.env_acc), c)
		f.env_acc = 0
		f.flash = 0.06
	if f.hp <= 0:
		ko_check(f)


func enemies_of(f: Fighter) -> Array:
	var out: Array = []
	for x: Fighter in G["all"]:
		if x.team != f.team and not x.dead:
			out.append(x)
	return out


func ko_check(t: Fighter) -> void:
	if t.dead:
		return
	if t.last_by != null and t.last_by.team != t.team:
		stat(t.last_by, "kos", 1)
	t.hp = 0
	t.dead = true
	t.flash = 0.0
	t.trail = []
	t.freeze = 0.0
	t.stun = 0.0
	t.blocking = false
	t.channel = {}
	popup(t.pos - Vector2(0, 34), "NOCAUTE!", "#ff7a7a")
	G["shake"] = maxf(G["shake"], 6.0)
	var p: Fighter = G["p"]
	var alive: Array = []
	var teams := {}
	for x: Fighter in G["all"]:
		if not x.dead:
			alive.append(x)
			teams[x.team] = true
	var mine := false
	for x: Fighter in alive:
		if x.team == p.team:
			mine = true
	if t == p and mine and G.get("multi", false):
		popup(cam + Vector2(W / 2, 80), "VOCÊ CAIU! SEUS ALIADOS CONTINUAM", "#ffd23f")
	if not mine:
		alive.sort_custom(func(a, b): return a.hp > b.hp)
		end_match(alive[0] if alive.size() > 0 else G["b"])
	elif teams.size() <= 1:
		end_match(p)


func end_match(winner: Fighter) -> void:
	if G["over"]:
		return
	G["over"] = true
	G["winner"] = winner
	G["ko_t"] = 0.0
	G["hitstop"] = 0.25
	G["shake"] = 8.0


# ---------- PODERES (blocos reutilizáveis) ----------
func shoot(f: Fighter, ang: float, o: Dictionary) -> void:
	var p := o.duplicate()
	p["p"] = f.pos + Vector2(cos(ang) * 8, -8 + sin(ang) * 8)
	p["v"] = Vector2(cos(ang), sin(ang)) * o["sp"] * BAL["proj"]
	p["owner"] = f
	p["life"] = o.get("life", 1.2) / BAL["proj"]
	p["t"] = 0.0
	p["hit"] = []
	p["ang"] = ang
	G["proj"].append(p)


func melee(f: Fighter, rng: float, arc: float, base: float, o: Dictionary) -> void:
	base *= BAL["melee_mul"]
	rng += BAL["melee_range"]
	f.vel += Vector2(cos(f.aim), sin(f.aim)) * BAL["lunge"]
	G["slashes"].append({"p": f.pos - Vector2(0, 8), "ang": f.aim, "arc": arc, "r": rng + 6, "t": 0.0, "col": o.get("col", "#ffffff")})
	for t: Fighter in enemies_of(f):
		var dd := f.pos.distance_to(t.pos)
		var a := (t.pos - f.pos).angle()
		if dd <= rng + 8 and ang_diff(a, f.aim) <= arc / 2 + 0.2:
			var o2 := o.duplicate()
			o2["from"] = f.pos - Vector2(0, 8)
			hit(f, t, base, o2)


func zone(f: Fighter, p: Vector2, r: float, o: Dictionary) -> void:
	var z := {"p": p, "r": r, "owner": f, "t": 0.0, "delay": 0.0, "dur": 0.01, "tick": 0.0, "tick_t": 0.0, "once": true, "done": false}
	z.merge(o, true)
	G["zones"].append(z)


func dash_atk(f: Fighter, ang: float, dist: float, dur: float, base: float, o: Dictionary) -> void:
	f.dash_t = dur
	f.dash_v = Vector2(cos(ang), sin(ang)) * dist / dur
	f.inv = maxf(f.inv, dur)
	f.dash_atk = {"base": base, "o": o, "done": false}


func pow_hand(f: Fighter, slot: String) -> void:
	var id: String = f.d["id"]
	var t := f.foe
	match id + "_" + slot:
		"saci_a": shoot(f, f.aim, {"sp": 230, "r": 3, "base": 55, "kind": "fire", "col": "#ff6a13", "fall": true}); f.cd_a = 0.4
		"saci_b": dash_atk(f, f.aim, 90, 0.28, 90, {"col": "#c9cbe6", "kb": 120}); f.spin = 0.28; f.cd_b = 5
		"saci_c": c_swap(f)
		"iara_a": shoot(f, f.aim, {"sp": 150, "r": 4, "base": 60, "kind": "bubble", "col": "#7fd0ff", "slow": [0.7, 1.0], "fall": true}); f.cd_a = 0.45
		"iara_b": shoot(f, f.aim, {"sp": 200, "r": 6, "base": 70, "kind": "ring", "col": "#7fe0c8", "pull": 220.0, "stun": 0.4, "life": 0.9}); f.cd_b = 5
		"iara_c": shoot(f, f.aim, {"sp": 150, "r": 24, "base": 250, "kind": "wave", "col": "#4fa8ff", "special": true, "pierce": true, "kb": 260.0, "life": 2.4})
		"mula_a": melee(f, 26, 1.9, 75, {"col": "#ff8a3d", "kb": 80.0}); f.cd_a = 0.5
		"mula_b": dash_atk(f, f.aim, 110, 0.3, 100, {"col": "#ff6a13", "kb": 220.0}); f.cd_b = 5
		"mula_c": f.channel = {"t": 1.6, "tick": 0.0, "kind": "flame", "col": "#ff6a13"}
		"yeti_a": melee(f, 28, 1.8, 80, {"col": "#dff3ff", "kb": 90.0}); f.cd_a = 0.55
		"yeti_b": shoot(f, f.aim, {"sp": 130, "r": 8, "base": 100, "kind": "snow", "col": "#ffffff", "stun": 0.7, "life": 1.6}); f.cd_b = 5
		"yeti_c": zone(f, t.pos, 40, {"delay": 0.9, "base": 250, "special": true, "freeze": 1.5, "col": "#9fe3ff", "kind": "blast"})
		"zeus_a": shoot(f, f.aim, {"sp": 280, "r": 3, "base": 50, "kind": "spark", "col": "#ffe14d", "fall": true}); f.cd_a = 0.35
		"zeus_b": zone(f, Vector2(cxl(t.pos.x), cyl(t.pos.y)), 30, {"delay": 0.3, "dur": 3.0, "once": false, "tick": 0.5, "base": 24, "col": "#b9a6ff", "kind": "area"}); f.cd_b = 5
		"zeus_c": zone(f, t.pos, 22, {"delay": 0.8, "base": 260, "special": true, "stun": 0.5, "col": "#ffe14d", "kind": "bolt"})
		"dracula_a": melee(f, 24, 1.7, 70, {"col": "#ff4d6a"}); f.cd_a = 0.42
		"dracula_b":
			for dd in [-0.3, 0.0, 0.3]:
				shoot(f, f.aim + dd, {"sp": 190, "r": 3, "base": 40, "kind": "bat", "col": "#2a1830", "life": 1.0})
			f.cd_b = 5
		"dracula_c": f.drain = 6; f.haste = 6; popup(f.pos - Vector2(0, 34), "SEDE DE SANGUE!", "#ff7a9a")


func c_swap(f: Fighter) -> void:
	var t := f.foe
	var p0 := f.pos
	sparks(p0, "#e0393e", 20, 120)
	sparks(t.pos, "#e0393e", 20, 120)
	f.pos = t.pos
	t.pos = p0
	var stolen := minf(40, t.charge)
	t.charge -= stolen
	hit(f, t, 200, {"special": true, "stun": 0.6, "col": "#e0393e"})
	f.charge = stolen


func gen_a(f: Fighter) -> void:
	var k: Dictionary = f.d["kit"]["A"]
	var c: String = ELCOL[f.d["el"]]
	if k["t"] == "melee":
		var r: float = k.get("r", 26)
		melee(f, r, 1.1 if r > 30 else 1.8, 75, {"col": c, "kb": 80.0})
		f.cd_a = 0.5
	else:
		var n: int = int(k.get("spread", 1))
		for i in n:
			shoot(f, f.aim + (i - (n - 1) / 2.0) * 0.22, {"sp": 225 if k.get("kind") == "arrow" else 200, "r": 3, "base": 30 if n > 1 else 55,
				"kind": k.get("kind", "orb"), "col": c, "fall": true, "ret": k.get("ret", 0), "life": 1.4 if k.get("ret", 0) else 1.2})
		f.cd_a = 0.5 if n > 1 else 0.42


func gen_b(f: Fighter, t: String) -> void:
	var c: String = ELCOL[f.d["el"]]
	var o := f.foe
	match t:
		"dash":
			dash_atk(f, f.aim, 100, 0.28, 90, {"col": c, "kb": 180.0})
		"blink":
			var a := (o.pos - f.pos).angle() if f.d["melee"] else f.aim + PI
			sparks(f.pos - Vector2(0, 8), c, 14)
			if f.d["melee"]:
				f.pos = Vector2(cxl(o.pos.x - cos(a) * 14), cyl(o.pos.y - sin(a) * 14))
				f.cd_a = 0
			else:
				f.pos = Vector2(cxl(f.pos.x + cos(a) * 90), cyl(f.pos.y + sin(a) * 90))
			sparks(f.pos - Vector2(0, 8), c, 14)
			f.inv = 0.25
		"shield":
			f.shield_t = 2.2
		"stealth":
			f.ghost = 1.8; f.inv = 0.9; f.haste = maxf(f.haste, 1.8)
		"decoy":
			G["decoys"].append({"p": f.pos, "owner": f, "t": 2.5, "face": f.face})
			var a := f.aim + PI / 2 * (1 if randf() < 0.5 else -1)
			f.pos = Vector2(cxl(f.pos.x + cos(a) * 55), cyl(f.pos.y + sin(a) * 55))
			f.ghost = 0.8; f.inv = 0.3
		"pull":
			shoot(f, f.aim, {"sp": 200, "r": 6, "base": 70, "kind": "ring", "col": c, "pull": 220.0, "stun": 0.4, "life": 0.9})
		"root":
			shoot(f, f.aim, {"sp": 180, "r": 5, "base": 60, "kind": "web", "col": "#f2f2f2", "stun": 1.0, "life": 1.1})
		"mark":
			o.marked = 5; o.slow_t = 1.5; o.slow_f = 0.75
			popup(o.pos - Vector2(0, 36), "MARCADO", "#ffd23f")
		"stun":
			melee(f, 52, 1.3, 50, {"col": c, "stun": 0.8})
		"zone":
			zone(f, Vector2(cxl(o.pos.x), cyl(o.pos.y)), 30, {"delay": 0.3, "dur": 3.0, "once": false, "tick": 0.5, "base": 24, "col": c, "kind": "area"})
		"volley":
			for k in [-0.3, 0.0, 0.3]:
				shoot(f, f.aim + k, {"sp": 200, "r": 3, "base": 40, "kind": "orb", "col": c, "life": 1.0})
		"buff":
			f.hp = minf(1000, f.hp + BAL["buff_b"]); f.haste = 2
			popup(f.pos - Vector2(0, 26), "+%d" % BAL["buff_b"], "#46d160")
		"spin":
			f.spin = 0.3
			zone(f, f.pos - Vector2(0, 4), 32, {"delay": 0.0, "base": 90, "col": c, "kb": 180.0, "kind": "nova"})
		"summon":
			for i in 2:
				shoot(f, f.aim + (0.7 if i else -0.7), {"sp": 120, "r": 4, "base": 50, "kind": "orb", "col": c, "life": 2.6, "home": true})
		"copy":
			var ft: String = "dash" if o.d["hand"] else o.d["kit"]["B"]
			gen_b(f, "dash" if ft == "copy" else ft)
		_:
			shoot(f, f.aim, {"sp": 160, "r": 7, "base": 100, "kind": "orb", "col": c, "stun": 0.5, "life": 1.4, "ret": f.d["kit"].get("Bret", 0)})


func gen_c(f: Fighter, t: String) -> void:
	var c: String = ELCOL[f.d["el"]]
	var o := f.foe
	match t:
		"swap":
			c_swap(f)
		"copy":
			var ft: String = "bigzone" if o.d["hand"] else o.d["kit"]["C"]
			gen_c(f, "bigzone" if ft == "copy" else ft)
		"heal":
			f.hp = minf(1000, f.hp + BAL["heal_c"]); f.shield_t = 1.5
			popup(f.pos - Vector2(0, 26), "+%d" % BAL["heal_c"], "#46d160")
			sparks(f.pos - Vector2(0, 8), "#46d160", 24, 100)
		"drain":
			f.drain = 6; f.haste = 6
		"rage":
			f.power = 6; f.haste = 6; f.big = 6
		"fortress":
			f.shield_t = 3; f.reflect = 3
		"flurry":
			f.flurry = {"n": 5, "t": 0.0}
		"beam":
			f.channel = {"t": 1.3, "tick": 0.0, "kind": "beam", "col": c}
		"cone":
			f.channel = {"t": 1.6, "tick": 0.0, "kind": "flame", "col": c}
		"wave":
			shoot(f, f.aim, {"sp": 160, "r": 22, "base": 250, "kind": "wave", "col": c, "special": true, "pierce": true, "kb": 240.0, "life": 2.4})
		"summon":
			for i in 5:
				shoot(f, f.aim + (i - 2) * 0.5, {"sp": 110 + i * 8, "r": 4, "base": 55, "kind": "orb", "col": c, "special": true, "life": 3.0, "home": true})
		"trap":
			shoot(f, f.aim, {"sp": 170, "r": 9, "base": 200, "kind": "orb", "col": c, "special": true, "freeze": 1.5, "life": 1.6})
		"storm":
			for i in 6:
				zone(f, Vector2(cxl(o.pos.x + randf_range(-30, 30)), cyl(o.pos.y + randf_range(-24, 24))), 18, {"delay": 0.5 + i * 0.2, "base": 75, "special": true, "col": c, "kind": "bolt"})
		"nova":
			zone(f, f.pos - Vector2(0, 4), 58, {"delay": 0.35, "base": 230, "special": true, "col": c, "kb": 220.0, "kind": "nova"})
		_:
			zone(f, o.pos, 38, {"delay": 0.85, "base": 250, "special": true, "stun": 0.5, "col": c, "kind": "blast"})


func announce(f: Fighter, i: int) -> void:
	if not f.d["hand"]:
		popup(f.pos - Vector2(0, 36), (f.d["pw"][i] as String).to_upper(), ELCOL.get(f.d["el"], "#ffffff"), "", 6)


func can_act(f: Fighter) -> bool:
	return not f.blocking and f.stun <= 0 and f.dash_t <= 0 and f.channel.is_empty()


func do_a(f: Fighter) -> void:
	if f.cd_a > 0 or not can_act(f):
		return
	tut_ev(f, "a")
	f.reveal_t = maxf(f.reveal_t, 0.6)
	if f.d["hand"]:
		pow_hand(f, "a")
	else:
		gen_a(f)
	if not f.d["melee"]:
		f.fire_t = BAL["fire_slow"][0]


func do_b(f: Fighter) -> void:
	if f.cd_b > 0 or not can_act(f):
		return
	tut_ev(f, "b")
	f.reveal_t = maxf(f.reveal_t, 0.6)
	if f.d["hand"]:
		pow_hand(f, "b")
	else:
		gen_b(f, f.d["kit"]["B"])
		f.cd_b = 5
		announce(f, 1)


func do_c(f: Fighter) -> void:
	if f.charge < 100 or not can_act(f):
		return
	tut_ev(f, "c")
	stat(f, "specials", 1)
	f.reveal_t = maxf(f.reveal_t, 1.0)
	f.charge = 0
	G["shake"] = maxf(G["shake"], 3)
	if f.d["hand"]:
		pow_hand(f, "c")
	else:
		gen_c(f, f.d["kit"]["C"])
		announce(f, 2)


func do_dash(f: Fighter, ang: float) -> void:
	if f.cd_dash > 0 or f.stun > 0 or f.dash_t > 0 or not f.channel.is_empty():
		return
	tut_ev(f, "dash")
	f.blocking = false
	var dd: float = BAL["melee_dash"][0] if f.d["melee"] else 60.0
	f.dash_t = 0.2
	f.dash_v = Vector2(cos(ang), sin(ang)) * dd / 0.2
	f.inv = 0.2 + (0.05 if f.st["esq"] >= 100 else 0.0)
	var fc: Dictionary = save["cos"]["eq"] if f == G.get("p") else f.cos
	if fc.get("trail", null) != null:
		var cc := cos_find(fc["trail"])
		for k in 10:
			G["parts"].append({"p": f.pos + Vector2(randf_range(-4, 4), -8 + randf_range(-6, 6)), "v": -Vector2(cos(ang), sin(ang)) * randf_range(20, 60), "life": 0.5, "t": 0.0, "col": cos_color(cc["col"], time + k * 0.1), "sz": 2.0})
	f.dodged = false
	f.cd_dash = f.dash_cd * (BAL["melee_dash"][1] if f.d["melee"] else 1.0)
	f.dash_atk = {}


# ---------- IA DO BOT ----------
func bot_think(f: Fighter, dt: float) -> void:
	var t := f.foe
	var ai := f.ai
	if f.blind and t != null:
		if ai["lx"] == null or f.pos.distance_to(Vector2(ai["lx"], ai["ly"])) < 20:
			var z0: Rect2 = G["zone"]
			ai["lx"] = randf_range(z0.position.x + 40, z0.end.x - 40)
			ai["ly"] = randf_range(z0.position.y + 40, z0.end.y - 40)
		var wa := (Vector2(ai["lx"], ai["ly"]) - f.pos).angle()
		f.mv = Vector2(cos(wa), sin(wa)) * 0.8
		f.aim = wa
		f.blocking = false
		return
	if t != null:
		ai["lx"] = t.pos.x + randf_range(-20, 20)
		ai["ly"] = t.pos.y + randf_range(-20, 20)
	ai["block_t"] = maxf(0, ai["block_t"] - dt)
	if f.blocking and ai["block_t"] <= 0:
		f.blocking = false
	if not f.blocking and f.broken <= 0 and f.guard > f.guard_max * 0.35 and f.dash_t <= 0 and f.channel.is_empty():
		var threat := false
		var close := false
		for p in G["proj"]:
			if p["owner"] == f:
				continue
			var rv: Vector2 = f.pos - Vector2(0, 8) - p["p"]
			var pd := rv.length()
			if pd < 90 and rv.normalized().dot((p["v"] as Vector2).normalized()) > 0.85:
				threat = true
				if pd < 22:
					close = true
		if t.d["melee"] and f.pos.distance_to(t.pos) < 34 and t.cd_a > 0.3:
			threat = true
		if threat and (f.cd_dash > 0 or randf() < 0.5) and randf() < (0.04 if close else 0.025):
			f.blocking = true
			f.block_start = time if close else time - 0.3
			ai["block_t"] = randf_range(0.35, 0.8)
	if f.blocking:
		f.aim = (t.pos - f.pos).angle()
		f.mv = -(t.pos - f.pos).normalized() * 0.3
		return
	var dv := t.pos - f.pos
	var d := dv.length()
	var ang := dv.angle()
	var lead := 0.0 if f.d["melee"] else clampf(d / 220.0, 0, 0.6)
	f.aim = (t.pos + t.vel * lead * 0.5 - f.pos).angle()
	for dc in G["decoys"]:
		if dc["owner"] == t and dc["t"] > 1:
			f.aim = (dc["p"] - f.pos).angle()
	ai["strafe_t"] -= dt
	if ai["strafe_t"] <= 0:
		ai["strafe"] = -1.0 if randf() < 0.5 else 1.0
		ai["strafe_t"] = randf_range(0.8, 2.0)
	var kite: bool = not f.d["melee"]
	var pref: float = 18.0 if f.d["melee"] else f.d["range"] * 0.95
	var m := Vector2.ZERO
	if kite and t.d["melee"] and d < 90:
		m -= Vector2(cos(ang), sin(ang)) * 1.6
		if d < 50 and f.cd_dash <= 0 and randf() < 0.2:
			do_dash(f, ang + PI + randf_range(-0.6, 0.6))
	if d > pref + 15:
		m += Vector2(cos(ang), sin(ang))
	elif d < pref - 15:
		m -= Vector2(cos(ang), sin(ang))
	m += Vector2(cos(ang + PI / 2), sin(ang + PI / 2)) * ai["strafe"] * 0.7
	var z: Rect2 = G["zone"]
	if f.pos.x < z.position.x + 24 or f.pos.x > z.end.x - 24 or f.pos.y < z.position.y + 24 or f.pos.y > z.end.y - 24:
		m += (z.get_center() - f.pos).normalized() * 1.5
	var look := f.pos + m * 20
	var danger := false
	for r in G["hz"]["lava"]:
		if (r as Rect2).grow(8).has_point(look):
			danger = true
	for b in G["hz"]["beam"]:
		if beam_state(b) != "off" and absf(look.x - (b[0] + b[1] / 2)) < b[1] / 2 + 8:
			danger = true
	if danger:
		m = -m + Vector2(cos(ang + PI / 2), sin(ang + PI / 2)) * ai["strafe"]
	f.mv = m.normalized()
	for p in G["proj"]:
		if p["owner"] == f:
			continue
		var rv: Vector2 = f.pos - Vector2(0, 8) - p["p"]
		if rv.length() < 70 and rv.normalized().dot((p["v"] as Vector2).normalized()) > 0.85 and f.cd_dash <= 0 and randf() < 0.035:
			do_dash(f, (p["v"] as Vector2).angle() + (PI / 2 if randf() < 0.5 else -PI / 2))
			break
	for zn in G["zones"]:
		if zn["owner"] != f and zn["t"] < zn["delay"] and f.pos.distance_to(zn["p"]) < zn["r"] + 6 and f.cd_dash <= 0 and randf() < 0.06:
			do_dash(f, (f.pos - zn["p"]).angle())
	if f.d["melee"] and d > 70 and f.cd_dash <= 0 and randf() < BAL["gap_dash"]:
		do_dash(f, ang)
	ai["react"] -= dt
	if ai["react"] > 0:
		return
	ai["react"] = randf_range(0.18, 0.38) * BAL["react"] / float(G.get("diff", 1.0))
	var in_range: bool = d < (f.d["range"] + 10 if f.d["melee"] else f.d["range"] + 30)
	if in_range and randf() < minf(0.9, 0.65 * float(G.get("diff", 1.0))):
		do_a(f)
	ai["think_b"] -= 0.15
	if f.cd_b <= 0 and ai["think_b"] <= 0 and d < (120.0 if f.d["melee"] else 200.0):
		do_b(f)
		ai["think_b"] = randf_range(1, 3)
	if f.charge >= 100 and d < (70.0 if f.d["melee"] else 220.0) and randf() < 0.5:
		do_c(f)


func tip(key: String, txt: String) -> void:
	var tp: Dictionary = G["tips"]
	if not tp["on"] or tp["done"].has(key):
		return
	tp["done"][key] = true
	tp["q"].append({"txt": txt, "t": 0.0})


func update_tips(dt: float) -> void:
	var tp: Dictionary = G.get("tips", {})
	if tp.is_empty() or not tp["on"]:
		return
	var p: Fighter = G["p"]
	G["ftime"] = float(G["ftime"]) + dt
	var ft: float = G["ftime"]
	tip("move", "Arraste o joystick à esquerda para andar" if is_touch else "Ande com WASD e mire com o mouse")
	if ft > 4:
		tip("a", "Toque em A para atacar (mira automática)" if is_touch else "Clique para usar o ataque A")
	if ft > 9:
		tip("b", "B é sua habilidade: ela tem recarga" if is_touch else "Aperte E para usar a habilidade B")
	if p.charge >= 100:
		tip("c", "Especial pronto! Toque em C" if is_touch else "Especial pronto! Aperte Q")
	for pr in G["proj"]:
		if (pr["owner"] as Fighter).team != p.team and (pr["p"] as Vector2).distance_to(p.pos - Vector2(0, 8)) < 80:
			tip("blk", "Segure BLOQ virado para o ataque. Na hora exata, rebate!" if is_touch else "Segure Shift para bloquear. Na hora exata, rebate o tiro!")
	if ft > 14:
		tip("dash", "DASH desvia de tudo por um instante" if is_touch else "Espaço dá um dash e desvia de tudo por um instante")
	if p.cover >= 0:
		tip("cover", "Escondido! O rival não te vê aqui dentro")
	if (tp.get("cur", {}) as Dictionary).is_empty() and tp["q"].size() > 0:
		tp["cur"] = tp["q"].pop_front()
	if not (tp.get("cur", {}) as Dictionary).is_empty():
		tp["cur"]["t"] = float(tp["cur"]["t"]) + dt
		if tp["cur"]["t"] > 3.6:
			tp["cur"] = {}


func auto_aim(f: Fighter) -> float:
	var t := f.foe
	var lead := 0.0 if f.d["melee"] else clampf(f.pos.distance_to(t.pos) / 250.0, 0, 0.5)
	return (t.pos + t.vel * lead * 0.4 - f.pos).angle()


# =====================================================================
# ATUALIZAÇÃO
func update_fighter(f: Fighter, dt: float) -> void:
	f.cd_a = maxf(0, f.cd_a - dt * BAL["atk_rate"])
	f.cd_b = maxf(0, f.cd_b - dt * BAL["b_rate"])
	for k in ["cd_dash", "inv", "flash", "stun", "freeze", "drain", "haste", "tp_cd", "spin",
			"shield_t", "ghost", "power", "marked", "reflect", "big", "fire_t", "reveal_t"]:
		f.set(k, maxf(0, f.get(k) - dt))
	f.slow_t = maxf(0, f.slow_t - dt)
	if f.slow_t <= 0:
		f.slow_f = 1.0
	if f.broken > 0:
		f.broken -= dt
		if f.broken <= 0:
			f.guard = f.guard_max * 0.5
	f.guard_regen = maxf(0, f.guard_regen - dt)
	if not f.blocking and f.guard_regen <= 0 and f.broken <= 0:
		f.guard = minf(f.guard_max, f.guard + f.guard_max * 0.3 * dt)
	if not G["over"]:
		f.charge = minf(100, f.charge + f.st["esp"] / 30.0 * dt * BAL["charge_rate"])
	var mv := Vector2.ZERO
	if f.remote:
		mv = net_remote_input(f)
	elif not f.bot:
		if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP): mv.y -= 1
		if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN): mv.y += 1
		if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT): mv.x -= 1
		if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): mv.x += 1
		if touch["joy"] != -1:
			mv = touch["joy_v"]
		if mv.length() > 1:
			mv = mv.normalized()
		f.aim = auto_aim(f) if is_touch else (get_local_mouse_position() + cam - (f.pos - Vector2(0, 8))).angle()
		var want_block: bool = not G["over"] and f.stun <= 0 and f.dash_t <= 0 and f.channel.is_empty() and f.broken <= 0 and (
			Input.is_physical_key_pressed(KEY_SHIFT) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or touch["blk"] != -1)
		if want_block and not f.blocking:
			f.block_start = time
		f.blocking = want_block
		if f.blocking:
			f.aim = (f.foe.pos - f.pos).angle()
		if not G["over"] and f.stun <= 0:
			if (Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) and not is_touch) or touch["a"] != -1:
				do_a(f)
			if pressed["b"]: do_b(f)
			if pressed["c"]: do_c(f)
			if pressed["dash"]:
				do_dash(f, mv.angle() if mv.length() > 0.2 else f.aim)
	elif not G["over"] and f.stun <= 0 and not f.dummy:
		bot_think(f, dt)
		mv = f.mv
	if f.stun > 0 or G["over"]:
		mv = Vector2.ZERO
		f.blocking = false
	f.face = 1.0 if cos(f.aim) >= 0 else -1.0
	# canal (chamas ou feixe)
	if not f.channel.is_empty():
		var ch := f.channel
		ch["t"] -= dt
		ch["tick"] -= dt
		mv *= 0.1 if ch["kind"] == "beam" else 0.3
		var dirv := Vector2(cos(f.aim), sin(f.aim))
		if ch["kind"] == "beam":
			for i in 2:
				var r := randf_range(10, 170)
				G["parts"].append({"p": f.pos - Vector2(0, 8) + dirv * r, "v": Vector2(randf_range(-20, 20), randf_range(-20, 20)), "life": 0.25, "t": 0.0, "col": "#ffffff" if randf() < 0.5 else ch["col"], "sz": 2.0})
			if ch["tick"] <= 0:
				ch["tick"] = 0.1
				var rv := f.foe.pos - f.pos
				var along := rv.dot(dirv)
				var perp := absf(rv.cross(dirv))
				if along > 0 and along < 175 and perp < 10:
					hit(f, f.foe, 19, {"special": true, "col": ch["col"], "from": f.pos - Vector2(0, 8)})
		else:
			for i in 3:
				var a := f.aim + randf_range(-0.35, 0.35)
				G["parts"].append({"p": f.pos + dirv * 10 - Vector2(0, 10), "v": Vector2(cos(a), sin(a)) * randf_range(80, 150), "life": 0.45, "t": 0.0, "col": ch["col"] if randf() < 0.5 else "#ffd23f", "sz": 2.0})
			if ch["tick"] <= 0:
				ch["tick"] = 0.1
				var t := f.foe
				if f.pos.distance_to(t.pos) < 88 and ang_diff((t.pos - f.pos).angle(), f.aim) < 0.55:
					hit(f, t, 22, {"special": true, "col": ch["col"], "from": f.pos - Vector2(0, 8)})
		if ch["t"] <= 0 or f.stun > 0:
			f.channel = {}
	# sequência de golpes
	if not f.flurry.is_empty() and f.dash_t <= 0 and not G["over"]:
		f.flurry["t"] -= dt
		if f.flurry["t"] <= 0:
			if f.stun > 0 or f.flurry["n"] <= 0:
				f.flurry = {}
			else:
				var t := f.foe
				var a := (t.pos - f.pos).angle() + randf_range(-0.3, 0.3)
				dash_atk(f, a, minf(70, f.pos.distance_to(t.pos) + 20), 0.12, 60, {"special": true, "col": ELCOL[f.d["el"]], "kb": 60.0})
				f.flurry["n"] -= 1
				f.flurry["t"] = 0.06
	# movimento
	var on_ice := false
	for r in G["hz"]["ice"]:
		if (r as Rect2).has_point(f.pos):
			on_ice = true
	var acc := 2.2 if on_ice else 14.0
	var sp := f.speed * f.slow_f * (BAL["fire_slow"][1] if f.fire_t > 0 else 1.0) * (1.25 if f.haste > 0 else 1.0) * (0.4 if f.blocking else 1.0)
	if f.dash_t > 0:
		f.dash_t -= dt
		f.vel = f.dash_v
		f.trail.append({"p": f.pos, "t": 0.0})
		if not f.dash_atk.is_empty() and not f.dash_atk["done"]:
			for en: Fighter in enemies_of(f):
				if f.pos.distance_to(en.pos) < 16:
					f.dash_atk["done"] = true
					var o: Dictionary = (f.dash_atk["o"] as Dictionary).duplicate()
					o["kba"] = f.dash_v.angle()
					hit(f, en, f.dash_atk["base"], o)
					break
		if f.dash_t <= 0:
			f.vel *= 0.3
			f.dash_atk = {}
	else:
		f.vel = f.vel.lerp(mv * sp, clampf(acc * dt, 0, 1))
	for c in G["hz"]["cur"]:
		if (c[0] as Rect2).has_point(f.pos):
			f.pos += c[1] * 55 * dt
	f.pos += f.vel * dt
	f.pos.x = clampf(f.pos.x, BX1 + 7, BX2 - 7)
	f.pos.y = clampf(f.pos.y, BY1 + 16, BY2 - 2)
	f.walk = f.walk + dt * 12 if f.vel.length() > 15 else 0.0
	for tr in f.trail:
		tr["t"] += dt
	f.trail = f.trail.filter(func(tr): return tr["t"] < 0.18)
	# perigos
	for r in G["hz"]["lava"]:
		if (r as Rect2).has_point(f.pos):
			env_damage(f, 60, dt, "#ff6a13")
	for b in G["hz"]["beam"]:
		if beam_state(b) == "on" and absf(f.pos.x - (b[0] + b[1] / 2)) < b[1] / 2:
			env_damage(f, 110, dt, "#ffe14d")
	if f.tp_cd <= 0:
		for m in G["hz"]["mush"]:
			if f.pos.distance_to(m[0]) < 9:
				var other: Array = G["hz"]["mush"][m[1]]
				sparks(f.pos - Vector2(0, 6), "#ff7ad9", 14, 80)
				f.pos = other[0] + Vector2(0, 12)
				sparks(f.pos - Vector2(0, 6), "#ff7ad9", 14, 80)
				f.tp_cd = 2.0
				break
	if not (G["zone"] as Rect2).has_point(f.pos):
		env_damage(f, 55, dt, "#ff5a5a")


func _process(delta: float) -> void:
	var dt := minf(0.05, delta)
	time += dt
	match state:
		"countdown":
			cd_t -= dt
			if cd_t <= 0:
				state = "fight"
		"draw":
			draw_t += dt
			if draw_t > 1.6: revealed[0] = true
			if draw_t > 3.0: revealed[1] = true
			if draw_t > 4.3: revealed[2] = true
		"result":
			result_t += dt
		"prep":
			update_prep(dt)
		"box":
			if not box_anim.is_empty():
				box_anim["t"] = float(box_anim["t"]) + dt
		"fight":
			if G.get("net", false) and net["role"] == "client":
				net_client_update(dt)
			elif not paused or G.get("net", false):
				update_fight(dt)
	net_poll(dt)
	queue_redraw()


func update_fight(dt: float) -> void:
	if G["hitstop"] > 0:
		G["hitstop"] -= dt
		dt *= 0.15 if G["over"] else 0.05
	if not G["over"]:
		G["time"] -= dt
		if G["time"] <= 0:
			G["time"] = 0.0
			var sm := {}
			for x: Fighter in G["all"]:
				sm[x.team] = float(sm.get(x.team, 0.0)) + (0.0 if x.dead else x.hp)
			var pl: Fighter = G["p"]
			var bt: int = pl.team
			for k in sm:
				if sm[k] > sm[bt]:
					bt = k
			if bt == pl.team:
				end_match(pl)
			else:
				var best: Fighter = null
				for x: Fighter in G["all"]:
					if x.team == bt and (best == null or x.hp > best.hp):
						best = x
				end_match(best)
		G["shrink_t"] -= dt
		if G["shrink_t"] <= 0:
			G["shrink_t"] = 25.0
			var z: Rect2 = G["zt"]
			if z.size.x > 260:
				G["zt"] = z.grow_individual(-z.size.x * 0.07, -z.size.y * 0.07, -z.size.x * 0.07, -z.size.y * 0.07)
				popup(cam + Vector2(W / 2, 70), "A ARENA ESTÁ FECHANDO", "#ff8a3d")
	var zc: Rect2 = G["zone"]
	var zt: Rect2 = G["zt"]
	var k := clampf(dt * 0.4, 0, 1)
	G["zone"] = Rect2(zc.position.lerp(zt.position, k), zc.size.lerp(zt.size, k))
	var all: Array = G["all"]
	var covers: Array = G["covers"]
	for f: Fighter in all:
		f.cover = -1
		if f.dead:
			continue
		for ci in covers.size():
			if (f.pos - Vector2(0, 4)).distance_to(covers[ci]["p"]) < float(covers[ci]["r"]) - 2:
				f.cover = ci
				break
	for f: Fighter in all:
		if f.dead:
			continue
		var en := enemies_of(f)
		var vis: Array = en.filter(func(e): return seen_by(e, f.team))
		var pool: Array = vis if vis.size() > 0 else en
		var bd := 1e9
		for e: Fighter in pool:
			var dd := f.pos.distance_to(e.pos)
			if dd < bd:
				bd = dd
				f.foe = e
		f.blind = vis.is_empty()
	var pl0: Fighter = G["p"]
	var fo: Fighter = pl0
	if pl0.dead:
		for x: Fighter in all:
			if not x.dead and x.team == pl0.team:
				fo = x
				break
	cam = cam.lerp(cam_clamp(fo.pos - Vector2(W / 2, H / 2 + 10)), clampf(dt * 6, 0, 1))
	update_tips(dt)
	if G.has("tut"):
		update_tut(dt)
	for f: Fighter in all:
		if not f.dead:
			update_fighter(f, dt)
	for i in all.size():
		for j in range(i + 1, all.size()):
			var fa: Fighter = all[i]
			var fb: Fighter = all[j]
			if fa.dead or fb.dead:
				continue
			var dv := fb.pos - fa.pos
			if dv.length() < 14 and fa.dash_t <= 0 and fb.dash_t <= 0:
				var push := dv.normalized() * (14 - dv.length()) / 2
				fa.pos -= push
				fb.pos += push
	# projéteis
	for pr in G["proj"]:
		pr["t"] += dt
		var tt: Fighter = (pr["owner"] as Fighter).foe
		if pr.get("home", false):
			var want: float = (tt.pos - Vector2(0, 8) - (pr["p"] as Vector2)).angle()
			var cur: float = (pr["v"] as Vector2).angle()
			cur += clampf(wrapf(want - cur, -PI, PI), -3 * dt, 3 * dt)
			pr["v"] = Vector2(cos(cur), sin(cur)) * (pr["v"] as Vector2).length()
			pr["ang"] = cur
		if pr.get("ret", 0) and pr["t"] > 0.45:
			if not pr.get("back", false):
				pr["back"] = true
				pr["hit"] = []
			var ow: Fighter = pr["owner"]
			pr["v"] = (ow.pos - Vector2(0, 8) - pr["p"]).normalized() * (pr["v"] as Vector2).length()
			if (ow.pos - Vector2(0, 8)).distance_to(pr["p"]) < 8:
				pr["dead"] = true
				continue
		pr["p"] += pr["v"] * dt
		if pr["kind"] == "fire" and randf() < 0.6:
			G["parts"].append({"p": pr["p"], "v": Vector2(randf_range(-10, 10), randf_range(-20, 0)), "life": 0.25, "t": 0.0, "col": "#ff6a13", "sz": 1.0})
		if pr["kind"] == "wave":
			G["parts"].append({"p": pr["p"] + Vector2(randf_range(-6, 6), randf_range(-pr["r"], pr["r"])), "v": -(pr["v"] as Vector2) * 0.2, "life": 0.4, "t": 0.0, "col": "#ffffff", "sz": 2.0})
		var pp: Vector2 = pr["p"]
		if pp.x < BX1 - 30 or pp.x > BX2 + 30 or pp.y < BY1 - 30 or pp.y > BY2 + 30 or pr["t"] > pr["life"]:
			pr["dead"] = true
			continue
		var t: Fighter = null
		for en: Fighter in enemies_of(pr["owner"]):
			if not (pr["hit"] as Array).has(en) and (en.pos - Vector2(0, 8)).distance_to(pp) < pr["r"] + 7:
				t = en
				break
		if t != null:
			(pr["hit"] as Array).append(t)
			var far: bool = pr.get("fall", false) and pr["t"] * (pr["v"] as Vector2).length() > 110
			var mulf: float = (BAL["proj_far"] if far else BAL["proj_near"]) if pr.get("fall", false) else 1.0
			var o := {"special": pr.get("special", false), "slow": pr.get("slow"), "stun": pr.get("stun", 0.0), "freeze": pr.get("freeze", 0.0),
				"pull": pr.get("pull", 0.0), "kb": pr.get("kb", 0.0), "col": pr["col"], "proj": true, "from": pp - (pr["v"] as Vector2) * 0.05}
			if pr.get("kb", 0.0) > 0:
				o["kba"] = (pr["v"] as Vector2).angle()
			var ok = hit(pr["owner"], t, pr["base"] * mulf, o)
			if ok is String and ok == "reflect":
				pr["owner"] = t
				pr["v"] = -(pr["v"] as Vector2) * 1.15
				pr["ang"] += PI
				pr["t"] = 0.0
				pr["hit"] = [t]
				continue
			if not pr.get("pierce", false):
				pr["dead"] = true
	G["proj"] = G["proj"].filter(func(x): return not x.get("dead", false))
	# zonas
	for z in G["zones"]:
		z["t"] += dt
		var targets: Array = enemies_of(z["owner"])
		if z["t"] >= z["delay"]:
			if z["once"] and not z["done"]:
				z["done"] = true
				G["shake"] = maxf(G["shake"], 6.0 if z.get("special", false) else 3.0)
				sparks(z["p"], z["col"], 30 if z.get("special", false) else 12, 160)
				for t: Fighter in targets:
					if t.pos.distance_to(z["p"]) < z["r"] + 6:
						hit(z["owner"], t, z["base"], {"special": z.get("special", false), "stun": z.get("stun", 0.0), "freeze": z.get("freeze", 0.0), "col": z["col"],
							"kb": z.get("kb", 0.0), "kba": (t.pos - z["p"]).angle(), "from": (z["owner"] as Fighter).pos - Vector2(0, 8)})
			if not z["once"]:
				z["tick_t"] -= dt
				if z["tick_t"] <= 0:
					z["tick_t"] = z["tick"]
					for t: Fighter in targets:
						if t.pos.distance_to(z["p"]) < z["r"] + 6:
							hit(z["owner"], t, z["base"], {"col": z["col"], "slow": [0.75, 0.6], "from": (z["owner"] as Fighter).pos - Vector2(0, 8)})
		if z["t"] > z["delay"] + z["dur"] + (0.35 if z["once"] else 0.0):
			z["dead"] = true
	G["zones"] = G["zones"].filter(func(x): return not x.get("dead", false))
	for d in G["decoys"]:
		d["t"] -= dt
	G["decoys"] = G["decoys"].filter(func(x): return x["t"] > 0)
	for s in G["slashes"]:
		s["t"] += dt
	G["slashes"] = G["slashes"].filter(func(x): return x["t"] < 0.14)
	for pt in G["parts"]:
		pt["t"] += dt
		pt["p"] += pt["v"] * dt
		pt["v"] *= 0.96
	G["parts"] = G["parts"].filter(func(x): return x["t"] < x["life"])
	for pp in G["pops"]:
		pp["t"] += dt
	G["pops"] = G["pops"].filter(func(x): return x["t"] < 0.9)
	G["shake"] = maxf(0, G["shake"] - dt * 20)
	for f: Fighter in G["all"]:
		f.emote_t = maxf(0, f.emote_t - dt)
		f.emote_cd = maxf(0, f.emote_cd - dt)
	if G.get("net", false) and net["role"] == "host":
		net_host_tick(dt)
	if G["over"]:
		G["ko_t"] += dt
		if G["ko_t"] > 1.6:
			if G.get("net", false) and net["role"] == "host":
				net_host_end()
			state = "result"
			result_t = 0.0
			finish_result()
	pressed["b"] = false
	pressed["c"] = false
	pressed["dash"] = false


func finish_result() -> void:
	var pl: Fighter = G["p"]
	var win: bool = (G["winner"] as Fighter).team == pl.team
	var id: String = pl.d["id"]
	var before := int(save["mastery"].get(id, 0))
	var ranked: bool = pick.get("ranked", false)
	var gain := (15 if G.get("ffa", false) else (12 if ranked else 10)) if win else 3
	save["mastery"][id] = before + gain
	save["games"] = int(save["games"]) + 1
	if win:
		save["wins"] = int(save["wins"]) + 1
	var rk := {}
	if ranked and not G.get("tour", false):
		if pick.get("online", false) and net["status"] == "on":
			rk = {"pending": true, "d": 0}
			net["rk_pending"] = rk
			net_send({"t": "rres", "win": win})
		else:
			rk = Ranked.result(save, win)
	# Duel Gold e Pó Mágico (só se ganham jogando)
	var kos := int(pl.stats.get("kos", 0))
	var gd_w := (70 if G.get("ffa", false) else 50) if win else 20
	gd_w += kos * 5 + (10 if ranked and win else 0)
	var wk_b := 0
	if win and id == week_legend()["id"]:
		wk_b = roundi(gd_w * WEEK_BONUS)
		gd_w += wk_b
	var po_w := 1 if (ranked and win) else (1 if randf() < (0.6 if win else 0.2) else 0)
	var reward := {}
	var gb := gem_of(before)
	var ga := gem_of(before + gain)
	if ga > gb:
		var ks := Items.base_ids()
		reward = Items.new_item(save, ks[randi() % ks.size()], [0, 1, 2, 2, 3, 3, 4, 4, 5][ga])
		save["inv"].append(reward)
		po_w += ga * 2
	save["gd"] = int(save["gd"]) + gd_w
	var lv_b := pass_level()
	save["pass"]["xp"] = int(save["pass"]["xp"]) + 100 + (50 if win else 0)
	save["po"] = int(save["po"]) + po_w
	save["shop"]["n"] = int(save["shop"].get("n", 0)) + 1
	if int(save["shop"]["n"]) >= 3:
		Items.shop_roll(save)
	var mode: String = ("Torneio · " + ROUNDS[int(T["r"])]) if G.get("tour", false) else ("Ranqueada" if ranked else ((("Online · ") if pick.get("online", false) else "") + MODES[pick.get("mode", "1x1")][1]))
	var opp: String = pick["foe"]["name"]
	if G.get("ffa", false):
		opp = "%d rivais" % (G["all"].size() - 1)
	elif G.get("multi", false):
		var nm: Array = []
		for c in pick["foes"]:
			nm.append(c["name"])
		opp = ", ".join(PackedStringArray(nm))
	var hist: Array = save.get("hist", [])
	hist.push_front({"m": mode, "c": id, "o": opp, "w": win, "g": gain, "r": (rk.get("d", null) if not rk.has("placement") else null)})
	if hist.size() > 30:
		hist.resize(30)
	save["hist"] = hist
	_persist()
	var stt: Dictionary = pl.stats
	var S := stx()
	S["kos"] = int(S["kos"]) + int(stt.get("kos", 0))
	S["spec"] = int(S["spec"]) + int(stt.get("specials", 0))
	S["perf"] = int(S["perf"]) + int(stt.get("perfect", 0))
	S["dodge"] = int(S["dodge"]) + int(stt.get("dodges", 0))
	if pick.get("online", false):
		S["online"] = int(S["online"]) + 1
	if win:
		if G.get("ffa", false):
			S["ffa"] = int(S["ffa"]) + 1
		S["wins_by"][id] = int(S["wins_by"].get(id, 0)) + 1
		S["el_wins"][pl.d["el"]] = 1
		var foes_l: Array = []
		if G.get("ffa", false):
			for f2: Fighter in G["all"]:
				if f2 != pl:
					foes_l.append(f2.d["id"])
		else:
			for c2 in pick["foes"]:
				foes_l.append(c2["id"])
		for fid in foes_l:
			S["wins_vs"][fid] = int(S["wins_vs"].get(fid, 0)) + 1
	var m_done := 0
	if not G.get("tour", false):
		m_done = miss_track({"win": win, "el": pl.d["el"], "spec": int(stt.get("specials", 0)), "perf": int(stt.get("perfect", 0)), "dodge": int(stt.get("dodges", 0)), "ko": int(stt.get("kos", 0)), "online": pick.get("online", false), "ffa": G.get("ffa", false), "team": not G.get("ffa", false) and G.get("multi", false)})
	if not pick.get("tut", false):
		stat_push(win)
	var tut_b := 0
	if pick.get("tut", false) and not save.get("tut_done", false):
		save["tut_done"] = true
		if win:
			tut_b = 100
			save["gd"] = int(save["gd"]) + 100
	var ach_new := ach_check()
	_persist()
	G["res"] = {"win": win, "gain": gain, "after": before + gain, "gem_up": ga > gb, "rk": rk, "gd": gd_w, "po": po_w, "reward": reward, "xp": 100 + (50 if win else 0), "pass_up": pass_level() > lv_b, "wk_b": wk_b, "m_done": m_done, "tut_b": tut_b, "ach_new": ach_new}


# =====================================================================
# DESENHO
func text(s: String, p: Vector2, size: int, c: String, align := HORIZONTAL_ALIGNMENT_LEFT, outline := "") -> void:
	var w := font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var x := p.x
	if align == HORIZONTAL_ALIGNMENT_CENTER:
		x -= w / 2
	elif align == HORIZONTAL_ALIGNMENT_RIGHT:
		x -= w
	var pos := Vector2(roundf(x), roundf(p.y))
	if outline != "":
		for o in [Vector2(-1, 0), Vector2(1, 0), Vector2(0, -1), Vector2(0, 1)]:
			draw_string(font, pos + o, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, Color.html(outline))
	draw_string(font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, Color.html(c))


func bar(r: Rect2, pct: float, c: String, back := "#262a46") -> void:
	draw_rect(r.grow(1), Color.html("#0b0c14"))
	draw_rect(r, Color.html(back))
	draw_rect(Rect2(r.position, Vector2(roundf(r.size.x * clampf(pct, 0, 1)), r.size.y)), Color.html(c))


func btn(id: String, r: Rect2, label: String, c: String, fg := "#0b0c14", size := 10) -> void:
	buttons.append({"id": id, "r": r})
	draw_rect(r.grow(2), Color.html("#0b0c14"))
	draw_rect(r, Color.html(c))
	draw_rect(Rect2(r.position.x, r.end.y - 3, r.size.x, 3), Color(0, 0, 0, 0.25))
	text(label, Vector2(r.get_center().x, r.get_center().y + size * 0.35), size, fg, HORIZONTAL_ALIGNMENT_CENTER)


func spr(id: String, p: Vector2, s := 1.0, face := 1.0, flash := false, alpha := 1.0, rot := 0.0) -> void:
	var tex: Texture2D = sprites[id][1 if flash else 0]
	_xf(p.round(), rot, Vector2(s * face, s))
	draw_texture(tex, Vector2(-tex.get_width() / 2.0, -tex.get_height()), Color(1, 1, 1, alpha))
	_xf(Vector2.ZERO)


func _xf(pos: Vector2, rot := 0.0, sc := Vector2.ONE) -> void:
	draw_set_transform_matrix(xf_base * Transform2D(rot, sc, 0.0, pos))


func _draw() -> void:
	buttons.clear()
	draw_rect(Rect2(0, 0, W, H), Color.html("#0b0c14"))
	match state:
		"title": draw_title()
		"draw": draw_draw()
		"modes": draw_modes()
		"profile": draw_profile()
		"album": draw_album()
		"bracket": draw_bracket()
		"shop": draw_shop()
		"bag": draw_bag()
		"box": draw_box()
		"prep": draw_prep()
		"options": draw_options()
		"howto": draw_howto()
		"rank_lobby": draw_rank_lobby()
		"leader": draw_leader()
		"account": draw_account()
		"pass": draw_pass()
		"online": draw_online()
		"lobby": draw_lobby()
		"room": draw_room()
		"queue": draw_queue()
		"missions": draw_missions()
		"borders": draw_borders()
		"ach": draw_ach()
		"icons": draw_icons()
		_:
			draw_game()
			if state == "countdown": draw_countdown()
			if state == "result": draw_result()
			if paused: draw_pause()
			if G.has("tut") and state in ["fight", "countdown"]: draw_tut()
	draw_modal()
	draw_ach_toast()


func draw_logo(c: Vector2) -> void:
	text("DUEL", c + Vector2(3, 3), 28, "#e0393e", HORIZONTAL_ALIGNMENT_CENTER)
	text("DUEL", c, 28, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("LEGENDS", c + Vector2(3, 27), 20, "#4f3f8f", HORIZONTAL_ALIGNMENT_CENTER)
	text("LEGENDS", c + Vector2(0, 24), 20, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var r := Rect2(c.x - 40, c.y + 32, 80, 16)
	draw_rect(r.grow(2), Color.html("#0b0c14"))
	draw_rect(r, Color.html("#e0393e"))
	text("ARENA", Vector2(c.x, c.y + 45), 12, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)


func draw_title() -> void:
	draw_texture(arena_tex["vulcao"], Vector2.ZERO)
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.55))
	var bb := sin(time * 4) * 2
	spr("saci", Vector2(110, 215 + bb), 2)
	spr("iara", Vector2(370, 215 - bb), 2, -1)
	draw_logo(Vector2(W / 2, 50))
	draw_title_extras()
	btn("modes", Rect2(24, 148, 128, 28), "CONTRA BOTS", "#ffd23f")
	btn("online", Rect2(160, 148, 128, 28), "ONLINE", "#4fd1ff")
	btn("album", Rect2(296, 150, 78, 24), "COLEÇÃO", "#2e3358", "#ffffff", 9)
	btn("profile", Rect2(380, 150, 78, 24), "PERFIL", "#2e3358", "#ffffff", 9)
	text("Ranqueada online: " + Ranked.label(save["rank"]), Vector2(8, 26), 9, Ranked.color(save["rank"]), HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")
	text("GD %d · Pó %d%s" % [int(save["gd"]), int(save["po"]), (" · %d caixa(s)!" % int(save["boxes"])) if int(save["boxes"]) > 0 else ""], Vector2(8, 38), 9, "#ffd23f", HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")
	btn("shop", Rect2(W / 2 - 206, 180, 76, 16), "LOJA", "#ffd23f", "#0b0c14", 8)
	btn("pass", Rect2(W / 2 - 124, 180, 76, 16), "PASSE", "#ffb02e", "#0b0c14", 8)
	btn("bag", Rect2(W / 2 - 42, 180, 76, 16), "MOCHILA", "#c77dff", "#0b0c14", 8)
	btn("howto", Rect2(W / 2 + 40, 180, 84, 16), "COMO JOGAR", "#2e3358", "#ffffff", 8)
	btn("options", Rect2(W / 2 + 130, 180, 76, 16), "OPÇÕES", "#2e3358", "#ffffff", 8)
	text("Gemas %d" % int(save["gems"]), Vector2(8, 50), 9, "#4fd1ff", HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")
	if int(save["boxes"]) > 0:
		btn("box", Rect2(W / 2 - 45, 202, 90, 14), "ABRIR CAIXA", "#ff8a3d", "#0b0c14", 7)
	text("v1.6 Godot", Vector2(W - 6, 248), 8, "#6a6f98", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	var nk: String = str(save["nick"]) if save.has("nick") else "CRIAR NOME"
	var fixed_nick: bool = save.has("nick") and not net.get("can_rename", false)
	btn("profile" if fixed_nick else "netnick", Rect2(W - 130, 4, 124, 14), nk, "#2e3358" if save.has("nick") else "#ffd23f", "#ffffff" if save.has("nick") else "#0b0c14", 7)
	portrait(W - 154, 2, 18, {})
	buttons.append({"id": "icons", "r": Rect2(W - 154, 2, 18, 18)})
	if str(save.get("user", "")) == "" and not save.get("acc_asked", false) and modal.is_empty():
		save["acc_asked"] = true
		save["nick_asked"] = true
		_persist()
		open_modal("NOVIDADE: CONTAS!" if save.has("nick") else "BEM-VINDO À ARENA!", ["Com uma conta, seu elo e seu ranking ficam salvos", "e você joga com eles em qualquer aparelho.", "A conta é obrigatória só na Ranqueada."], [["mod:accreg", "CRIAR CONTA", "#ffd23f"], ["mod:acclog", "ENTRAR", "#4fd1ff"], ["mod:x" if save.has("nick") else "mod:nick", "SEM CONTA", "#c9cbe6"]])
	var hint := "Joystick à esquerda · A, B, C, DASH e BLOQ à direita" if is_touch else "WASD mover · mouse mirar · clique A · E = B · Q = C · Espaço dash · Shift bloquear"
	text(hint, Vector2(W / 2, 262), 9, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Coleção %d/%d · Vitórias %d" % [save["seen"].size(), chars.size(), int(save["wins"])], Vector2(8, 14), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")


func card(c: Dictionary, r: Rect2, stats: bool) -> void:
	var rc: String = RAR[c["rar"]][1]
	draw_rect(r.grow(2), Color.html("#0b0c14"))
	draw_rect(r, Color.html("#141626"))
	draw_rect(r.grow(-1), Color.html(rc), false, 2.0)
	draw_rect(r.grow(-2), col(rc, 0.15 + 0.1 * sin(time * 5)))
	draw_rect(Rect2(r.get_center().x - 26, r.position.y + 6, 52, 11), Color.html(rc))
	text((c["rar"] as String).to_upper(), Vector2(r.get_center().x, r.position.y + 15), 8, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
	spr(c["id"], Vector2(r.get_center().x, r.position.y + (72 if stats else 76)), 2.6 if stats else 2.4)
	var nm: String = c["name"]
	text(nm, Vector2(r.get_center().x, r.position.y + (86 if stats else 92)), 9 if nm.length() > 14 else 11, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text(c["el"], Vector2(r.get_center().x, r.position.y + (99 if stats else 105)), 9, ELCOL[c["el"]], HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if stats:
		var rows := [["ATQ", c["atk"], "#ff6a3d"], ["DEF", c["def"], "#9aa3c7"], ["VEL", c["vel"], "#ffd23f"], ["ESP", c["esp"], "#4fc3ff"], ["ESQ", c["esq"], "#8ef0a0"]]
		for i in rows.size():
			var yy := r.position.y + 108 + i * 9
			text(rows[i][0], Vector2(r.position.x + 6, yy + 6), 7, "#c9cbe6")
			bar(Rect2(r.position.x + 30, yy + 1, r.size.x - 58, 5), (rows[i][1] - 40) / 60.0, rows[i][2])
			text(str(int(rows[i][1])), Vector2(r.end.x - 6, yy + 6), 7, "#ffffff", HORIZONTAL_ALIGNMENT_RIGHT)


func draw_draw() -> void:
	var a: Dictionary = pick["arena"]
	draw_texture(arena_tex[a["id"]], Vector2.ZERO)
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.78))
	text("SORTEIO", Vector2(W / 2, 22), 12, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("VOCÊ", Vector2(88, 44), 9, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if revealed[0] and pick.get("fixed", false):
		draw_rect(Rect2(22, 240, 132, 26), Color.html("#4fd1ff"))
		text("LENDA DO FIM DE SEMANA", Vector2(88, 251), 7, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
		text("escolhida na roleta", Vector2(88, 261), 8, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
	elif revealed[0] and pick["me"]["id"] == week_legend()["id"]:
		draw_rect(Rect2(22, 240, 132, 26), Color(1, 0.82, 0.25, 0.75 + 0.25 * sin(time * 6)))
		text("* LENDA DA SEMANA *", Vector2(88, 251), 7, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
		text("+%d%% de GD se vencer" % int(WEEK_BONUS * 100), Vector2(88, 261), 8, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
	if not revealed[0]:
		var c: Dictionary = chars[int(draw_t * 14) % chars.size()]
		draw_rect(Rect2(28, 50, 120, 160), Color.html("#141626"))
		spr(c["id"], Vector2(88, 150), 3, 1, false, 0.6)
		text("?", Vector2(88, 190), 18, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	else:
		card(pick["me"], Rect2(28, 50, 120, 160), true)
		var m := int(save["mastery"].get(pick["me"]["id"], 0))
		var gi := gem_of(m)
		text("%s · %d maestria" % [GEMS[gi], m], Vector2(88, 226), 9, GEMCOL[gi], HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		var al: Array = pick.get("allies", [])
		if al.size() > 0:
			var nm: Array = []
			for c in al:
				nm.append((c["name"] as String).left(12))
			text("Aliados: " + ", ".join(PackedStringArray(nm.slice(0, 2))), Vector2(88, 247), 8, "#7fc8ff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
			if nm.size() > 2:
				text(", ".join(PackedStringArray(nm.slice(2))), Vector2(88, 257), 8, "#7fc8ff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		if pick.get("ranked", false):
			text("RANQUEADA · " + Ranked.label(save["rank"]), Vector2(88, 247), 8, Ranked.color(save["rank"]), HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var md: String = pick.get("mode", "1x1")
	text("Ranqueada 1x1" if pick.get("ranked", false) else MODES[md][1], Vector2(W / 2, 34), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("RIVAIS" if md == "ffa" else ("EQUIPE RIVAL" if md != "1x1" else "OPONENTE"), Vector2(W / 2, 44), 9, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if not revealed[1]:
		var c2: Dictionary = chars[int(maxf(0, draw_t - 1.4) * 14 + 37) % chars.size()]
		draw_rect(Rect2(W / 2 - 50, 60, 100, 120), Color.html("#141626"))
		spr(c2["id"], Vector2(W / 2, 146), 2.4, -1, false, 0.6)
	else:
		card(pick["foe"], Rect2(W / 2 - 50, 60, 100, 120), false)
		var e := mult(pick["me"]["el"], pick["foe"]["el"])
		var e2 := mult(pick["foe"]["el"], pick["me"]["el"])
		var msg := "Você tem vantagem!" if e > 1 else ("Ele tem vantagem!" if e2 > 1 else "Elementos neutros")
		text(msg, Vector2(W / 2, 198), 10, "#8ef0a0" if e > 1 else ("#ff9a9a" if e2 > 1 else "#c9cbe6"), HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		var fo: Array = pick.get("foes", [])
		if fo.size() > 1:
			var nm2: Array = []
			for c in fo.slice(1):
				nm2.append((c["name"] as String).left(12))
			text("+ " + ", ".join(PackedStringArray(nm2)), Vector2(W / 2, 211), 7, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("ARENA", Vector2(392, 44), 9, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var ar := Rect2(332, 50, 120, 160)
	draw_rect(ar.grow(2), Color.html("#0b0c14"))
	draw_rect(ar, Color.html("#141626"))
	if not revealed[2]:
		var ra: Dictionary = ARENAS[int(draw_t * 12) % ARENAS.size()]
		draw_rect(Rect2(342, 70, 100, 60), Color.html(ra["tiles"][0]))
		text(ra["name"], Vector2(392, 150), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	else:
		draw_texture_rect_region(arena_tex[a["id"]], Rect2(338, 58, 108, 60), Rect2(120, 80, 240, 120))
		text(a["name"], Vector2(392, 134), 11, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		if a["el"] == "Neutro":
			text("Sem efeito de elemento", Vector2(392, 150), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		else:
			text("%s: +10%%" % a["el"], Vector2(392, 150), 9, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
			text("%s: −10%%" % ", ".join(PackedStringArray(weak_to(a["el"]))), Vector2(392, 162), 9, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER)
		var mp := arena_mod(a, pick["me"]["el"])
		text("Você: %s" % ("+10%" if mp > 1 else ("−10%" if mp < 1 else "sem efeito")), Vector2(392, 184), 9, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	if draw_t > 5.2:
		btn("fight", Rect2(W / 2 - 56, 222, 112, 24), "PREPARAR!", "#ffd23f", "#0b0c14", 11)
		if pick.get("online", false) and draw_t > 6.5 and state == "draw":
			enter_net_prep()


func draw_game() -> void:
	var a: Dictionary = G["arena"]
	var sh: float = G["shake"]
	var off := Vector2(randf_range(-sh, sh), randf_range(-sh, sh)).round() if sh > 0 else Vector2.ZERO
	xf_base = Transform2D(0.0, -cam.round())
	_xf(off)
	draw_rect(Rect2(-60, -80, WW + 120, WH + 160), Color.html(a["wall"]))
	draw_texture(G["bg"], Vector2.ZERO)
	var hz: Dictionary = G["hz"]
	for r in hz["lava"]:
		draw_rect((r as Rect2).grow(3), Color.html("#7a1f12"))
		draw_rect(r, Color.html("#ff6a13"))
		draw_rect((r as Rect2).grow(-5), Color.html("#ffa62b"))
	for r in hz["ice"]:
		draw_rect(r, Color(0.55, 0.78, 0.94, 0.55))
	for c in hz["cur"]:
		draw_rect(c[0], Color(0.47, 0.78, 1, 0.18))
	for b in hz["beam"]:
		var stt := beam_state(b)
		if stt == "warn":
			draw_rect(Rect2(b[0], BY1, b[1], BY2 - BY1), Color(1, 0.9, 0.3, 0.15))
		elif stt == "on":
			draw_rect(Rect2(b[0], BY1, b[1], BY2 - BY1), Color(1, 0.9, 0.3, 0.55))
	for m in hz["mush"]:
		draw_circle(m[0], 10, Color(1, 0.48, 0.85, 0.25))
		draw_rect(Rect2(m[0] - Vector2(6, 6), Vector2(12, 5)), Color.html("#e0393e"))
		draw_rect(Rect2(m[0] - Vector2(2, 1), Vector2(4, 6)), Color.html("#f5f0e6"))
	# zona que fecha
	var z: Rect2 = G["zone"]
	var red := Color(1, 0.23, 0.18, 0.22)
	draw_rect(Rect2(BX1, BY1, BX2 - BX1, z.position.y - BY1), red)
	draw_rect(Rect2(BX1, z.end.y, BX2 - BX1, BY2 - z.end.y), red)
	draw_rect(Rect2(BX1, z.position.y, z.position.x - BX1, z.size.y), red)
	draw_rect(Rect2(z.end.x, z.position.y, BX2 - z.end.x, z.size.y), red)
	if z.position.x > BX1 + 1:
		draw_rect(z, Color.html("#ff8a3d"), false, 2.0)
	# áreas de poder
	for zn in G["zones"]:
		var c := Color.html(zn["col"])
		if zn["t"] < zn["delay"]:
			draw_arc(zn["p"], zn["r"], 0, TAU, 32, c, 1.0)
			draw_circle(zn["p"], zn["r"] * zn["t"] / zn["delay"], Color(c, 0.25))
		elif not zn["once"]:
			draw_circle(zn["p"], zn["r"], Color(c, 0.25 + 0.08 * sin(time * 8)))
		else:
			var kk: float = 1.0 - (zn["t"] - zn["delay"]) / 0.35
			if kk > 0:
				if zn.get("kind") == "bolt":
					draw_rect(Rect2(zn["p"].x - 4, BY1, 8, zn["p"].y - BY1), Color(1, 0.97, 0.69, kk))
				draw_circle(zn["p"], zn["r"] * (1.2 - kk * 0.2), Color(c, kk))
	for d in G["decoys"]:
		spr(d["owner"].d["id"], d["p"] + off, 1, d["face"], false, 0.75)
	_xf(off)
	var pl_team: int = (G["p"] as Fighter).team
	var fs: Array = (G["all"] as Array).filter(func(x): return x.dead or seen_by(x, pl_team))
	fs.sort_custom(func(x, y): return x.pos.y < y.pos.y)
	for f: Fighter in fs:
		var fcs: Dictionary = save["cos"]["eq"] if f == G["p"] else f.cos
		if not f.dead and fcs.get("aura", null) != null:
			var ca := cos_find(fcs["aura"])
			_xf(off + f.pos, 0, Vector2(1, 0.36))
			draw_circle(Vector2.ZERO, 14, col(cos_color(ca["col"], time), 0.45 + 0.2 * sin(time * 5)))
		_xf(off + f.pos, 0, Vector2(1, 0.35))
		draw_circle(Vector2.ZERO, 8, Color(0, 0, 0, 0.35))
		_xf(off)
	for f: Fighter in fs:
		for tr in f.trail:
			spr(f.d["id"], tr["p"] + off, 1, f.face, true, 0.35 * (1 - tr["t"] / 0.18))
		var bob := -roundf(absf(sin(f.walk)) * 2) if f.walk > 0 else 0.0
		var ko: bool = f.dead or (G["over"] and (G["winner"] as Fighter).team != f.team)
		var rot := minf(1, G["ko_t"] * 3) * PI / 2 * -f.face if ko else 0.0
		var blink := f.inv > 0 and f.dash_t <= 0 and int(time * 30) % 2 == 0
		if f.freeze > 0:
			draw_rect(Rect2(f.pos.x - 10, f.pos.y - 22, 20, 22), Color(0.62, 0.89, 1, 0.55))
		if not blink:
			spr(f.d["id"], f.pos + Vector2(0, bob) + off, 1.35 if f.big > 0 and not f.dead else 1.0, f.face, f.flash > 0 and not f.dead, 0.5 if f.dead else (0.35 if f.ghost > 0 else 1.0), rot)
		_xf(off)
		if f.blocking:
			var perfect := time - f.block_start <= 0.22
			draw_arc(f.pos - Vector2(0, 9), 14, f.aim - 1.3, f.aim + 1.3, 16, Color.html("#ffd23f" if perfect else "#bfeaff"), 3.0)
		if f.shield_t > 0:
			draw_arc(f.pos - Vector2(0, 10), 15, 0, TAU, 32, Color.html("#ffd23f" if f.reflect > 0 else "#bfeaff"), 2.0)
		if f.marked > 0:
			draw_arc(f.pos - Vector2(0, 10), 11, 0, TAU, 24, Color.html("#ff4d4d"), 1.0)
		if f.guard < f.guard_max - 0.5 or f.broken > 0:
			bar(Rect2(f.pos.x - 10, f.pos.y + 4, 20, 2), f.guard / f.guard_max, "#ff4d4d" if f.broken > 0 else "#bfeaff")
		if f.stun > 0 and f.freeze <= 0:
			for i in 3:
				var aa := time * 6 + i * 2.1
				draw_rect(Rect2(f.pos.x + cos(aa) * 7 - 1, f.pos.y - 24 + sin(aa) * 2, 2, 2), Color.html("#ffd23f"))
		if not f.channel.is_empty() and f.channel["kind"] == "beam":
			var p0: Vector2 = f.pos - Vector2(0, 8) + Vector2(cos(f.aim), sin(f.aim)) * 8
			var p1: Vector2 = f.pos - Vector2(0, 8) + Vector2(cos(f.aim), sin(f.aim)) * 175
			draw_line(p0, p1, Color.html(f.channel["col"]), 7)
			draw_line(p0, p1, Color.WHITE, 2)
		if not f.dead:
			var me: bool = f == G["p"]
			var ally: bool = not me and f.team == (G["p"] as Fighter).team
			var lc: String = f.colr
			var lab := "VOCÊ" if me else (f.net_name.left(10) if (G.get("net", false) and f.net_name != "" and f.net_name != "Bot") else ("ALIADO" if ally else "BOT"))
			text(lab, f.pos - Vector2(0, 27), 7, lc, HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
			var fct: Dictionary = save["cos"]["eq"] if me else f.cos
			if fct.get("title", null) != null:
				var ct := cos_find(fct["title"])
				text(ct["n"], f.pos - Vector2(0, 34), 6, ct["col"], HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
			if f.emote_t > 0:
				var tw := f.emote.length() * 6 + 10
				draw_rect(Rect2(f.pos.x - tw / 2.0, f.pos.y - 52, tw, 13), Color.WHITE)
				draw_rect(Rect2(f.pos.x - 2, f.pos.y - 39, 4, 3), Color.WHITE)
				text(f.emote, f.pos - Vector2(0, 42), 8, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
			if G.get("multi", false) and not me:
				bar(Rect2(f.pos.x - 9, f.pos.y - 25, 18, 2), f.hp / 1000.0, lc)
	# esconderijos por cima dos personagens
	var covs: Array = G["covers"]
	var pl: Fighter = G["p"]
	for ci in covs.size():
		var cv: Dictionary = covs[ci]
		var al := 1.0
		if pl.cover == ci and not pl.dead:
			al = 0.45
		else:
			for x: Fighter in G["all"]:
				if x.cover == ci and not x.dead and x.team == pl.team:
					al = 0.7
		draw_cover(cv, a["id"], al)
	for pr in G["proj"]:
		var c := Color.html(pr["col"])
		var r: float = pr["r"]
		match pr["kind"]:
			"wave":
				_xf(off + pr["p"], pr["ang"])
				draw_rect(Rect2(-10, -r, 16, r * 2), Color(c, 0.75))
				draw_rect(Rect2(4, -r, 4, r * 2), Color(1, 1, 1, 0.8))
				_xf(off)
			"ring":
				draw_arc(pr["p"], r * (0.7 + 0.3 * sin(time * 20)), 0, TAU, 20, c, 2.0)
			"arrow", "spark", "shard":
				var dirv := (pr["v"] as Vector2).normalized()
				draw_line(pr["p"] - dirv * 6, pr["p"] + dirv * 4, c, 2.0)
			_:
				draw_rect(Rect2(pr["p"] - Vector2(r, r), Vector2(r * 2, r * 2)).grow(1), Color.html("#0b0c14"))
				draw_rect(Rect2(pr["p"] - Vector2(r, r), Vector2(r * 2, r * 2)), c)
				draw_rect(Rect2(pr["p"] - Vector2(r - 1, r - 1), Vector2(maxf(1, r - 1), maxf(1, r - 1))), Color(1, 1, 1, 0.7))
	for s in G["slashes"]:
		var kk: float = s["t"] / 0.14
		draw_arc(s["p"], s["r"] * (0.7 + kk * 0.4), s["ang"] - s["arc"] / 2, s["ang"] + s["arc"] / 2, 12, Color(Color.html(s["col"]), 1 - kk), 3.0)
	for pt in G["parts"]:
		var al: float = clampf(1 - pt["t"] / pt["life"], 0, 1)
		draw_rect(Rect2((pt["p"] as Vector2).round(), Vector2(pt["sz"], pt["sz"])), Color(Color.html(pt["col"]), al))
	for pp in G["pops"]:
		var kk: float = pp["t"] / 0.9
		var y: float = pp["p"].y - kk * 16
		text(pp["txt"], Vector2(pp["p"].x, y), pp["size"], pp["col"], HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		if pp["sub"] != "":
			text(pp["sub"], Vector2(pp["p"].x, y + 9), 7, pp["col"], HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	xf_base = Transform2D.IDENTITY
	_xf(Vector2.ZERO)
	draw_hud()


func draw_cover(c: Dictionary, id: String, alpha: float) -> void:
	var p: Vector2 = c["p"]
	var r: float = c["r"]
	var sd: float = c["seed"]
	var cols := {"bosque": ["#123d26", "#1f6b3e", "#2e8a50"], "recife": ["#ff7a8a", "#ffb07a", "#f2e6c9"], "tundra": ["#a9bfd6", "#e9f2fa", "#ffffff"],
		"vulcao": ["#1f1517", "#3a2828", "#8a8290"], "templo": ["#8a6a2a", "#b89a3a", "#d9bd5a"], "castelo": ["#5a4a7a", "#7a62a0", "#9a86c0"], "coliseu": ["#b08a3a", "#c29c48", "#d6b25a"]}
	var cc: Array = cols.get(id, cols["bosque"])
	draw_set_transform_matrix(xf_base * Transform2D(0.0, Vector2(1, 0.4), 0.0, p + Vector2(0, r * 0.45)))
	draw_circle(Vector2.ZERO, r, Color(0, 0, 0, 0.25 * alpha))
	_xf(Vector2.ZERO)
	for i in 6:
		var an := sd + i * TAU / 6.0
		var o := Vector2(cos(an) * r * 0.55, sin(an) * r * 0.45)
		draw_circle(p + o, r * 0.5, col(cc[0], alpha))
	for i in 6:
		var an := sd + i * TAU / 6.0 + 0.4
		var o := Vector2(cos(an) * r * 0.42, sin(an) * r * 0.34 - 3)
		draw_circle(p + o, r * 0.42, col(cc[1], alpha))
	if id == "castelo" or id == "vulcao":
		for i in 4:
			var tt := fmod(time * 0.5 + i / 4.0 + sd, 1.0)
			draw_circle(p + Vector2(sin(sd + i * 2 + time) * r * 0.4, -6 - tt * r * 0.9), r * (0.35 + tt * 0.35), col(cc[2], 0.5 * (1 - tt) * alpha))
	else:
		draw_circle(p + Vector2(0, -4), r * 0.45, col(cc[2], alpha))


func draw_icon(b: String, p: Vector2, s: float, c: String) -> void:
	var key: String = Items.bases[b]["icon"] if Items.bases.has(b) else b
	var M: Array = Items.ICONS.get(key, [])
	var C := {"#": c, "b": "#8a5a2b", "w": "#ffffff", "d": "#0b0c14"}
	for ry in M.size():
		var row: String = M[ry]
		for cx in mini(8, row.length()):
			var ch := row[cx]
			if ch != ".":
				draw_rect(Rect2(roundf(p.x + cx * s), roundf(p.y + ry * s), ceilf(s), ceilf(s)), Color.html(C[ch]))


func hud_panel(f: Fighter, x: float, right: bool) -> void:
	var w := 168.0
	var y := 4.0
	draw_rect(Rect2(x - 2, y - 2, w + 4, 32), Color.html("#0b0c14"))
	draw_rect(Rect2(x, y, w, 28), Color.html("#141626"))
	var px := x + w - 26 if right else x + 2
	draw_rect(Rect2(px, y + 2, 24, 24), Color.html("#23264a"))
	if f == G["p"] and save["cos"]["eq"].get("frame", null) != null:
		draw_rect(Rect2(px - 1, y + 1, 26, 26), Color.html(cos_find(save["cos"]["eq"]["frame"])["col"]), false, 2.0)
	spr(f.d["id"], Vector2(px + 12, y + 27), 1, -1.0 if right else 1.0)
	var tx := x + w - 30 if right else x + 30
	var al := HORIZONTAL_ALIGNMENT_RIGHT if right else HORIZONTAL_ALIGNMENT_LEFT
	var el: String = f.d["el"] + (" +10%" if f.mods > 1 else (" −10%" if f.mods < 1 else ""))
	text("%s · %s" % [(f.d["name"] as String).left(14), el], Vector2(tx, y + 10), 8, "#ffffff", al)
	var hp := f.hp / 1000.0
	var hc := "#46d160" if hp > 0.5 else ("#ffb02e" if hp > 0.25 else "#ff4d4d")
	bar(Rect2(x + w - 30 - 134 if right else x + 30, y + 13, 134, 6), hp, hc)
	bar(Rect2(x + w - 30 - 90 if right else x + 30, y + 22, 90, 3), f.charge / 100.0, "#bfeaff" if f.charge >= 100 else "#4fc3ff")
	if f.charge >= 100:
		text("C PRONTO", Vector2(x + w - 124 if right else x + 124, y + 27), 7, "#4fc3ff", al)


func draw_hud() -> void:
	var pl: Fighter = G["p"]
	var tgt: Fighter = G["b"]
	if G.get("multi", false) and pl.foe != null and not pl.foe.dead:
		tgt = pl.foe
	hud_panel(pl, 6, false)
	hud_panel(tgt, W - 174, true)
	if G.get("multi", false):
		var L: Array = []
		var R: Array = []
		for x: Fighter in G["all"]:
			if x != pl and x.team == pl.team:
				L.append(x)
			elif x != tgt and x.team != pl.team:
				R.append(x)
		for side in 2:
			var arr: Array = L if side == 0 else R
			var x0 := 6.0 if side == 0 else W - 104
			for i in arr.size():
				var f: Fighter = arr[i]
				var y := 36.0 + i * 9
				draw_rect(Rect2(x0 - 1, y, 100, 9), Color(0.04, 0.05, 0.08, 0.85))
				text((f.d["name"] as String).left(11), Vector2(x0 + 2 if side == 0 else x0 + 96, y + 7), 7, "#6a6f98" if f.dead else ("#7fc8ff" if side == 0 else "#ff9a9a"), HORIZONTAL_ALIGNMENT_LEFT if side == 0 else HORIZONTAL_ALIGNMENT_RIGHT)
				bar(Rect2(x0 + 56 if side == 0 else x0 + 2, y + 3, 40, 3), f.hp / 1000.0, "#3a3f66" if f.dead else "#46d160")
		var al := 0
		var en := 0
		for x: Fighter in G["all"]:
			if not x.dead:
				if x.team == pl.team:
					al += 1
				else:
					en += 1
		text(("Restam %d" % (al + en)) if G.get("ffa", false) else ("%d x %d" % [al, en]), Vector2(W / 2, 48), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	draw_rect(Rect2(W / 2 - 24, 2, 48, 20), Color.html("#0b0c14"))
	draw_rect(Rect2(W / 2 - 22, 4, 44, 16), Color.html("#141626"))
	text("%02d" % ceili(G["time"]), Vector2(W / 2, 17), 12, "#ff7a7a" if G["time"] < 15 else "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	text(G["arena"]["name"], Vector2(W / 2, 31), 9, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	btn("pause", Rect2(W / 2 + 26, 4, 14, 14), "II", "#2e3358", "#ffffff", 7)
	btn("emote", Rect2(W / 2 - 40, 4, 14, 14), "☺", "#2e3358", "#ffffff", 8)
	# setas para quem está fora da tela
	var X0 := 12.0
	var X1 := W - 12
	var Y0 := 56.0
	var Y1 := H - 34
	var cen := Vector2(W / 2, (Y0 + Y1) / 2)
	for o: Fighter in G["all"]:
		if o == pl or o.dead or not seen_by(o, pl.team):
			continue
		var sp: Vector2 = o.pos - Vector2(0, 10) - cam
		if sp.x >= 4 and sp.x <= W - 4 and sp.y >= 30 and sp.y <= H - 4:
			continue
		var dv: Vector2 = sp - cen
		var m := minf((X1 - cen.x) / maxf(1e-6, absf(dv.x)), (Y1 - cen.y) / maxf(1e-6, absf(dv.y)))
		var ap: Vector2 = cen + dv * m
		var an := dv.angle()
		_xf(ap.round(), an)
		draw_colored_polygon(PackedVector2Array([Vector2(9, 0), Vector2(-6, -7), Vector2(-3, 0), Vector2(-6, 7)]), Color.html("#0b0c14"))
		draw_colored_polygon(PackedVector2Array([Vector2(7, 0), Vector2(-4, -5), Vector2(-2, 0), Vector2(-4, 5)]), Color.html(o.colr))
		_xf(Vector2.ZERO)
		var dist := roundi(o.pos.distance_to(pl.pos) / 10.0)
		text("%dm" % dist, Vector2(clampf(ap.x - cos(an) * 14, 14, W - 14), clampf(ap.y - sin(an) * 12 + 3, Y0, Y1)), 6, o.colr, HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var tp: Dictionary = G.get("tips", {})
	if not (tp.get("cur", {}) as Dictionary).is_empty() and not G["over"]:
		var cu: Dictionary = tp["cur"]
		var tw := font.get_string_size(cu["txt"], HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x + 24
		var kk := clampf(minf(cu["t"] * 4, (3.6 - cu["t"]) * 4), 0, 1)
		draw_rect(Rect2(W / 2 - tw / 2 - 2, 58, tw + 4, 20), Color(0.04, 0.05, 0.08, kk))
		draw_rect(Rect2(W / 2 - tw / 2, 60, tw, 16), Color(0.11, 0.13, 0.25, kk))
		draw_rect(Rect2(W / 2 - tw / 2, 60, 3, 16), col("#ffd23f", kk))
		text(cu["txt"], Vector2(W / 2 + 4, 72), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	if not pl.dead and pl.cover >= 0:
		text("REVELADO!" if pl.reveal_t > 0 else "ESCONDIDO", Vector2(W / 2, 236), 8, "#ff9a9a" if pl.reveal_t > 0 else "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var f: Fighter = G["p"]
	if is_touch:
		var j: Vector2 = touch["joy_o"] if touch["joy"] != -1 else Vector2(60, 220)
		draw_circle(j, 30, Color(0.04, 0.05, 0.08, 0.5))
		draw_circle(j + touch["joy_v"] * 24, 12, Color(1, 1, 1, 0.85))
		_tbtn("a", "A", "#ff6a3d", f.cd_a / 0.5)
		_tbtn("b", "B", "#7a7fb8", f.cd_b / 5.0)
		_tbtn("c", "C", "#4fc3ff" if f.charge >= 100 else "#2e3358", 1 - f.charge / 100.0)
		_tbtn("dash", "DASH", "#ffd23f", f.cd_dash / f.dash_cd)
		_tbtn("blk", "BLOQ", "#ff4d4d" if f.broken > 0 else "#bfeaff", 1 - f.guard / f.guard_max)
	else:
		var pw: Array = f.d["pw"]
		text("A %s · B %s · C %s" % [pw[0], pw[1], pw[2]], Vector2(8, 258), 8, "#ffe2d0", HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")


func _tbtn(k: String, label: String, c: String, cd: float) -> void:
	var b: Array = TB[k]
	var p := Vector2(b[0], b[1])
	draw_circle(p, b[2] + 2, Color.html("#0b0c14"))
	draw_circle(p, b[2], Color.html(c))
	if cd > 0:
		draw_arc(p, b[2] * 0.5, -PI / 2, -PI / 2 + TAU * clampf(cd, 0, 1), 24, Color(0.04, 0.05, 0.08, 0.6), b[2])
	text(label, p + Vector2(0, 3), 7 if label.length() > 2 else 10, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)


func draw_countdown() -> void:
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.35))
	if G.get("tour", false):
		text(ROUNDS[int(T["r"])].to_upper(), Vector2(W / 2, H / 2 - 48), 11, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if cd_t > 2.6:
		var md: String = pick.get("mode", "1x1")
		if md == "ffa":
			text("TODOS CONTRA TODOS · o último de pé vence!", Vector2(W / 2, H / 2 - 30), 11, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		elif md != "1x1":
			text("EQUIPES %s · derrube toda a equipe rival!" % md, Vector2(W / 2, H / 2 - 30), 11, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		else:
			text("%s  VS  %s" % [pick["me"]["name"], pick["foe"]["name"]], Vector2(W / 2, H / 2 - 30), 12, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var n := ceili(cd_t)
	if n >= 1 and n <= 3:
		text(str(n), Vector2(W / 2, H / 2 + 14), 36, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if cd_t < 0.4:
		text("LUTE!", Vector2(W / 2, H / 2 + 14), 28, "#ff6a3d", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")


func draw_result() -> void:
	var r: Dictionary = G["res"]
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.75))
	if pick.get("online", false) and opp_humans().size() == 1:
		btn("repopp", Rect2(8, 6, 70, 14), "DENUNCIAR", "#5a2a36", "#ff9a9a", 6)
	text("VITÓRIA!" if r["win"] else "DERROTA", Vector2(W / 2, 60), 28, "#ffd23f" if r["win"] else "#ff7a7a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var rk: Dictionary = r.get("rk", {})
	var extra: bool = G.get("multi", false) or not rk.is_empty() or G.get("tour", false)
	spr(G["p"].d["id"], Vector2(W / 2, 128), 2.0 if extra else 3.0)
	if G.get("ffa", false):
		text("Você foi o último de pé!" if r["win"] else "Vencedor: " + (G["winner"] as Fighter).d["name"], Vector2(W / 2, 78), 10, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	elif G.get("multi", false):
		text("Sua equipe venceu!" if r["win"] else "A equipe rival venceu", Vector2(W / 2, 78), 10, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if G.get("tour", false):
		text("%s: %s" % [ROUNDS[int(T["r"])], "você avança!" if r["win"] else "você foi eliminado"], Vector2(W / 2, 78), 10, "#8ef0a0" if r["win"] else "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if not rk.is_empty():
		if rk.get("pending", false):
			text("Calculando PDL no servidor…", Vector2(W / 2, 80), 10, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		elif rk.has("void"):
			text(str(rk["void"]), Vector2(W / 2, 80), 9, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		elif rk.has("placement"):
			text(("Colocação concluída: %s!" % rk["placed_now"]) if rk.has("placed_now") else ("Partida de colocação %d/5" % int(rk["placement"])), Vector2(W / 2, 80), 10, rk["col"] if rk.has("placed_now") else "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		else:
			text("%s%d PDL · %s" % ["+" if int(rk["d"]) > 0 else "", int(rk["d"]), rk["after"]], Vector2(W / 2, 80), 10, "#8ef0a0" if int(rk["d"]) > 0 else "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		var sub := ""
		if rk.get("tier_up", false):
			sub = "PROMOVIDO A %s!" % (rk["promo"] as String).to_upper()
		elif rk.has("promo"):
			sub = "Subiu para %s!" % rk["promo"]
		elif rk.has("demo"):
			sub = "Rebaixado para %s" % rk["demo"]
		elif rk.get("shield", false):
			sub = "Proteção de rebaixamento segurou seu elo"
		if sub != "":
			text(sub, Vector2(W / 2, 93), 9, "#ff9a9a" if rk.has("demo") else "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	# painéis: sua luta e destaque
	var stt: Dictionary = (G["p"] as Fighter).stats
	var rows := [["Dano causado", roundi(stt.get("dmg", 0))], ["Dano recebido", roundi(stt.get("taken", 0))], ["Acertos", int(stt.get("hits", 0))], ["Esquivas", int(stt.get("dodges", 0))],
		["Bloq. perfeitos", int(stt.get("perfect", 0))], ["Nocautes", int(stt.get("kos", 0))], ["Especiais", int(stt.get("specials", 0))], ["Duel Gold", "+%d" % int(r.get("gd", 0))], ["Pó Mágico", "+%d" % int(r.get("po", 0))], ["XP do Passe", "+%d%s" % [int(r.get("xp", 0)), " ↑" if r.get("pass_up", false) else ""]]]
	if int(r.get("wk_b", 0)) > 0:
		rows.append(["Lenda da semana", "+%d GD" % int(r["wk_b"])])
	if int(r.get("tut_b", 0)) > 0:
		rows.append(["Tutorial", "+%d GD" % int(r["tut_b"])])
	if int(r.get("m_done", 0)) > 0:
		rows.append(["Missões", "%d concluída(s)!" % int(r["m_done"])])
	if not (r.get("ach_new", []) as Array).is_empty():
		rows.append(["Conquista", str(r["ach_new"][0][1])])
	if rk.get("box", false):
		rows.append(["Caixa da Sorte", "+1"])
	panel(Rect2(8, 104, 112, 18 + rows.size() * 11))
	text("SUA LUTA", Vector2(64, 115), 7, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	for i in rows.size():
		text(rows[i][0], Vector2(13, 129 + i * 11), 8, "#c9cbe6")
		text(str(rows[i][1]), Vector2(115, 129 + i * 11), 8, "#ffffff", HORIZONTAL_ALIGNMENT_RIGHT)
	if (G["all"] as Array).size() > 2:
		var mvp: Fighter = G["p"]
		for x: Fighter in G["all"]:
			if float(x.stats.get("dmg", 0)) > float(mvp.stats.get("dmg", 0)):
				mvp = x
		panel(Rect2(360, 104, 112, 104))
		text("DESTAQUE", Vector2(416, 115), 7, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
		spr(mvp.d["id"], Vector2(416, 160), 2)
		text((mvp.d["name"] as String).left(15), Vector2(416, 174), 9, mvp.colr, HORIZONTAL_ALIGNMENT_CENTER)
		text("%d de dano · %d KO" % [roundi(mvp.stats.get("dmg", 0)), int(mvp.stats.get("kos", 0))], Vector2(416, 186), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		text("É você!" if mvp == G["p"] else ("Aliado" if mvp.team == (G["p"] as Fighter).team else "Rival"), Vector2(416, 198), 8, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
	text("%s · +%d de maestria" % [G["p"].d["name"], r["gain"]], Vector2(W / 2, 146), 11, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var gi := gem_of(r["after"])
	text(GEMS[gi], Vector2(W / 2, 160), 10, GEMCOL[gi], HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	bar(Rect2(W / 2 - 80, 166, 160, 6), 1.0 if gi >= 8 else (r["after"] % 100) / 100.0, GEMCOL[mini(8, gi + 1)])
	if r["gem_up"]:
		var rw: Dictionary = r.get("reward", {})
		text(("NOVA PATENTE! Recompensa: %s" % Items.item_name(rw)) if not rw.is_empty() else "NOVA PATENTE! +10% de chance de sortear esta lenda", Vector2(W / 2, 192), 9, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Coleção: %d/%d lendas descobertas" % [save["seen"].size(), chars.size()], Vector2(W / 2, 208), 9, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if result_t > 0.8:
		if G.get("tour", false):
			btn("tcont", Rect2(W / 2 - 65, 224, 130, 24), "CONTINUAR", "#ffd23f", "#0b0c14", 10)
		elif pick.get("online", false) and pick.get("ranked", false):
			btn("again", Rect2(W / 2 - 118, 224, 130, 24), "JOGAR DE NOVO", "#ffd23f", "#0b0c14", 9)
			btn("rankback", Rect2(W / 2 + 22, 224, 96, 24), "VOLTAR", "#2e3358", "#ffffff", 10)
		elif pick.get("online", false):
			btn("toroom", Rect2(W / 2 - 70, 224, 140, 24), "VOLTAR À SALA", "#4fd1ff", "#0b0c14", 9)
		else:
			btn("again", Rect2(W / 2 - 118, 224, 130, 24), "SORTEAR DE NOVO", "#ffd23f", "#0b0c14", 9)
			btn("menu", Rect2(W / 2 + 22, 224, 96, 24), "MENU", "#2e3358", "#ffffff", 10)


func draw_pause() -> void:
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.75))
	text("PAUSA", Vector2(W / 2, 100), 20, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	btn("pause", Rect2(W / 2 - 60, 130, 120, 22), "CONTINUAR", "#ffd23f")
	btn("quit", Rect2(W / 2 - 60, 160, 120, 22), "SAIR", "#2e3358", "#ffffff")
	var cl := controls_list()
	for i in mini(8, cl.size()):
		text("%s: %s" % [cl[i][0], cl[i][1]], Vector2(12, 130 + i * 11), 8, "#c9cbe6")


# =====================================================================
# TELAS: MODOS, PERFIL, COLEÇÃO, TORNEIO
func screen_bg() -> void:
	draw_texture(arena_tex["vulcao"], Vector2.ZERO)
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.85))


func panel(r: Rect2) -> void:
	draw_rect(r.grow(2), Color.html("#0b0c14"))
	draw_rect(r, Color.html("#141626"))


func spr_dark(id: String, p: Vector2, s := 1.0) -> void:
	var tex: Texture2D = sprites[id][0]
	_xf(p.round(), 0, Vector2(s, s))
	draw_texture(tex, Vector2(-tex.get_width() / 2.0, -tex.get_height()), Color(0.12, 0.13, 0.22, 1))
	_xf(Vector2.ZERO)


func draw_modes() -> void:
	screen_bg()
	text("ESCOLHA O MODO", Vector2(W / 2, 30), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Seu lutador é sempre sorteado", Vector2(W / 2, 44), 10, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var M := [["m:1x1", "DUELO 1x1", "Você contra uma lenda", "#ffd23f", 1], ["m:2x2", "DUPLAS 2x2", "Você + 1 aliado bot", "#7fc8ff", 2],
		["m:3x3", "TRIOS 3x3", "Você + 2 aliados bots", "#7fe0c8", 3], ["m:5x5", "EQUIPES 5x5", "Batalha de 10 lendas", "#b07aff", 5],
		["m:ffa", "TODOS x TODOS", "6 lendas, só 1 sobrevive", "#ff6a3d", 3], ["tour", "TORNEIO", "16 vagas, mata-mata", "#ff8a3d", 1]]
	var ids := ["saci", "iara", "zeus", "yeti", "saci"]
	for i in M.size():
		var m: Array = M[i]
		var r := Rect2(24 + (i % 3) * 148, 58 + (i / 3) * 92, 136, 82)
		panel(r)
		draw_rect(r.grow(-0.5), Color.html(m[3]), false, 1.0)
		var n: int = m[4]
		for k in n:
			spr(ids[k], Vector2(r.get_center().x + (k - (n - 1) / 2.0) * minf(22, 110.0 / n), r.position.y + 38), 1, -1.0 if k % 2 else 1.0)
		btn(m[0], Rect2(r.position.x + 8, r.position.y + 44, r.size.x - 16, 18), m[1], m[3], "#0b0c14", 9)
		text(m[2], Vector2(r.get_center().x, r.position.y + 74), 9, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER)
	btn("menu", Rect2(W / 2 - 48, 244, 96, 20), "VOLTAR", "#2e3358", "#ffffff", 9)


func draw_profile() -> void:
	screen_bg()
	text("PERFIL", Vector2(W / 2, 22), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	portrait(10, 4, 24, my_frame())
	text(str(save.get("nick", "sem nome")), Vector2(42, 18), 10, "#ffffff", HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")
	if str(save.get("title", "")) != "":
		text(str(save["title"]), Vector2(42, 28), 7, "#ffd23f")
	btn("ach", Rect2(W - 190, 10, 88, 16), "CONQUISTAS", "#ffd23f", "#0b0c14", 7)
	var fx: bool = save.has("nick") and not net.get("can_rename", false)
	btn("icons" if fx else "netnick", Rect2(W - 96, 10, 88, 16), "MEU ÍCONE" if fx else "ESCOLHER NOME", "#2e3358", "#ffffff", 7)
	buttons.append({"id": "icons", "r": Rect2(8, 2, 28, 28)})
	btn("borders", Rect2(104, 198, 44, 14), "BORDAS", "#ffd23f", "#0b0c14", 6)
	panel(Rect2(10, 32, 142, 104))
	text("ESTATÍSTICAS", Vector2(81, 44), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	var g := int(save["games"])
	var w := int(save["wins"])
	var pat := 0
	for v in save["mastery"].values():
		if int(v) >= 100:
			pat += 1
	var rows := [["Partidas", str(g)], ["Vitórias", str(w)], ["Derrotas", str(g - w)], ["Taxa de vitória", ("%d%%" % roundi(w * 100.0 / g)) if g > 0 else "—"],
		["Coleção", "%d/%d" % [save["seen"].size(), chars.size()]], ["Patentes", str(pat)]]
	for i in rows.size():
		text(rows[i][0], Vector2(16, 60 + i * 12), 9, "#c9cbe6")
		text(rows[i][1], Vector2(146, 60 + i * 12), 9, "#ffffff", HORIZONTAL_ALIGNMENT_RIGHT)
	panel(Rect2(10, 144, 142, 88))
	var R: Dictionary = save["rank"]
	text("RANQUEADA · T%d" % int(R.get("season", 1)), Vector2(81, 155), 8, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER)
	emblem(Vector2(34, 180), 16, R)
	text("Sem elo" if int(R["tier"]) < 0 else Ranked.tier_name(R), Vector2(52, 174), 9, Ranked.color(R))
	text(("Colocação %d/5" % int(R["placed"])) if int(R["tier"]) < 0 else ("%d PDL" % int(R["lp"])), Vector2(52, 185), 8, "#ffffff")
	if int(R["tier"]) >= 0 and int(R["tier"]) < 7:
		bar(Rect2(52, 189, 90, 4), int(R["lp"]) / 100.0, Ranked.color(R))
	var rg := int(R["w"]) + int(R["l"])
	text("%dV %dD%s" % [int(R["w"]), int(R["l"]), (" · %d%%" % roundi(int(R["w"]) * 100.0 / rg)) if rg > 0 else ""], Vector2(16, 208), 8, "#c9cbe6")
	text(("Proteção: %d partida(s)" % int(R["shield"])) if int(R["shield"]) > 0 and int(R["tier"]) > 0 else (("Pico: " + R["peak_name"]) if R["peak_name"] != "" else "Jogue 5 partidas de colocação"), Vector2(16, 220), 8, "#c9cbe6")
	panel(Rect2(162, 32, 118, 200))
	text("MAIS DOMINADAS", Vector2(221, 44), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	var top: Array = []
	for k in save["mastery"]:
		top.append([k, int(save["mastery"][k])])
	top.sort_custom(func(a, b): return a[1] > b[1])
	if top.is_empty():
		text("Jogue para ganhar maestria", Vector2(221, 120), 8, "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
	for i in mini(5, top.size()):
		var id: String = top[i][0]
		var c: Dictionary = {}
		for x in chars:
			if x["id"] == id:
				c = x
		if c.is_empty():
			continue
		var y := 52.0 + i * 36
		var gi := gem_of(top[i][1])
		draw_rect(Rect2(168, y, 28, 30), Color.html("#23264a"))
		spr(id, Vector2(182, y + 28), 1)
		text((c["name"] as String).left(13), Vector2(200, y + 10), 8, "#ffffff")
		text(GEMS[gi], Vector2(200, y + 20), 8, GEMCOL[gi])
		text("%d pts" % top[i][1], Vector2(200, y + 29), 8, "#c9cbe6")
	panel(Rect2(290, 32, 180, 200))
	text("HISTÓRICO", Vector2(380, 44), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	var hs: Array = save.get("hist", [])
	if hs.is_empty():
		text("Nenhuma partida ainda", Vector2(380, 120), 8, "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
	for i in mini(9, hs.size()):
		var h: Dictionary = hs[i]
		var y := 52.0 + i * 20
		var nm: String = h["c"]
		for x in chars:
			if x["id"] == h["c"]:
				nm = x["name"]
		draw_rect(Rect2(294, y, 172, 18), Color.html("#1c3a26" if h["w"] else "#3a1c22"))
		draw_rect(Rect2(294, y, 3, 18), Color.html("#46d160" if h["w"] else "#ff4d5e"))
		text("%s · %s" % ["V" if h["w"] else "D", nm.left(14)], Vector2(300, y + 8), 8, "#ffffff")
		text(("vs " + str(h["o"])).left(26), Vector2(300, y + 16), 7, "#c9cbe6")
		text((h["m"] as String).replace("Torneio · ", "T. ").left(18), Vector2(462, y + 8), 7, "#ffe2d0", HORIZONTAL_ALIGNMENT_RIGHT)
		var rr = h.get("r", null)
		if rr != null:
			text("%s%d pts" % ["+" if int(rr) > 0 else "", int(rr)], Vector2(462, y + 16), 7, "#8ef0a0" if int(rr) > 0 else "#ff9a9a", HORIZONTAL_ALIGNMENT_RIGHT)
		else:
			text("+%d maest." % int(h["g"]), Vector2(462, y + 16), 7, "#8ef0a0", HORIZONTAL_ALIGNMENT_RIGHT)
	btn("menu", Rect2(W / 2 - 48, 244, 96, 20), "VOLTAR", "#2e3358", "#ffffff", 9)


func draw_album() -> void:
	screen_bg()
	text("COLEÇÃO %d/%d" % [save["seen"].size(), chars.size()], Vector2(8, 18), 10, "#ffd23f", HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")
	for i in chars.size():
		var c: Dictionary = chars[i]
		var r := Rect2(8 + (i % 12) * 30, 26 + (i / 12) * 24, 28, 22)
		draw_rect(r, Color.html("#3a3f66" if i == alb_sel else "#141626"))
		draw_rect(Rect2(r.position.x, r.position.y + 20, 28, 2), Color.html(RAR[c["rar"]][1]))
		if save["seen"].has(c["id"]):
			spr(c["id"], Vector2(r.position.x + 14, r.position.y + 21), 1)
		else:
			spr_dark(c["id"], Vector2(r.position.x + 14, r.position.y + 21), 1)
		buttons.append({"id": "alb:%d" % i, "r": r})
	var px := 374.0
	var py := 26.0
	panel(Rect2(px, py, 100, 216))
	if alb_sel < 0:
		text("Toque numa lenda", Vector2(px + 50, py + 100), 9, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	else:
		var c: Dictionary = chars[alb_sel]
		draw_rect(Rect2(px + 20, py + 4, 60, 10), Color.html(RAR[c["rar"]][1]))
		text((c["rar"] as String).to_upper(), Vector2(px + 50, py + 12), 7, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
		if not save["seen"].has(c["id"]):
			spr_dark(c["id"], Vector2(px + 50, py + 70), 2.4)
			text("???", Vector2(px + 50, py + 86), 12, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
			text("Ainda não sorteada", Vector2(px + 50, py + 100), 9, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		else:
			spr(c["id"], Vector2(px + 50, py + 66), 2.4)
			text((c["name"] as String).left(16), Vector2(px + 50, py + 80), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			text(c["el"], Vector2(px + 50, py + 92), 9, ELCOL[c["el"]], HORIZONTAL_ALIGNMENT_CENTER)
			var st := [["ATQ", c["atk"], "#ff6a3d"], ["DEF", c["def"], "#9aa3c7"], ["VEL", c["vel"], "#ffd23f"], ["ESP", c["esp"], "#4fc3ff"], ["ESQ", c["esq"], "#8ef0a0"]]
			for i in st.size():
				var yy := py + 100 + i * 9
				text(st[i][0], Vector2(px + 4, yy + 6), 7, "#c9cbe6")
				bar(Rect2(px + 28, yy + 1, 48, 5), (st[i][1] - 40) / 60.0, st[i][2])
				text(str(int(st[i][1])), Vector2(px + 96, yy + 6), 7, "#ffffff", HORIZONTAL_ALIGNMENT_RIGHT)
			for i in 3:
				text("%s %s" % ["ABC"[i], (c["pw"][i] as String).left(17)], Vector2(px + 4, py + 158 + i * 10), 8, "#ffe2d0")
			var m := int(save["mastery"].get(c["id"], 0))
			var gi := gem_of(m)
			text("%s · %d pts" % [GEMS[gi], m], Vector2(px + 50, py + 196), 9, GEMCOL[gi], HORIZONTAL_ALIGNMENT_CENTER)
			if gi > 0:
				text("+%d%% no sorteio" % (gi * 10), Vector2(px + 50, py + 207), 8, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
	btn("menu", Rect2(374, 248, 100, 16), "VOLTAR", "#2e3358", "#ffffff", 8)


func draw_bracket() -> void:
	screen_bg()
	text("TORNEIO · 16 LENDAS", Vector2(W / 2, 14), 10, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var col_x := [6.0, 110.0, 210.0, 302.0]
	var row_h := [13.0, 26.0, 52.0, 104.0]
	var labels := ["Oitavas", "Quartas", "Semi", "Final"]
	for i in 4:
		text(labels[i], Vector2(col_x[i] + 48, 27), 9, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER)
	var rounds: Array = T["rounds"]
	for r in mini(4, rounds.size()):
		var list: Array = rounds[r]
		for k in list.size():
			var c: Dictionary = list[k]
			var x: float = col_x[r]
			var y: float = 30 + row_h[r] * k + row_h[r] / 2
			var is_me: bool = c == T["me"]
			var lost: bool = r < int(T["r"]) and rounds.size() > r + 1 and not (rounds[r + 1] as Array).has(c)
			draw_rect(Rect2(x, y - 6, 94, 12), Color(0.27, 0.82, 0.38, 0.28) if is_me else Color(0.12, 0.13, 0.23, 0.95))
			spr(c["id"], Vector2(x + 6, y + 7), 0.6, 1, false, 0.35 if lost else 1.0)
			text((c["name"] as String).left(16), Vector2(x + 15, y + 3), 8, "#6a6f98" if lost else ("#8ef0a0" if is_me else "#ffffff"))
			if r < 3:
				draw_rect(Rect2(x + 94, y, 4, 1), Color.html("#4a4f7a"))
				if k % 2 == 0:
					var y2: float = 30 + row_h[r] * (k + 1) + row_h[r] / 2
					draw_rect(Rect2(x + 98, y, 1, y2 - y + 1), Color.html("#4a4f7a"))
					draw_rect(Rect2(x + 98, (y + y2) / 2, col_x[r + 1] - x - 98, 1), Color.html("#4a4f7a"))
	panel(Rect2(400, 74, 76, 100))
	text("CAMPEÃO", Vector2(438, 86), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	if T["champion"] != null:
		var ch: Dictionary = T["champion"]
		spr(ch["id"], Vector2(438, 150), 2.4)
		text((ch["name"] as String).left(14), Vector2(438, 166), 9, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
		var win: bool = ch == T["me"]
		text("VOCÊ É O CAMPEÃO! +20 de maestria" if win else "Você caiu na fase: %s. Campeão: %s" % [ROUNDS[int(T["lost_at"])], ch["name"]], Vector2(W / 2, 250), 10, "#8ef0a0" if win else "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		btn("tour", Rect2(300, 224, 92, 18), "NOVO TORNEIO", "#ff8a3d", "#0b0c14", 8)
		btn("menu", Rect2(398, 224, 76, 18), "MENU", "#2e3358", "#ffffff", 9)
	else:
		text("?", Vector2(438, 140), 20, "#3a3f66", HORIZONTAL_ALIGNMENT_CENTER)
		text("%s: %s contra %s" % [ROUNDS[int(T["r"])], T["me"]["name"], t_foe()["name"]], Vector2(W / 2 - 60, 262), 9, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		btn("tfight", Rect2(398, 226, 76, 22), "LUTAR!", "#ffd23f", "#0b0c14", 10)


# =====================================================================
# TELAS NOVAS: RANQUEADA, COMO JOGAR, OPÇÕES, LOJA, MOCHILA/FORJA, CAIXA, PREPARAÇÃO
func emblem(c: Vector2, sz: float, r: Dictionary) -> void:
	var t := -1 if int(r["tier"]) < 0 else Ranked.apex(r)
	var cc: String = "#4a4f7a" if t < 0 else Ranked.TIERS[t][1]
	var k := sz / 20.0
	_xf(c.round(), 0, Vector2(k, k))
	if t >= 3:
		for sg in [-1.0, 1.0]:
			draw_colored_polygon(PackedVector2Array([Vector2(sg * 8, -6), Vector2(sg * 20, -12), Vector2(sg * 16, -2), Vector2(sg * 20, 2), Vector2(sg * 10, 6)]), col(cc, 0.7))
	draw_colored_polygon(PackedVector2Array([Vector2(0, -15), Vector2(13, -9), Vector2(11, 8), Vector2(0, 16), Vector2(-11, 8), Vector2(-13, -9)]), Color.html("#0b0c14"))
	draw_colored_polygon(PackedVector2Array([Vector2(0, -13), Vector2(11, -8), Vector2(9, 7), Vector2(0, 14), Vector2(-9, 7), Vector2(-11, -8)]), Color.html(cc))
	draw_colored_polygon(PackedVector2Array([Vector2(0, -13), Vector2(11, -8), Vector2(0, -2), Vector2(-11, -8)]), Color(1, 1, 1, 0.35))
	draw_colored_polygon(PackedVector2Array([Vector2(0, -5), Vector2(5, 0), Vector2(0, 6), Vector2(-5, 0)]), Color.html("#0b0c14"))
	draw_colored_polygon(PackedVector2Array([Vector2(0, -3), Vector2(3, 0), Vector2(0, 4), Vector2(-3, 0)]), Color.html("#6a6f98" if t < 0 else "#ffffff"))
	if t >= 7:
		draw_rect(Rect2(-7, -20, 14, 4), Color.html("#ffe58a"))
		draw_rect(Rect2(-7, -24, 3, 4), Color.html("#ffe58a"))
		draw_rect(Rect2(-1.5, -25, 3, 5), Color.html("#ffe58a"))
		draw_rect(Rect2(4, -24, 3, 4), Color.html("#ffe58a"))
	_xf(Vector2.ZERO)


func draw_leader() -> void:
	screen_bg()
	text("RANKING GLOBAL", Vector2(W / 2, 22), 14, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Temporada %d · %d jogadores com elo" % [int(save["rank"]["season"]), int(LB["total"])], Vector2(W / 2, 36), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	panel(Rect2(40, 44, 400, 174))
	var L: Array = LB["list"]
	if LB["loading"]:
		text("Carregando…", Vector2(W / 2, 130), 10, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	elif str(LB["err"]) != "":
		text(str(LB["err"]), Vector2(W / 2, 130), 9, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER)
	elif L.is_empty():
		text("Ninguém terminou a colocação ainda. Seja o primeiro!", Vector2(W / 2, 130), 9, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER)
	else:
		var my_pid: String = ident()["pid"]
		var pg := int(LB["page"])
		for i in range(pg * 10, mini(L.size(), pg * 10 + 10)):
			var p: Dictionary = L[i]
			var y := 58.0 + (i - pg * 10) * 16
			var me: bool = str(p.get("pid", "")) == my_pid
			if me:
				draw_rect(Rect2(44, y - 9, 392, 15), Color(1, 0.82, 0.25, 0.18))
			var rr := {"tier": int(p["r"]["tier"]), "div": int(p["r"]["div"]), "lp": int(p["r"]["lp"]), "placed": 5}
			var pos := i + 1
			text("%dº" % pos, Vector2(64, y + 2), 9, (["#ffd23f", "#c9cbe6", "#d9a04a"][pos - 1]) if pos <= 3 else "#9aa3c7", HORIZONTAL_ALIGNMENT_CENTER)
			var fk := frame_key(rr)
			var pic := str(p.get("i", ""))
			if not fk.is_empty():
				rank_frame(83, y - 9, 15, int(fk["t"]), int(fk["d"]))
			if pic != "" and sprites.has(pic):
				draw_rect(Rect2(85, y - 7, 11, 11), Color.html("#23264a"))
				spr(pic, Vector2(90.5, y + 4), 0.55)
			else:
				emblem(Vector2(92, y - 1), 6, rr)
			text(str(p["n"]), Vector2(106, y + 2), 9, "#ffd23f" if me else "#ffffff")
			text(Ranked.label(rr), Vector2(430, y + 2), 9, Ranked.color(rr), HORIZONTAL_ALIGNMENT_RIGHT)
	var pages := maxi(1, int(ceil(L.size() / 10.0)))
	text("%d/%d" % [int(LB["page"]) + 1, pages], Vector2(W / 2, 232), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	btn("ldp", Rect2(W / 2 - 60, 224, 26, 14), "<", "#2e3358", "#ffffff", 8)
	btn("ldn", Rect2(W / 2 + 34, 224, 26, 14), ">", "#2e3358", "#ffffff", 8)
	var R: Dictionary = save["rank"]
	var me_d: Dictionary = LB["me"]
	var line := ""
	if int(me_d.get("pos", 0)) > 0:
		line = "Você: %dº de %d · %s" % [int(me_d["pos"]), int(LB["total"]), Ranked.label(R)]
	elif int(R["tier"]) < 0:
		line = "Termine a colocação (%d/5) para entrar no ranking" % int(R["placed"])
	else:
		line = "Você: %s" % Ranked.label(R)
	text(line, Vector2(W / 2, 252), 9, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	btn("ldback", Rect2(8, 244, 60, 18), "VOLTAR", "#2e3358", "#ffffff", 8)
	btn("ldr", Rect2(W - 82, 244, 74, 18), "ATUALIZAR", "#4fd1ff", "#0b0c14", 8)


func draw_rank_lobby() -> void:
	screen_bg()
	var R: Dictionary = save["rank"]
	text("RANQUEADA SOLO", Vector2(W / 2, 24), 14, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Temporada %d · Etapa %d" % [int(R["season"]), int(R["split"])], Vector2(W / 2, 38), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	panel(Rect2(140, 48, 200, 120))
	emblem(Vector2(W / 2, 92), 34, R)
	text("SEM ELO" if int(R["tier"]) < 0 else Ranked.tier_name(R).to_upper(), Vector2(W / 2, 138), 11, Ranked.color(R), HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	if int(R["tier"]) < 0:
		text("Partidas de colocação: %d/5" % int(R["placed"]), Vector2(W / 2, 154), 9, "#ffe2d0", HORIZONTAL_ALIGNMENT_CENTER)
	elif int(R["tier"]) < 7:
		bar(Rect2(170, 146, 140, 5), int(R["lp"]) / 100.0, Ranked.color(R))
		text("%d/100 PDL" % int(R["lp"]), Vector2(W / 2, 162), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	else:
		text("%d PDL" % int(R["lp"]), Vector2(W / 2, 156), 9, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	for i in Ranked.TIERS.size():
		var x := 24.0 + i * 48
		var cur := int(R["tier"]) >= 0 and Ranked.apex(R) == i
		emblem(Vector2(x, 196), 12.0 if cur else 9.0, {"tier": i if i < 7 else 7, "lp": 200 if i == 8 else (500 if i == 9 else 0), "div": 0})
		text((Ranked.TIERS[i][0] as String).replace("Grão-Mestre", "Grão-M."), Vector2(x, 216), 7, Ranked.TIERS[i][1] if cur else "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
	text("1x1 contra pessoas · itens com teto · a cada 100 PDL sobe uma divisão", Vector2(W / 2, 230), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	btn("rankgo", Rect2(W / 2 - 70, 238, 140, 22), "PROCURAR PARTIDA", "#ffd23f", "#0b0c14", 9)
	btn("leader", Rect2(W - 84, 238, 76, 22), "RANKING", "#4fd1ff", "#0b0c14", 9)
	btn("online", Rect2(8, 244, 60, 18), "VOLTAR", "#2e3358", "#ffffff", 8)
	var st: String = net["status"]
	text("online" if st == "on" else ("conectando…" if st == "connecting" else "desconectado"), Vector2(W - 8, 14), 8, "#46d160" if st == "on" else "#ff9a9a", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	if str(net["err"]) != "" and time - float(net["err_t"]) < 4.0:
		text(str(net["err"]), Vector2(W / 2, 44), 8, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")


func controls_list() -> Array:
	if is_touch:
		return [["Andar", "joystick à esquerda"], ["Ataque A", "botão A (mira automática)"], ["Habilidade B", "botão B"], ["Especial C", "botão C quando carregar"], ["Dash", "botão DASH"], ["Bloquear", "segure BLOQ"]]
	return [["Andar", "WASD ou setas"], ["Mirar", "mouse"], ["Ataque A", "clique esquerdo"], ["Habilidade B", "E"], ["Especial C", "Q (quando carregar)"], ["Dash", "Espaço"], ["Bloquear", "Shift ou botão direito"], ["Pausa", "Esc"]]


func draw_howto() -> void:
	screen_bg()
	var pages := [["CONTROLES", controls_list()],
		["COMBATE", [["Ataque A", "golpe básico, recarga curta"], ["Habilidade B", "tática: escudo, dash, armadilha, invocação..."], ["Especial C", "carrega com o tempo e com os acertos"],
			["Bloqueio", "segure virado para o ataque; gasta a guarda"], ["Bloqueio perfeito", "na hora exata: rebate tiros e atordoa"], ["Elementos", "fogo vence gelo, água vence fogo... SUPER! = vantagem"]]],
		["MAPA E PROGRESSO", [["Sorteio", "sua lenda e a arena são sempre sorteadas"], ["Esconderijos", "arbustos, corais e névoa escondem você"], ["Setas", "mostram rivais fora da tela"],
			["Itens", "equipe antes da luta; loja e forja com GD e Pó Mágico"], ["Maestria", "vença com uma lenda para subir de patente"], ["Ranqueada", "5 de colocação, depois PDL, elos e Caixa da Sorte"]]]]
	var pg: Array = pages[how_page]
	text("COMO JOGAR", Vector2(W / 2, 24), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text(pg[0], Vector2(W / 2, 40), 10, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	panel(Rect2(40, 50, 400, 166))
	var rows: Array = pg[1]
	for i in rows.size():
		var y := 70.0 + i * (17.0 if rows.size() > 6 else 22.0)
		text(rows[i][0], Vector2(56, y), 10, "#ffd23f")
		text(rows[i][1], Vector2(178, y), 10, "#ffffff")
	for i in 3:
		draw_rect(Rect2(W / 2 - 16 + i * 12, 224, 8, 4), Color.html("#ffd23f" if i == how_page else "#3a3f66"))
	if how_page > 0:
		btn("hprev", Rect2(40, 236, 80, 20), "VOLTAR", "#2e3358", "#ffffff", 8)
	btn("hnext", Rect2(W - 120, 236, 80, 20), "PRÓXIMO" if how_page < 2 else "ENTENDI!", "#ffd23f", "#0b0c14", 8)
	btn("hclose", Rect2(W / 2 - 30, 240, 60, 14), "FECHAR", "#2e3358", "#ffffff", 7)
	btn("tutstart", Rect2(W / 2 - 40, 4, 80, 14), "TUTORIAL", "#8ef0a0", "#0b0c14", 7)


func draw_options() -> void:
	screen_bg()
	text("OPÇÕES", Vector2(W / 2, 28), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	panel(Rect2(70, 50, 340, 140))
	text("Dificuldade dos bots", Vector2(86, 82), 10, "#ffffff")
	btn("opt:diff:-1", Rect2(290, 70, 18, 18), "-", "#2e3358", "#ffffff", 10)
	text(DIFFN[int(opt["diff"])], Vector2(341, 83), 10, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	btn("opt:diff:1", Rect2(376, 70, 18, 18), "+", "#2e3358", "#ffffff", 10)
	text("Dicas nas partidas", Vector2(86, 116), 10, "#ffffff")
	btn("opt:tips:0", Rect2(290, 104, 104, 18), "Ligadas" if opt["tips"] else "Desligadas", "#46d160" if opt["tips"] else "#2e3358", "#0b0c14" if opt["tips"] else "#ffffff", 8)
	text("A dificuldade vale para os modos normais e o torneio. Na ranqueada, vem do seu elo.", Vector2(W / 2, 146), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	btn("full", Rect2(86, 160, 130, 18), "TELA CHEIA", "#2e3358", "#ffffff", 8)
	btn("menu", Rect2(W / 2 - 48, 232, 96, 20), "VOLTAR", "#2e3358", "#ffffff", 9)


func gd_bar() -> void:
	text("GD %d" % int(save["gd"]), Vector2(W - 8, 18), 9, "#ffd23f", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	text("Pó Mágico %d" % int(save["po"]), Vector2(W - 8, 30), 9, "#c77dff", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")


func item_card(it: Dictionary, r: Rect2, sel: bool) -> void:
	var rc: String = Items.RARI[int(it["r"])][1]
	draw_rect(r, Color.html("#3a3f66" if sel else "#141626"))
	draw_rect(Rect2(r.position.x, r.end.y - 2, r.size.x, 2), Color.html(rc))
	draw_icon(it["b"], r.position + Vector2((r.size.x - 16) / 2, (r.size.y - 18) / 2), 2, rc)
	if int(it.get("up", 0)) > 0:
		text("+%d" % int(it["up"]), Vector2(r.end.x - 2, r.position.y + 8), 7, "#ffd23f", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")


func _msg_show(p: Vector2) -> void:
	if msg["txt"] != "" and time - float(msg["t"]) < 2.4:
		text(msg["txt"], p, 10, msg["col"], HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")


func draw_shop_old() -> void:
	screen_bg()
	text("LOJA", Vector2(W / 2, 22), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	gd_bar()
	text("Compre com Duel Gold (GD), que você ganha jogando", Vector2(W / 2, 36), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var items: Array = save["shop"]["items"]
	for i in items.size():
		var o: Dictionary = items[i]
		var r := Rect2(12 + (i % 3) * 112, 46 + (i / 3) * 92, 106, 86)
		panel(r)
		var it := {"b": o["b"], "r": o["r"], "up": 0}
		var rc: String = Items.RARI[int(o["r"])][1]
		var al := 0.35 if o["sold"] else 1.0
		draw_icon(o["b"], r.position + Vector2(6, 6), 3, rc)
		text((Items.bases[o["b"]]["names"][int(o["r"])] as String).left(16), r.position + Vector2(34, 12), 8, "#ffffff" if al > 0.5 else "#6a6f98")
		text(Items.RARI[int(o["r"])][0], r.position + Vector2(34, 22), 8, rc)
		text(Items.slot_name(Items.bases[o["b"]]["slot"]), r.position + Vector2(34, 31), 7, "#8a8fb8")
		var st := Items.item_stats(it)
		var j := 0
		for k in st:
			text("%s +%d" % [Items.STN[k], int(st[k])], r.position + Vector2(8 + j * 48, 44), 8, "#8ef0a0")
			j += 1
		var pr := Items.price(it)
		if o["sold"]:
			text("VENDIDO", r.position + Vector2(r.size.x / 2, 70), 8, "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
		else:
			var can := int(save["gd"]) >= pr
			btn("buy:%d" % i, Rect2(r.position.x + 8, r.position.y + 58, r.size.x - 16, 20), "%d GD" % pr, "#ffd23f" if can else "#3a3f66", "#0b0c14" if can else "#8a8fb8", 8)
	panel(Rect2(352, 46, 118, 178))
	draw_icon("orbe", Vector2(382, 54), 4, "#c77dff")
	text("PÓ MÁGICO", Vector2(411, 98), 8, "#c77dff", HORIZONTAL_ALIGNMENT_CENTER)
	text("Melhora itens até +10", Vector2(411, 110), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	text("Também cai nas partidas", Vector2(411, 120), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	btn("buypo:1", Rect2(360, 130, 102, 20), "1 por 90 GD", "#c77dff" if int(save["gd"]) >= 90 else "#3a3f66", "#0b0c14", 8)
	btn("buypo:5", Rect2(360, 156, 102, 20), "5 por 400 GD", "#c77dff" if int(save["gd"]) >= 400 else "#3a3f66", "#0b0c14", 8)
	btn("reroll", Rect2(360, 190, 102, 20), "NOVAS OFERTAS 40", "#2e3358", "#ffffff", 7)
	text("Ofertas novas a cada 3 partidas (%d restantes)" % (3 - int(save["shop"].get("n", 0))), Vector2(W / 2, 236), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	_msg_show(Vector2(W / 2, 226))
	btn("menu", Rect2(8, 246, 70, 18), "VOLTAR", "#2e3358", "#ffffff", 8)
	btn("bag", Rect2(W - 108, 246, 100, 18), "MOCHILA", "#2e3358", "#ffffff", 8)


func draw_bag() -> void:
	screen_bg()
	text("MOCHILA E FORJA", Vector2(W / 2, 20), 13, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	gd_bar()
	var tabs: Array = [["all", "Todos"]]
	for sl in Items.SLOTS:
		tabs.append([sl[0], (sl[1] as String).split(" ")[0]])
	for i in tabs.size():
		var on: bool = bag_filter == tabs[i][0]
		btn("bf:" + tabs[i][0], Rect2(10 + i * 48, 30, 46, 14), tabs[i][1], "#ffd23f" if on else "#2e3358", "#0b0c14" if on else "#ffffff", 7)
	var L: Array = (save["inv"] as Array).filter(func(x): return bag_filter == "all" or Items.slot_of(x) == bag_filter)
	L.sort_custom(func(a, b): return Items.power(a) > Items.power(b))
	var per := 40
	var pages := maxi(1, ceili(L.size() / float(per)))
	bag_page = mini(bag_page, pages - 1)
	panel(Rect2(10, 48, 272, 186))
	if L.is_empty():
		text("Nada aqui ainda. Visite a loja!", Vector2(146, 140), 9, "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
	var eq_ids: Array = []
	for v in save["equip"].values():
		eq_ids.append(int(v))
	var vis := L.slice(bag_page * per, bag_page * per + per)
	for i in vis.size():
		var it: Dictionary = vis[i]
		var r := Rect2(14 + (i % 8) * 33, 52 + (i / 8) * 36, 31, 32)
		item_card(it, r, bag_sel == int(it["id"]))
		if eq_ids.has(int(it["id"])):
			draw_rect(Rect2(r.position + Vector2(1, 1), Vector2(8, 8)), Color.html("#46d160"))
			text("E", r.position + Vector2(5, 8), 6, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
		buttons.append({"id": "bsel:%d" % int(it["id"]), "r": r})
	if pages > 1:
		btn("bpg:-1", Rect2(14, 236, 30, 10), "<", "#2e3358", "#ffffff", 7)
		text("%d/%d" % [bag_page + 1, pages], Vector2(64, 244), 7, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		btn("bpg:1", Rect2(84, 236, 30, 10), ">", "#2e3358", "#ffffff", 7)
	panel(Rect2(292, 48, 178, 186))
	var it := Items.by_id(save, bag_sel)
	if it.is_empty():
		text("Toque num item", Vector2(381, 140), 9, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	else:
		var R: Array = Items.RARI[int(it["r"])]
		var sl := Items.slot_of(it)
		var eq: bool = save["equip"].get(sl, null) != null and int(save["equip"][sl]) == int(it["id"])
		draw_icon(it["b"], Vector2(300, 56), 4, R[1])
		text(Items.item_name(it).left(20), Vector2(336, 66), 9, "#ffffff")
		text("%s · %s" % [R[0], Items.bases[it["b"]]["k"]], Vector2(336, 77), 8, R[1])
		text(Items.slot_name(sl), Vector2(336, 87), 8, "#8a8fb8")
		var st := Items.item_stats(it)
		var j := 0
		for k in st:
			text("%s +%d" % [Items.STN[k], int(st[k])], Vector2(300 + j * 56, 104), 9, "#8ef0a0")
			j += 1
		btn("beq", Rect2(300, 112, 162, 18), "TIRAR DO HERÓI" if eq else "EQUIPAR", "#2e3358" if eq else "#46d160", "#ffffff" if eq else "#0b0c14", 8)
		draw_rect(Rect2(300, 136, 162, 1), Color.html("#0b0c14"))
		text("FORJA", Vector2(381, 146), 8, "#c77dff", HORIZONTAL_ALIGNMENT_CENTER)
		var up := int(it["up"])
		if up >= 10:
			text("Nível máximo: +10!", Vector2(381, 166), 9, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
		else:
			var po: int = Items.UPG_PO[up]
			var gd := 40 * (up + 1)
			var ch: float = Items.UPG_CHANCE[up]
			var nx := it.duplicate()
			nx["up"] = up + 1
			text("+%d → +%d: %s" % [up, up + 1, Items.stat_line(Items.item_stats(nx))], Vector2(381, 158), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			text("Custo: %d pó + %d GD · chance %d%%" % [po, gd, roundi(ch * 100)], Vector2(381, 169), 8, "#ff9a9a" if ch < 1 else "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
			if ch < 1:
				text("Se falhar, volta de 1 a 3 níveis (nunca quebra)", Vector2(381, 179), 7, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER)
			var can := int(save["po"]) >= po and int(save["gd"]) >= gd
			btn("bup", Rect2(300, 184, 162, 20), "MELHORAR", "#c77dff" if can else "#3a3f66", "#0b0c14" if can else "#8a8fb8", 8)
		btn("bsell", Rect2(300, 210, 162, 16), "VENDER POR %d GD" % Items.sell_price(it), "#2e3358", "#ffffff", 7)
	_msg_show(Vector2(381, 252))
	btn("menu", Rect2(8, 248, 70, 16), "VOLTAR", "#2e3358", "#ffffff", 8)
	btn("shop", Rect2(150, 248, 90, 16), "LOJA", "#ffd23f", "#0b0c14", 8)
	btn("box", Rect2(246, 248, 40, 16), "CX %d" % int(save["boxes"]), "#ff8a3d" if int(save["boxes"]) > 0 else "#2e3358", "#0b0c14" if int(save["boxes"]) > 0 else "#ffffff", 7)


func draw_box() -> void:
	screen_bg()
	text("CAIXA DA SORTE", Vector2(W / 2, 22), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Você tem %d caixa(s) · ganhe subindo de elo na ranqueada" % int(save["boxes"]), Vector2(W / 2, 36), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var cx := W / 2
	var y := 62.0
	var cw := 44.0
	var ch := 54.0
	panel(Rect2(16, y - 6, W - 32, ch + 12))
	if not box_anim.is_empty():
		var A := box_anim
		var k := minf(1.0, float(A["t"]) / float(A["dur"]))
		var e := 1.0 - pow(1.0 - k, 4)
		var pos: float = e * float(A["target"])
		var strip: Array = A["strip"]
		for i in strip.size():
			var x: float = cx + (i - pos) * cw - cw / 2 + 2
			if x < 16 or x > W - 16 - cw:
				continue
			var itb: Dictionary = strip[i]
			var rc: String = Items.RARI[int(itb["r"])][1]
			draw_rect(Rect2(x, y, cw - 4, ch), col(rc, 0.25))
			draw_rect(Rect2(x, y + ch - 2, cw - 4, 2), Color.html(rc))
			draw_icon(itb["b"], Vector2(x + (cw - 4 - 24) / 2, y + 12), 3, rc)
		draw_rect(Rect2(cx - 1, y - 10, 2, ch + 20), Color.html("#ffd23f"))
		draw_colored_polygon(PackedVector2Array([Vector2(cx - 6, y - 10), Vector2(cx + 6, y - 10), Vector2(cx, y - 3)]), Color.html("#ffd23f"))
		if k >= 1:
			A["done"] = true
			var w: Dictionary = A["win"]
			var R: Array = Items.RARI[int(w["r"])]
			panel(Rect2(W / 2 - 110, 130, 220, 92))
			draw_rect(Rect2(W / 2 - 110, 130, 220, 3), Color.html(R[1]))
			draw_icon(w["b"], Vector2(W / 2 - 100, 142), 5, R[1])
			text((R[0] as String).to_upper() + "!", Vector2(W / 2 + 30, 150), 10, R[1], HORIZONTAL_ALIGNMENT_CENTER)
			text(Items.bases[w["b"]]["names"][int(w["r"])], Vector2(W / 2 + 30, 166), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			text(Items.stat_line(Items.item_stats(w)), Vector2(W / 2 + 30, 180), 9, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
			text("Foi para a sua mochila", Vector2(W / 2 + 30, 196), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
			btn("boxok", Rect2(W / 2 - 50, 206, 100, 16), "PEGAR", "#ffd23f", "#0b0c14", 8)
	else:
		panel(Rect2(W / 2 - 110, 130, 220, 92))
		text("CHANCES", Vector2(W / 2, 140), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
		for i in Items.RARI.size():
			var yy := 152.0 + i * 11
			var pc: float = Items.BOX_ODDS[i] * 100.0
			text(Items.RARI[i][0], Vector2(W / 2 - 96, yy), 9, Items.RARI[i][1])
			text(("%.1f%%" % pc).replace(".0%", "%").replace(".", ","), Vector2(W / 2 + 96, yy), 9, "#ffffff", HORIZONTAL_ALIGNMENT_RIGHT)
			draw_rect(Rect2(W / 2 - 24, yy - 5, maxf(1, Items.BOX_ODDS[i] * 110), 4), Color.html(Items.RARI[i][1]))
		var has := int(save["boxes"]) > 0
		btn("boxopen", Rect2(W / 2 - 70, 228, 140, 22), "GIRAR!" if has else "SEM CAIXAS", "#ffd23f" if has else "#3a3f66", "#0b0c14" if has else "#8a8fb8", 10)
	if not box_anim.is_empty() and box_anim.get("done", false) and box_anim.has("icon"):
		draw_rect(Rect2(W / 2 - 112, 108, 224, 20), Color.html("#0b0c14"))
		draw_rect(Rect2(W / 2 - 110, 110, 220, 16), Color.html("#ff7ad9"))
		text("BÔNUS: ícone de perfil " + str(_char_by_id(box_anim["icon"])["name"]) + "!", Vector2(W / 2, 121), 8, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
	btn("menu", Rect2(8, 248, 70, 16), "VOLTAR", "#2e3358", "#ffffff", 8)


func draw_prep() -> void:
	if prep.is_empty():
		return
	var a: Dictionary = pick["arena"]
	draw_texture(arena_tex[a["id"]], Vector2.ZERO)
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.84))
	var el: float = prep["t"]
	var ranked: bool = pick.get("ranked", false)
	text("PREPARAÇÃO", Vector2(W / 2, 18), 13, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Equipe seu herói e aperte PRONTO · %ds" % maxi(0, ceili(30 - el)), Vector2(W / 2, 31), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	panel(Rect2(8, 40, 128, 196))
	var c: Dictionary = pick["me"]
	spr(c["id"], Vector2(72, 96), 2.4)
	text((c["name"] as String).left(16), Vector2(72, 108), 9, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	text(c["el"], Vector2(72, 118), 8, ELCOL.get(c["el"], "#ffffff"), HORIZONTAL_ALIGNMENT_CENTER)
	var g := Items.my_gear(save, ranked)
	var m := arena_mod(a, c["el"])
	var rows := [["atk", "ATQ", "#ff6a3d"], ["def", "DEF", "#9aa3c7"], ["vel", "VEL", "#ffd23f"], ["esp", "ESP", "#4fc3ff"], ["esq", "ESQ", "#8ef0a0"]]
	for i in rows.size():
		var y := 128.0 + i * 14
		var base := roundi(float(c[rows[i][0]]) * m)
		var bon := int(g.get(rows[i][0], 0))
		text(rows[i][1], Vector2(14, y + 6), 7, "#c9cbe6")
		var bw := minf(70, base / 150.0 * 70)
		draw_rect(Rect2(38, y, 70, 6), Color.html("#0b0c14"))
		draw_rect(Rect2(38, y, bw, 6), Color.html(rows[i][2]))
		draw_rect(Rect2(38 + bw, y, minf(70 - bw, bon / 150.0 * 70), 6), Color.WHITE)
		text("%d%s" % [base, ("+%d" % bon) if bon > 0 else ""], Vector2(132, y + 6), 7, "#8ef0a0" if bon > 0 else "#ffffff", HORIZONTAL_ALIGNMENT_RIGHT)
	var tot := Items.total(Items.gear_raw(save))
	var capd := Items.total(g)
	text("Poder dos itens: %d%s" % [capd, (" (de %d)" % tot) if capd < tot else ""], Vector2(72, 206), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	text("Ranqueada: máximo %d" % Items.ITEM_CAP_RANK if ranked else "Máximo %d" % Items.ITEM_CAP, Vector2(72, 216), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	panel(Rect2(144, 40, 170, 196))
	text("EQUIPAMENTO", Vector2(229, 50), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	for i in Items.SLOTS.size():
		var sl: Array = Items.SLOTS[i]
		var r := Rect2(150 + (i % 2) * 82, 58 + (i / 2) * 58, 78, 54)
		var on: bool = prep_slot == sl[0]
		draw_rect(r, Color.html("#3a3f66" if on else "#1d2140"))
		if on:
			draw_rect(r.grow(-0.5), Color.html("#ffd23f"), false, 1.0)
		text(sl[1], Vector2(r.get_center().x, r.position.y + 8), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		if not prep["ready"]:
			buttons.append({"id": "pslot:" + sl[0], "r": r})
		var it := Items.by_id(save, save["equip"].get(sl[0], null))
		if not it.is_empty():
			var rc: String = Items.RARI[int(it["r"])][1]
			draw_rect(Rect2(r.position + Vector2(2, 11), Vector2(30, 7)), Color.html("#46d160"))
			text("EQUIPADO", r.position + Vector2(17, 17), 5, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
			draw_icon(it["b"], r.position + Vector2(31, 16), 2, rc)
			text((Items.bases[it["b"]]["names"][int(it["r"])] as String).left(14) + ((" +%d" % int(it["up"])) if int(it["up"]) > 0 else ""), Vector2(r.get_center().x, r.position.y + 42), 7, rc, HORIZONTAL_ALIGNMENT_CENTER)
			text(Items.stat_line(Items.item_stats(it)).left(20), Vector2(r.get_center().x, r.position.y + 51), 6, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
			if not prep["ready"]:
				btn("punq:" + sl[0], Rect2(r.position.x + 66, r.position.y + 2, 10, 10), "X", "#ff4d5e", "#ffffff", 6)
		else:
			text("vazio", Vector2(r.get_center().x, r.position.y + 28), 8, "#4a4f7a", HORIZONTAL_ALIGNMENT_CENTER)
			text("toque para equipar", Vector2(r.get_center().x, r.position.y + 40), 6, "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
	panel(Rect2(322, 40, 150, 196))
	if prep_slot != "" and not prep["ready"]:
		var cur := Items.by_id(save, save["equip"].get(prep_slot, null))
		var L: Array = (save["inv"] as Array).filter(func(x): return Items.slot_of(x) == prep_slot and (cur.is_empty() or int(x["id"]) != int(cur["id"])))
		L.sort_custom(func(x, y): return Items.power(x) > Items.power(y))
		text(Items.slot_name(prep_slot).to_upper(), Vector2(397, 50), 7, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
		text("EQUIPADO AGORA", Vector2(330, 61), 6, "#46d160")
		draw_rect(Rect2(326, 64, 142, 22), Color.html("#1c3a26"))
		if not cur.is_empty():
			var rc: String = Items.RARI[int(cur["r"])][1]
			draw_icon(cur["b"], Vector2(328, 67), 2, rc)
			text((Items.bases[cur["b"]]["names"][int(cur["r"])] as String).left(15) + ((" +%d" % int(cur["up"])) if int(cur["up"]) > 0 else ""), Vector2(346, 73), 7, rc)
			text(Items.stat_line(Items.item_stats(cur)), Vector2(346, 82), 6, "#8ef0a0")
			btn("punq:" + prep_slot, Rect2(430, 88, 38, 11), "TIRAR", "#ff4d5e", "#ffffff", 6)
		else:
			text("nada equipado", Vector2(397, 78), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		text("TROCAR POR:" if L.size() > 0 else "Sem outros itens deste tipo", Vector2(330, 106), 6, "#ffd23f")
		for k in mini(6, L.size()):
			var it2: Dictionary = L[k]
			var y := 110.0 + k * 19
			var rr := Rect2(326, y, 142, 17)
			var rc2: String = Items.RARI[int(it2["r"])][1]
			draw_rect(rr, Color.html("#141626"))
			draw_icon(it2["b"], Vector2(328, y + 1), 2, rc2)
			text((Items.bases[it2["b"]]["names"][int(it2["r"])] as String).left(15) + ((" +%d" % int(it2["up"])) if int(it2["up"]) > 0 else ""), Vector2(346, y + 8), 7, rc2)
			text(Items.stat_line(Items.item_stats(it2)), Vector2(346, y + 15), 6, "#8ef0a0")
			buttons.append({"id": "pitem:%d" % int(it2["id"]), "r": rr})
		if L.size() > 6:
			text("+%d na mochila" % (L.size() - 6), Vector2(397, 234), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	else:
		text("JOGADORES", Vector2(397, 50), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
		var pls: Array = prep["players"]
		for i in mini(10, pls.size()):
			var q: Dictionary = pls[i]
			var y := 56.0 + i * 17
			var rd: bool = prep["ready"] if q["me"] else float(q["at"]) <= el
			draw_rect(Rect2(326, y, 142, 15), Color.html("#1c2a40" if int(q["team"]) == 0 else "#3a1c22"))
			text(("%s: %s" % [q["n"], q["c"]["name"]]).left(22), Vector2(330, y + 10), 7, "#8ef0a0" if q["me"] else "#ffffff")
			draw_rect(Rect2(452, y + 3, 12, 9), Color.html("#46d160" if rd else "#3a3f66"))
			text("✓" if rd else "…", Vector2(458, y + 11), 7, "#0b0c14" if rd else "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	if not prep["ready"]:
		btn("ready", Rect2(W / 2 - 70, 242, 140, 22), "PRONTO!", "#46d160", "#0b0c14", 11)
		btn("bag", Rect2(8, 244, 70, 18), "MOCHILA", "#2e3358", "#ffffff", 8)
	else:
		text("Aguardando os outros jogadores…", Vector2(W / 2, 256), 10, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")


# =====================================================================
# VISUAIS, GEMAS, PASSE E LOJA NOVA
func cos_find(id) -> Dictionary:
	for k in COS:
		for c in COS[k][1]:
			if c[0] == id:
				return {"k": k, "id": c[0], "n": c[1], "col": c[2], "price": c[3]}
	return {"k": "", "id": "", "n": "", "col": "#ffffff", "price": 0}


func cos_owned(id: String) -> bool:
	var c := cos_find(id)
	return int(c["price"]) == 0 or (save["cos"]["owned"] as Array).has(id)


func cos_color(c: String, t: float) -> String:
	if c == "rainbow":
		return Color.from_hsv(fmod(t * 0.33, 1.0), 0.75, 1.0).to_html(false)
	return c


func do_emote(f: Fighter) -> void:
	if f.emote_cd > 0 or f.dead:
		return
	if G.get("net", false) and net["role"] == "client" and f == G["p"]:
		net["cnt"]["e"] = int(net["cnt"]["e"]) + 1
	var fc: Dictionary = save["cos"]["eq"] if f == G["p"] else f.cos
	f.emote = cos_find(fc.get("emote", "e_gg"))["n"]
	if f.emote == "":
		f.emote = "GG!"
	f.emote_t = 2.0
	f.emote_cd = 4.0


func pass_level() -> int:
	return mini(PASS_LV, int(save["pass"]["xp"]) / PASS_XP)


func pass_reward(lv: int, prem: bool) -> Dictionary:
	var icn: Dictionary = ICON_PASS_P if prem else ICON_PASS_F
	if icn.has(lv):
		return {"k": "icon", "id": id_of(icn[lv]), "txt": "Ícone: " + str(icn[lv])}
	if not prem:
		if lv % 5 == 0:
			return {"k": "po", "n": 3, "txt": "3 Pó Mágico"}
		if lv % 3 == 0:
			return {"k": "gd", "n": 200, "txt": "200 GD"}
		return {"k": "gd", "n": 80, "txt": "80 GD"}
	if PASS_PREM.has(lv):
		return {"k": "cos", "id": PASS_PREM[lv], "txt": cos_find(PASS_PREM[lv])["n"]}
	var g := 100 if lv % 5 == 0 else 30
	return {"k": "gems", "n": g, "txt": "%d Gemas" % g}


func week_no() -> int:
	return int((Time.get_unix_time_from_system() - 1767571200.0) / (7 * 86400.0))   # semanas desde 05/01/2026


func seeded(n: float) -> float:
	var x := sin(n * 9301.0 + 49297.0) * 233280.0
	return x - floorf(x)


func weekly_promos() -> Array:
	var w := week_no()
	var ks := Items.base_ids()
	var out: Array = []
	for i in 3:
		var b: String = ks[int(seeded(w * 7 + i * 13) * ks.size())]
		var r: int = [2, 3, 4][i]
		var off: float = [0.3, 0.4, 0.5][i]
		out.append({"b": b, "r": r, "off": off, "price": roundi(float(Items.RARI[r][3]) * (1.0 - off) / 10.0) * 10, "k": "%d:%d" % [w, i]})
	return out


func buy_item(b: String, r: int, price: int) -> bool:
	if int(save["gd"]) < price:
		_flash("GD insuficiente", "#ff9a9a")
		return false
	save["gd"] = int(save["gd"]) - price
	var it := Items.new_item(save, b, r)
	save["inv"].append(it)
	bag_sel = it["id"]
	_persist()
	_flash("Comprado: " + Items.item_name(it), "#8ef0a0")
	return true


func open_modal(title: String, lines: Array, btns: Array, on_ok := Callable()) -> void:
	modal = {"title": title, "lines": lines, "btns": btns, "ok": on_ok}


func draw_modal() -> void:
	if modal.is_empty():
		return
	draw_rect(Rect2(0, 0, W, H), Color(0.04, 0.05, 0.08, 0.8))
	panel(Rect2(90, 70, 300, 120))
	text(modal["title"], Vector2(W / 2, 92), 10, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	var lines: Array = modal["lines"]
	for i in lines.size():
		text(lines[i], Vector2(W / 2, 112 + i * 12), 9, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	var bs: Array = modal["btns"]
	var bw := minf(104.0, (284.0 - (bs.size() - 1) * 8) / bs.size())
	for i in bs.size():
		btn(bs[i][0], Rect2(W / 2 - (bs.size() * (bw + 8) - 8) / 2.0 + i * (bw + 8), 160, bw, 20), bs[i][1], bs[i][2], "#0b0c14", 8)


func clean_nick(v: String) -> String:
	var rx := RegEx.new()
	rx.compile("[^\\p{L}\\p{N} _.-]")
	var n := rx.sub(v, "", true).strip_edges()
	while n.contains("  "):
		n = n.replace("  ", " ")
	return n.left(16)


func ask_nick(first := false) -> void:
	var _cbn := func(v: String) -> void:
		var n := clean_nick(v)
		if bad_name(n):
			open_modal("NOME NÃO PERMITIDO", ["Esse nome não é permitido.", "Escolha outro."], [["mod:nick", "ESCOLHER OUTRO", "#ffd23f"]])
			return
		if n.length() >= 3:
			save["nick"] = n
			_persist()
			net_send(hello_msg(n))
		elif n.length() > 0:
			open_modal("NOME CURTO DEMAIS", ["Use pelo menos 3 letras ou números."], [["mod:x", "OK", "#ffd23f"]])
	var ttl := "Seu nome foi trocado pela moderação. Escolha um novo:" if net.get("can_rename", false) else ("Bem-vindo! Escolha seu nome (depois não dá para trocar):" if first else "Seu nome de jogador (depois não dá para trocar):")
	ask_text(ttl, str(save.get("nick", "")), _cbn)


## Caixa de texto (nome, sala, senha, servidor). Funciona com o teclado virtual no celular.
func ask_text(title: String, def: String, cb: Callable, secret := false) -> void:
	if ask != null:
		ask.queue_free()
	var root := Panel.new()
	root.position = Vector2(80, 60)
	root.size = Vector2(320, 110)
	var lb := Label.new()
	lb.text = title
	lb.position = Vector2(10, 8)
	lb.size = Vector2(300, 20)
	root.add_child(lb)
	var le := LineEdit.new()
	le.text = def
	le.secret = secret
	le.max_length = 40
	le.position = Vector2(10, 34)
	le.size = Vector2(300, 28)
	root.add_child(le)
	var ok := Button.new()
	ok.text = "OK"
	ok.position = Vector2(170, 72)
	ok.size = Vector2(140, 28)
	root.add_child(ok)
	var cancel := Button.new()
	cancel.text = "Cancelar"
	cancel.position = Vector2(10, 72)
	cancel.size = Vector2(140, 28)
	root.add_child(cancel)
	var done := func(accept: bool) -> void:
		var v := le.text.strip_edges()
		root.queue_free()
		ask = null
		if accept:
			cb.call(v)
	ok.pressed.connect(done.bind(true))
	cancel.pressed.connect(done.bind(false))
	le.text_submitted.connect(func(_t): done.call(true))
	add_child(root)
	ask = root
	le.grab_focus()


func shop_header() -> void:
	screen_bg()
	text("LOJA", Vector2(W / 2, 18), 13, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("GD %d" % int(save["gd"]), Vector2(W - 8, 14), 9, "#ffd23f", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	text("Pó %d" % int(save["po"]), Vector2(W - 8, 25), 9, "#c77dff", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	text("Gemas %d" % int(save["gems"]), Vector2(W - 8, 36), 9, "#4fd1ff", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	var tabs := [["destaques", "DESTAQUES"], ["catalogo", "CATÁLOGO"], ["visuais", "VISUAIS"], ["gemas", "GEMAS"]]
	for i in tabs.size():
		var on: bool = shop_tab == tabs[i][0]
		btn("stab:" + tabs[i][0], Rect2(10 + i * 84, 26, 80, 15), tabs[i][1], "#ffd23f" if on else "#2e3358", "#0b0c14" if on else "#ffffff", 7)


func draw_shop() -> void:
	shop_header()
	if shop_tab == "destaques":
		var days := maxi(1, ceili((1767571200.0 + (week_no() + 1) * 7 * 86400.0 - Time.get_unix_time_from_system()) / 86400.0))
		text("PROMOÇÕES DA SEMANA · terminam em %d dia(s)" % days, Vector2(12, 54), 8, "#ff8a3d")
		var promos := weekly_promos()
		for i in promos.size():
			var o: Dictionary = promos[i]
			var R: Array = Items.RARI[int(o["r"])]
			var r := Rect2(12 + i * 112, 60, 106, 124)
			panel(r)
			draw_rect(Rect2(r.end.x - 38, r.position.y, 38, 14), Color.html("#e0393e"))
			text("-%d%%" % roundi(o["off"] * 100), Vector2(r.end.x - 19, r.position.y + 11), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			draw_icon(o["b"], r.position + Vector2((r.size.x - 32) / 2, 18), 4, R[1])
			text(Items.bases[o["b"]]["names"][int(o["r"])], Vector2(r.get_center().x, r.position.y + 62), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			text("%s · %s" % [R[0], Items.slot_name(Items.bases[o["b"]]["slot"])], Vector2(r.get_center().x, r.position.y + 72), 7, R[1], HORIZONTAL_ALIGNMENT_CENTER)
			text(Items.stat_line(Items.item_stats({"b": o["b"], "r": o["r"], "up": 0})), Vector2(r.get_center().x, r.position.y + 84), 8, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
			text("%d GD" % int(R[3]), Vector2(r.get_center().x, r.position.y + 96), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
			draw_rect(Rect2(r.get_center().x - 18, r.position.y + 93, 36, 1), Color.html("#8a8fb8"))
			if (save.get("promos", {}) as Dictionary).has(o["k"]):
				text("COMPRADO", Vector2(r.get_center().x, r.position.y + 113), 8, "#46d160", HORIZONTAL_ALIGNMENT_CENTER)
			else:
				var can := int(save["gd"]) >= int(o["price"])
				btn("promo:%d" % i, Rect2(r.position.x + 8, r.position.y + 102, r.size.x - 16, 16), "%d GD" % int(o["price"]), "#ffd23f" if can else "#3a3f66", "#0b0c14" if can else "#8a8fb8", 8)
		panel(Rect2(352, 48, 118, 136))
		draw_icon("orbe", Vector2(382, 54), 4, "#c77dff")
		text("PÓ MÁGICO", Vector2(411, 98), 8, "#c77dff", HORIZONTAL_ALIGNMENT_CENTER)
		text("Melhora itens até +10", Vector2(411, 110), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		btn("buypo:1", Rect2(360, 118, 102, 18), "1 por 90 GD", "#c77dff" if int(save["gd"]) >= 90 else "#3a3f66", "#0b0c14", 8)
		btn("buypo:5", Rect2(360, 142, 102, 18), "5 por 400 GD", "#c77dff" if int(save["gd"]) >= 400 else "#3a3f66", "#0b0c14", 8)
		panel(Rect2(12, 194, 458, 40))
		text("Todos os itens estão no CATÁLOGO. Visuais e o Passe usam Gemas.", Vector2(W / 2, 208), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		text("Gemas nunca compram itens, GD, Pó Mágico ou caixas: só aparência e o Passe.", Vector2(W / 2, 222), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	elif shop_tab == "catalogo":
		var tabs: Array = [["all", "Todos"]]
		for sl in Items.SLOTS:
			tabs.append([sl[0], (sl[1] as String).split(" ")[0]])
		for i in tabs.size():
			var on: bool = cat_slot == tabs[i][0]
			btn("cs:" + tabs[i][0], Rect2(10 + i * 46, 46, 44, 12), tabs[i][1], "#ffd23f" if on else "#2e3358", "#0b0c14" if on else "#ffffff", 6)
		for i in 6:
			var rv := i - 1
			var on2 := cat_rar == rv
			var cc: String = "#ffd23f" if rv < 0 else Items.RARI[rv][1]
			btn("cr:%d" % rv, Rect2(10 + i * 54, 62, 52, 11), "Todas" if rv < 0 else Items.RARI[rv][0], cc if on2 else "#1d2140", "#0b0c14" if on2 else ("#ffffff" if rv < 0 else cc), 6)
		var L: Array = []
		for b in Items.base_ids():
			for r in 5:
				if (cat_slot == "all" or Items.bases[b]["slot"] == cat_slot) and (cat_rar < 0 or r == cat_rar):
					L.append({"b": b, "r": r, "up": 0})
		var per := 24
		var pages := maxi(1, ceili(L.size() / float(per)))
		cat_page = mini(cat_page, pages - 1)
		panel(Rect2(10, 78, 322, 156))
		var vis := L.slice(cat_page * per, cat_page * per + per)
		for i in vis.size():
			var it: Dictionary = vis[i]
			var rr := Rect2(14 + (i % 8) * 40, 82 + (i / 8) * 50, 38, 47)
			var sel: bool = not cat_sel.is_empty() and cat_sel["b"] == it["b"] and int(cat_sel["r"]) == int(it["r"])
			var rc: String = Items.RARI[int(it["r"])][1]
			var pr := int(Items.RARI[int(it["r"])][3])
			draw_rect(rr, Color.html("#3a3f66" if sel else "#141626"))
			draw_rect(Rect2(rr.position.x, rr.end.y - 2, 38, 2), Color.html(rc))
			draw_icon(it["b"], rr.position + Vector2(11, 4), 2, rc)
			text((Items.bases[it["b"]]["names"][int(it["r"])] as String).split(" ")[0].left(8), Vector2(rr.get_center().x, rr.position.y + 30), 6, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			text(str(pr), Vector2(rr.get_center().x, rr.position.y + 41), 7, "#ffd23f" if int(save["gd"]) >= pr else "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
			buttons.append({"id": "csel:%s:%d" % [it["b"], int(it["r"])], "r": rr})
		text("%d itens · página %d/%d" % [L.size(), cat_page + 1, pages], Vector2(170, 244), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		btn("cpg:-1", Rect2(90, 236, 24, 12), "<", "#2e3358", "#ffffff", 7)
		btn("cpg:1", Rect2(226, 236, 24, 12), ">", "#2e3358", "#ffffff", 7)
		panel(Rect2(340, 48, 130, 186))
		if cat_sel.is_empty():
			text("Toque num item", Vector2(405, 140), 9, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		else:
			var R2: Array = Items.RARI[int(cat_sel["r"])]
			draw_icon(cat_sel["b"], Vector2(389, 54), 4, R2[1])
			text(Items.bases[cat_sel["b"]]["names"][int(cat_sel["r"])], Vector2(405, 98), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			text(R2[0], Vector2(405, 108), 8, R2[1], HORIZONTAL_ALIGNMENT_CENTER)
			var st := Items.item_stats(cat_sel)
			var j := 0
			for k in st:
				text("%s +%d" % [Items.STN[k], int(st[k])], Vector2(405, 134 + j * 11), 9, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
				j += 1
			var mx := cat_sel.duplicate()
			mx["up"] = 10
			text("Com +10: " + Items.stat_line(Items.item_stats(mx)), Vector2(405, 168), 6, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
			var can := int(save["gd"]) >= int(R2[3])
			btn("cbuy", Rect2(348, 188, 114, 22), "COMPRAR %d GD" % int(R2[3]), "#ffd23f" if can else "#3a3f66", "#0b0c14" if can else "#8a8fb8", 7)
	elif shop_tab == "visuais":
		var cats := COS.keys()
		for i in cats.size():
			var on: bool = cos_cat == cats[i]
			btn("cc:" + cats[i], Rect2(10 + i * 66, 46, 64, 12), COS[cats[i]][0], "#4fd1ff" if on else "#2e3358", "#0b0c14" if on else "#ffffff", 6)
		text("Visuais aparecem em qualquer lenda sorteada e não dão vantagem.", Vector2(W / 2, 72), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		var lst: Array = COS[cos_cat][1]
		for i in lst.size():
			var c: Array = lst[i]
			var r := Rect2(12 + (i % 3) * 152, 78 + (i / 3) * 80, 146, 74)
			panel(r)
			var cc := cos_color(c[2], time)
			var own := cos_owned(c[0])
			var eq: bool = save["cos"]["eq"].get(cos_cat, null) == c[0]
			if cos_cat == "aura":
				_xf(r.position + Vector2(30, 40), 0, Vector2(1, 0.33))
				draw_circle(Vector2.ZERO, 18, col(cc, 0.5 + 0.2 * sin(time * 4)))
				_xf(Vector2.ZERO)
				spr("saci", r.position + Vector2(30, 40))
			elif cos_cat == "trail":
				for k in 6:
					draw_rect(Rect2(r.position.x + 12 + k * 6, r.position.y + 30 + sin(time * 6 + k) * 3, 3, 3), col(cc, 1.0 - k / 6.0))
				spr("saci", r.position + Vector2(54, 40))
			elif cos_cat == "title":
				text(c[1], r.position + Vector2(34, 30), 8, cc, HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
				spr("saci", r.position + Vector2(34, 56))
			elif cos_cat == "emote":
				draw_rect(Rect2(r.position + Vector2(8, 14), Vector2(50, 16)), Color.WHITE)
				text(c[1], r.position + Vector2(33, 26), 8, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)
				spr("saci", r.position + Vector2(20, 60))
			else:
				draw_rect(Rect2(r.position + Vector2(14, 16), Vector2(36, 36)), Color.html(cc), false, 3.0)
				spr("saci", r.position + Vector2(32, 48))
			text(c[1], r.position + Vector2(98, 24), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			if eq:
				text("EQUIPADO", r.position + Vector2(98, 44), 7, "#46d160", HORIZONTAL_ALIGNMENT_CENTER)
			if own:
				btn("ceq:" + c[0], Rect2(r.position.x + 64, r.position.y + 50, 74, 16), "TIRAR" if eq else "EQUIPAR", "#2e3358" if eq else "#46d160", "#ffffff" if eq else "#0b0c14", 7)
			else:
				var can := int(save["gems"]) >= int(c[3])
				btn("cbuyc:" + c[0], Rect2(r.position.x + 64, r.position.y + 50, 74, 16), "%d GEMAS" % int(c[3]), "#4fd1ff" if can else "#3a3f66", "#0b0c14" if can else "#8a8fb8", 7)
	else:
		text("GEMAS", Vector2(W / 2, 58), 10, "#4fd1ff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		text("Use em visuais e no Passe de Temporada. Nada de vantagem em luta.", Vector2(W / 2, 72), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		for i in GEM_PACKS.size():
			var pk: Array = GEM_PACKS[i]
			var r := Rect2(12 + i * 114, 82, 108, 120)
			panel(r)
			for k in mini(5, i + 2):
				var gp := r.position + Vector2(r.size.x / 2 - 12 + ((k % 3) - 1) * 14, 30 - (k / 3) * 10)
				draw_colored_polygon(PackedVector2Array([gp + Vector2(0, -7), gp + Vector2(6, 0), gp + Vector2(0, 7), gp + Vector2(-6, 0)]), Color.html("#4fd1ff"))
			text("%d gemas" % int(pk[0]), Vector2(r.get_center().x, r.position.y + 62), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			if int(pk[1]) > 0:
				text("+%d de bônus" % int(pk[1]), Vector2(r.get_center().x, r.position.y + 74), 8, "#46d160", HORIZONTAL_ALIGNMENT_CENTER)
			btn("gem:%d" % i, Rect2(r.position.x + 10, r.position.y + 88, r.size.x - 20, 20), pk[2], "#46d160", "#0b0c14", 8)
		text("Protótipo: o pagamento não está ligado. No jogo real abre a Steam ou a Google Play.", Vector2(W / 2, 216), 8, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER)
	_msg_show(Vector2(W / 2, 256))
	btn("menu", Rect2(8, 248, 60, 16), "VOLTAR", "#2e3358", "#ffffff", 8)
	btn("bag", Rect2(W - 78, 248, 70, 16), "MOCHILA", "#2e3358", "#ffffff", 8)


func draw_pass() -> void:
	screen_bg()
	var P: Dictionary = save["pass"]
	var lv := pass_level()
	text("PASSE DE TEMPORADA %d" % int(P["season"]), Vector2(W / 2, 18), 12, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Gemas %d" % int(save["gems"]), Vector2(W - 8, 14), 9, "#4fd1ff", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	text("Nível %d/%d" % [lv, PASS_LV], Vector2(12, 36), 10, "#ffffff", HORIZONTAL_ALIGNMENT_LEFT, "#0b0c14")
	bar(Rect2(80, 31, 200, 5), 1.0 if lv >= PASS_LV else float(int(P["xp"]) % PASS_XP) / PASS_XP, "#ffd23f")
	text("%d/%d XP · +100 por partida, +50 por vitória" % [int(P["xp"]) % PASS_XP, PASS_XP], Vector2(290, 36), 8, "#c9cbe6")
	text("GRÁTIS", Vector2(8, 82), 7, "#46d160")
	text("PREMIUM", Vector2(8, 132), 7, "#ffb02e")
	for i in 8:
		var L := pass_page * 8 + i + 1
		if L > PASS_LV:
			break
		var x := 52.0 + i * 52
		var on := L <= lv
		text(str(L), Vector2(x + 23, 52), 9, "#ffd23f" if on else "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
		for prem in [false, true]:
			var y := 110.0 if prem else 60.0
			var rw := pass_reward(L, prem)
			var claimed: bool = (P["cp"] if prem else P["cf"]).has(L)
			var locked: bool = prem and not P["premium"]
			draw_rect(Rect2(x, y, 46, 46), Color.html("#1c3a26" if claimed else ("#2a2f55" if on and not locked else "#141626")))
			match rw["k"]:
				"icon":
					spr(rw["id"], Vector2(x + 23, y + 30), 1)
				"cos":
					draw_rect(Rect2(x + 15, y + 6, 16, 16), Color.html(cos_color(cos_find(rw["id"])["col"], time)))
				"po":
					draw_icon("orbe", Vector2(x + 15, y + 4), 2, "#c77dff")
				"gems":
					draw_colored_polygon(PackedVector2Array([Vector2(x + 23, y + 6), Vector2(x + 31, y + 14), Vector2(x + 23, y + 22), Vector2(x + 15, y + 14)]), Color.html("#4fd1ff"))
				_:
					draw_circle(Vector2(x + 23, y + 14), 8, Color.html("#ffd23f"))
			text((rw["txt"] as String).left(12), Vector2(x + 23, y + 30), 6, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
			if locked:
				text("🔒", Vector2(x + 38, y + 10), 7, "#ffb02e", HORIZONTAL_ALIGNMENT_CENTER)
			if claimed:
				text("PEGO", Vector2(x + 23, y + 41), 6, "#46d160", HORIZONTAL_ALIGNMENT_CENTER)
			elif on and not locked:
				btn("pc:%d:%d" % [1 if prem else 0, L], Rect2(x + 3, y + 33, 40, 11), "PEGAR", "#ffd23f", "#0b0c14", 6)
	btn("ppg:-1", Rect2(8, 166, 24, 14), "<", "#2e3358", "#ffffff", 7)
	btn("ppg:1", Rect2(W - 32, 166, 24, 14), ">", "#2e3358", "#ffffff", 7)
	text("Níveis %d–%d" % [pass_page * 8 + 1, mini(PASS_LV, pass_page * 8 + 8)], Vector2(W / 2, 176), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	if not P["premium"]:
		var gsum := 0
		for l in range(1, PASS_LV + 1):
			var rw2 := pass_reward(l, true)
			if rw2["k"] == "gems":
				gsum += int(rw2["n"])
		panel(Rect2(70, 188, 340, 40))
		text("Passe Premium: 15 visuais exclusivos + %d Gemas de volta ao completar" % gsum, Vector2(W / 2, 202), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
		btn("passbuy", Rect2(W / 2 - 70, 210, 140, 14), "ATIVAR · %d GEMAS" % PASS_PRICE, "#ffb02e" if int(save["gems"]) >= PASS_PRICE else "#3a3f66", "#0b0c14", 7)
	else:
		text("PREMIUM ATIVO! Pegue as recompensas das duas trilhas.", Vector2(W / 2, 204), 9, "#ffb02e", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	_msg_show(Vector2(W / 2, 240))
	btn("menu", Rect2(8, 248, 60, 16), "VOLTAR", "#2e3358", "#ffffff", 8)
	btn("shop", Rect2(W - 88, 248, 80, 16), "LOJA", "#ffd23f", "#0b0c14", 8)


func _shop2_button(id: String) -> bool:
	if id.begins_with("mod:"):
		var a := id.substr(4)
		if a == "ok" and modal.get("ok", Callable()).is_valid():
			(modal["ok"] as Callable).call()
		if a.begins_with("rep:"):
			if rep_target >= 0:
				net_send({"t": "report", "pid": rep_target, "reason": a.substr(4)})
			rep_target = -1
			modal = {}
			return true
		if a == "tut":
			modal = {}
			start_tutorial()
			return true
		if a == "skiptut":
			modal = {}
			save["howto"] = true
			_persist()
			state = "modes"
			return true
		if a == "nick":
			modal = {}
			call_deferred("ask_nick", not save.has("nick"))
			return true
		if a == "accreg" or a == "acclog":
			modal = {}
			ACC["back"] = state if state in ["title", "rank_lobby"] else "online"
			state = "account"
			ACC["msg"] = ""
			ACC["err"] = ""
			if net["status"] != "on":
				net_connect()
			if a == "accreg":
				acc_register()
			else:
				acc_login()
			return true
		if a == "gems":
			shop_tab = "gemas"
			state = "shop"
		modal = {}
		return true
	if id.begins_with("stab:"):
		shop_tab = id.substr(5)
		return true
	if id.begins_with("cs:"):
		cat_slot = id.substr(3)
		cat_page = 0
		return true
	if id.begins_with("cr:"):
		cat_rar = int(id.substr(3))
		cat_page = 0
		return true
	if id.begins_with("cpg:"):
		cat_page = maxi(0, cat_page + int(id.substr(4)))
		return true
	if id.begins_with("csel:"):
		var parts := id.split(":")
		cat_sel = {"b": parts[1], "r": int(parts[2]), "up": 0}
		return true
	if id == "cbuy":
		if not cat_sel.is_empty():
			buy_item(cat_sel["b"], int(cat_sel["r"]), int(Items.RARI[int(cat_sel["r"])][3]))
		return true
	if id.begins_with("promo:"):
		var o: Dictionary = weekly_promos()[int(id.substr(6))]
		if not save.has("promos"):
			save["promos"] = {}
		if not save["promos"].has(o["k"]) and buy_item(o["b"], int(o["r"]), int(o["price"])):
			save["promos"][o["k"]] = 1
			_persist()
		return true
	if id.begins_with("cc:"):
		cos_cat = id.substr(3)
		return true
	if id.begins_with("ceq:"):
		var c := cos_find(id.substr(4))
		if save["cos"]["eq"].get(c["k"], null) == c["id"]:
			save["cos"]["eq"].erase(c["k"])
		else:
			save["cos"]["eq"][c["k"]] = c["id"]
		_persist()
		return true
	if id.begins_with("cbuyc:"):
		var c := cos_find(id.substr(6))
		if int(save["gems"]) < int(c["price"]):
			open_modal("GEMAS INSUFICIENTES", ["Faltam %d gemas para %s." % [int(c["price"]) - int(save["gems"]), c["n"]]], [["mod:gems", "VER GEMAS", "#4fd1ff"], ["mod:x", "FECHAR", "#c9cbe6"]])
		else:
			var _cb1 := func() -> void:
				save["gems"] = int(save["gems"]) - int(c["price"])
				save["cos"]["owned"].append(c["id"])
				save["cos"]["eq"][c["k"]] = c["id"]
				_persist()
				_flash("Novo visual: " + c["n"], "#4fd1ff")
			open_modal("CONFIRMAR COMPRA", ["%s por %d gemas?" % [c["n"], int(c["price"])], "Visual, sem vantagem em luta."], [["mod:ok", "COMPRAR", "#4fd1ff"], ["mod:x", "CANCELAR", "#c9cbe6"]], _cb1)
		return true
	if id.begins_with("gem:"):
		var pk: Array = GEM_PACKS[int(id.substr(4))]
		var _cb2 := func() -> void:
			save["gems"] = int(save["gems"]) + int(pk[0]) + int(pk[1])
			_persist()
			_flash("+%d gemas (teste)" % (int(pk[0]) + int(pk[1])), "#4fd1ff")
		open_modal("PAGAMENTO DE DEMONSTRAÇÃO", ["%d gemas por %s" % [int(pk[0]) + int(pk[1]), pk[2]], "No jogo real, abre a Steam ou a Google Play.", "Receber as gemas de graça para testar?"], [["mod:ok", "RECEBER (TESTE)", "#46d160"], ["mod:x", "CANCELAR", "#c9cbe6"]], _cb2)
		return true
	if id == "pass":
		state = "pass"
		return true
	if id.begins_with("ppg:"):
		pass_page = clampi(pass_page + int(id.substr(4)), 0, ceili(PASS_LV / 8.0) - 1)
		return true
	if id == "passbuy":
		if int(save["gems"]) < PASS_PRICE:
			open_modal("GEMAS INSUFICIENTES", ["O Passe Premium custa %d gemas." % PASS_PRICE, "Você tem %d." % int(save["gems"])], [["mod:gems", "VER GEMAS", "#4fd1ff"], ["mod:x", "FECHAR", "#c9cbe6"]])
		else:
			var _cb3 := func() -> void:
				save["gems"] = int(save["gems"]) - PASS_PRICE
				save["pass"]["premium"] = true
				_persist()
				_flash("Passe Premium ativado!", "#ffb02e")
			open_modal("ATIVAR PASSE PREMIUM", ["%d gemas" % PASS_PRICE, "15 visuais exclusivos e gemas de volta."], [["mod:ok", "ATIVAR", "#ffb02e"], ["mod:x", "CANCELAR", "#c9cbe6"]], _cb3)
		return true
	if id.begins_with("pc:"):
		var parts := id.split(":")
		var prem := parts[1] == "1"
		var L := int(parts[2])
		var P: Dictionary = save["pass"]
		var lst: Array = P["cp"] if prem else P["cf"]
		if lst.has(L) or L > pass_level() or (prem and not P["premium"]):
			return true
		var rw := pass_reward(L, prem)
		lst.append(L)
		match rw["k"]:
			"gd":
				save["gd"] = int(save["gd"]) + int(rw["n"])
			"po":
				save["po"] = int(save["po"]) + int(rw["n"])
			"gems":
				save["gems"] = int(save["gems"]) + int(rw["n"])
			"cos":
				if not (save["cos"]["owned"] as Array).has(rw["id"]):
					save["cos"]["owned"].append(rw["id"])
			"icon":
				give_icon(rw["id"])
		_persist()
		_flash("Recebido: " + rw["txt"], "#8ef0a0")
		return true
	if id == "emote":
		if not G.is_empty() and not (G["p"] as Fighter).dead:
			do_emote(G["p"])
		return true
	return false


# =====================================================================
# ONLINE (mesmo servidor e mesmas mensagens do protótipo web)
func server_url() -> String:
	return opt.get("server", DEFAULT_SERVER)


static func _imul(a: int, b: int) -> int:
	a &= 0xffffffff
	b &= 0xffffffff
	var ah := (a >> 16) & 0xffff
	var al := a & 0xffff
	var bh := (b >> 16) & 0xffff
	var bl := b & 0xffff
	return ((al * bl) + ((((ah * bl) + (al * bh)) & 0xffff) << 16)) & 0xffffffff


var _rng_state := 0


## Gerador mulberry32: o mesmo do protótipo web, para o sorteio sair igual em todas as telas.
func mrand() -> float:
	_rng_state = (_rng_state + 0x6D2B79F5) & 0xffffffff
	var a := _rng_state
	var t := _imul(a ^ (a >> 15), 1 | a)
	t = ((t + _imul(t ^ (t >> 7), 61 | t)) & 0xffffffff) ^ t
	return float((t ^ (t >> 14)) & 0xffffffff) / 4294967296.0


func net_send(o: Dictionary) -> void:
	if ws != null and ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
		ws.send_text(JSON.stringify(o))


func net_connect() -> void:
	if ws != null and ws.get_ready_state() <= WebSocketPeer.STATE_OPEN:
		return
	ws = WebSocketPeer.new()
	net["status"] = "connecting"
	net["err"] = ""
	if ws.connect_to_url(server_url()) != OK:
		net["status"] = "error"
		net["err"] = "Endereço do servidor inválido"
		ws = null


func net_poll(dt: float) -> void:
	if ws == null:
		return
	ws.poll()
	var st := ws.get_ready_state()
	if st == WebSocketPeer.STATE_OPEN:
		if net["status"] != "on":
			net["status"] = "on"
			net_send(hello_msg(save.get("nick", "Jogador")))
		net["ping_t"] = float(net["ping_t"]) + dt
		if net["ping_t"] > 3.0:
			net["ping_t"] = 0.0
			net_send({"t": "ping", "ts": Time.get_ticks_msec()})
		while ws.get_available_packet_count() > 0:
			var m = JSON.parse_string(ws.get_packet().get_string_from_utf8())
			if m is Dictionary:
				net_msg(m)
	elif st == WebSocketPeer.STATE_CLOSED:
		var was_fight: bool = net["on"] and state in ["fight", "countdown", "prep", "draw"]
		if net["status"] == "connecting":
			net["err"] = "Não foi possível conectar. O servidor pode estar acordando (até 1 minuto): tente de novo."
			net["err_t"] = time
		net["status"] = "off"
		net["ready"] = false
		net["room"] = {}
		ws = null
		if was_fight:
			net_abort("Conexão perdida.")


func net_abort(msg: String) -> void:
	net["on"] = false
	net["role"] = ""
	prep = {}
	paused = false
	open_modal("PARTIDA ENCERRADA", [msg], [["mod:x", "OK", "#ffd23f"]])
	state = "room" if not (net["room"] as Dictionary).is_empty() else "online"


var LB := {"list": [], "total": 0, "me": {}, "page": 0, "loading": false, "err": ""}


func ident() -> Dictionary:
	if not save.has("ident") or str(save["ident"].get("pid", "")) == "":
		var c := Crypto.new()
		save["ident"] = {"pid": c.generate_random_bytes(12).hex_encode(), "key": c.generate_random_bytes(16).hex_encode()}
		_persist()
	return save["ident"]


func hello_msg(n: String) -> Dictionary:
	var I := ident()
	return {"t": "hello", "name": n, "ver": "1.6", "pid": I["pid"], "key": I["key"], "title": str(save.get("title", "")), "icon": my_icon()}


# ---------- conta (usuário e senha) ----------
var ACC := {"msg": "", "err": "", "busy": false}
var _acc_tmp := {}


func _user_ok(v: String) -> bool:
	var re := RegEx.new()
	re.compile("^[a-z0-9_.]{3,16}$")
	return re.search(v.to_lower()) != null and not bad_name(v)


func _acc_send(o: Dictionary) -> void:
	ACC["busy"] = true
	ACC["err"] = ""
	ACC["msg"] = ""
	if net["status"] != "on" or not net.get("ready", false):
		ACC["pending"] = o
		net_connect()
		return
	net_send(o)


func acc_register() -> void:
	ask_text("Escolha um usuário (3 a 16 letras, números, _ ou ponto):", "", _acc_reg_user)


func _acc_reg_user(u: String) -> void:
	if not _user_ok(u):
		ACC["err"] = "Usuário: 3 a 16 letras, números, _ ou ponto (sem espaço)."
		return
	_acc_tmp = {"user": u.to_lower()}
	ask_text("Crie uma senha (mínimo 6 caracteres):", "", _acc_reg_pass, true)


func _acc_reg_pass(p: String) -> void:
	if p.length() < 6:
		ACC["err"] = "A senha precisa ter pelo menos 6 caracteres."
		return
	_acc_tmp["pass"] = p
	ask_text("Confirme a senha:", "", _acc_reg_conf, true)


func _acc_reg_conf(p2: String) -> void:
	if p2 != str(_acc_tmp.get("pass", "")):
		ACC["err"] = "As senhas não são iguais."
		return
	_acc_send({"t": "register", "user": _acc_tmp["user"], "pass": _acc_tmp["pass"]})
	_acc_tmp = {}


func acc_login() -> void:
	ask_text("Seu usuário:", "", _acc_login_user)


func _acc_login_user(u: String) -> void:
	_acc_tmp = {"user": u.to_lower()}
	ask_text("Sua senha:", "", _acc_login_pass, true)


func _acc_login_pass(p: String) -> void:
	_acc_send({"t": "login", "user": _acc_tmp.get("user", ""), "pass": p})
	_acc_tmp = {}


func acc_pass() -> void:
	ask_text("Senha atual:", "", _acc_pass_old, true)


func _acc_pass_old(o: String) -> void:
	_acc_tmp = {"old": o}
	ask_text("Senha nova (mínimo 6 caracteres):", "", _acc_pass_new, true)


func _acc_pass_new(p: String) -> void:
	if p.length() < 6:
		ACC["err"] = "A senha precisa ter pelo menos 6 caracteres."
		return
	_acc_send({"t": "passwd", "old": _acc_tmp.get("old", ""), "pass": p})
	_acc_tmp = {}


func acc_do_logout() -> void:
	save["user"] = ""
	save.erase("ident")
	save.erase("rank")
	Ranked.init_save(save)
	_persist()
	ACC["msg"] = "Você saiu da conta."
	ACC["err"] = ""
	net_send(hello_msg(save.get("nick", "Jogador")))


func _auth_msg(m: Dictionary) -> void:
	ACC["busy"] = false
	if m.get("expired", false):
		save["user"] = ""
		save.erase("ident")
		_persist()
		ACC["err"] = "Sua sessão expirou. Entre na conta de novo."
		net_send(hello_msg(save.get("nick", "Jogador")))
		return
	if m.has("err"):
		ACC["err"] = str(m["err"])
		ACC["msg"] = ""
		return
	ACC["err"] = ""
	match str(m.get("ok", "")):
		"register":
			save["user"] = str(m["user"])
			if not save.has("nick"):
				save["nick"] = str(m["user"])
				net_send(hello_msg(save["nick"]))
			ACC["msg"] = "Conta criada! Seu elo agora fica salvo nela."
		"login":
			save["ident"] = {"pid": str(m["pid"]), "key": str(m["key"])}
			save["user"] = str(m["user"])
			if m.get("name") != null:
				save["nick"] = str(m["name"])
			if m.get("rank") is Dictionary:
				_rank_from_server(m["rank"])
			ACC["msg"] = "Bem-vindo de volta, %s!" % str(m["user"])
		"pass":
			ACC["msg"] = "Senha alterada."
	_persist()


func draw_account() -> void:
	online_header("CONTA")
	panel(Rect2(60, 44, 360, 180))
	var u := str(save.get("user", ""))
	if u != "":
		text("Você está na conta", Vector2(W / 2, 72), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		text(u, Vector2(W / 2, 92), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		text("%s · %s" % [str(save.get("nick", "")), Ranked.label(save["rank"])], Vector2(W / 2, 110), 9, Ranked.color(save["rank"]), HORIZONTAL_ALIGNMENT_CENTER)
		text("Entre com este usuário em outro aparelho para jogar com o mesmo elo.", Vector2(W / 2, 130), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		btn("accpass", Rect2(100, 150, 130, 22), "TROCAR SENHA", "#4fd1ff", "#0b0c14", 8)
		btn("accout", Rect2(250, 150, 130, 22), "SAIR", "#ff6a6a", "#0b0c14", 9)
	else:
		text("Crie uma conta para guardar seu elo", Vector2(W / 2, 70), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
		text("e jogar com ele em qualquer aparelho.", Vector2(W / 2, 84), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
		text("Sem conta, o elo fica preso a este aparelho.", Vector2(W / 2, 102), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		btn("accreg", Rect2(100, 120, 130, 26), "CRIAR CONTA", "#ffd23f", "#0b0c14", 9)
		btn("acclog", Rect2(250, 120, 130, 26), "ENTRAR", "#4fd1ff", "#0b0c14", 9)
		text("Não pedimos e-mail. Guarde bem sua senha: sem ela não dá para recuperar a conta.", Vector2(W / 2, 166), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	if ACC["busy"]:
		text("Conectando ao servidor… (pode levar até 1 minuto)" if ACC.has("pending") else "Aguarde…", Vector2(W / 2, 200), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	elif str(ACC["err"]) != "":
		text(str(ACC["err"]), Vector2(W / 2, 200), 8, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER)
	elif str(ACC["msg"]) != "":
		text(str(ACC["msg"]), Vector2(W / 2, 200), 8, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
	btn("accback", Rect2(8, 248, 70, 16), "VOLTAR", "#2e3358", "#ffffff", 8)


## rank vindo do servidor: números chegam como float e alguns nomes mudam
func _rank_from_server(src: Dictionary) -> void:
	for k in src:
		var v = src[k]
		save["rank"][k] = int(v) if typeof(v) == TYPE_FLOAT else v
	if src.has("peakName"):
		save["rank"]["peak_name"] = src["peakName"]


func net_msg(m: Dictionary) -> void:
	match m.get("t", ""):
		"welcome":
			net["id"] = int(m["id"])
			net["quick"] = m.get("quick", [])
			if m.has("now"):
				t_off = int(m["now"]) - int(Time.get_unix_time_from_system() * 1000.0)
		"rooms":
			net["rooms"] = m["rooms"]
		"room":
			net["room"] = m
			if state in ["online", "lobby", "queue"]:
				state = "room"
		"chat":
			net["chat"].append("%s: %s" % [m["from"], m["msg"]])
			if net["chat"].size() > 5:
				net["chat"].pop_front()
		"error", "info":
			net["err"] = m["msg"]
			net["err_t"] = time
		"queued":
			state = "queue"
		"start":
			net_begin_draw(m)
		"prep":
			net["prep_ready"] = (m["ready"] as Array).map(func(x): return int(x))
		"go":
			net["go"] = m
			net_start_match()
		"inp":
			net["inputs"][int(m["s"])] = m["i"]
		"snap":
			if net["role"] == "client" and G.get("net", false):
				net_apply_snap(m["s"])
		"end":
			if net["role"] == "client" and G.get("net", false):
				net_end(m)
		"aborted":
			if net["on"]:
				net_abort(m["msg"])
		"left":
			net["room"] = {}
			if state == "room":
				state = "online"
		"pong":
			net["ping"] = Time.get_ticks_msec() - int(m["ts"])
		"rank":
			if m.has("seasonEnd"):
				net["season_end"] = int(m["seasonEnd"])
			var sn := str(m.get("name", ""))
			if sn != "" and (m.get("rename", false) or not sn.begins_with("Jogador")):
				save["nick"] = sn
			net["can_rename"] = m.get("rename", false)
			if m.get("rename", false) and not net.get("rename_asked", false):
				net["rename_asked"] = true
				call_deferred("ask_nick", false)
			if m.has("rank"):
				_rank_from_server(m["rank"])
				save["user"] = str(m["user"]) if m.get("user") != null else ""
				_persist()
			net["ready"] = true
			stat_flush()
			if ACC.get("pending") is Dictionary:
				net_send(ACC["pending"])
				ACC.erase("pending")
		"auth":
			_auth_msg(m)
		"rankres":
			var k: Dictionary = net.get("rk_pending", {})
			net["rk_pending"] = {}
			if m.get("void", false):
				k["pending"] = false
				k["void"] = str(m.get("msg", ""))
			else:
				_rank_from_server(m["rank"])
				var o: Dictionary = m.get("out", {})
				if o.get("box", false):
					save["boxes"] = int(save.get("boxes", 0)) + 1
				_persist()
				k.erase("pending")
				k["d"] = int(o.get("d", 0))
				k["after"] = str(o.get("after", ""))
				k["col"] = Ranked.color(save["rank"])
				if o.has("placement"):
					k["placement"] = int(o["placement"])
				if o.has("placedNow"):
					k["placed_now"] = o["placedNow"]
				if o.has("promo"):
					k["promo"] = o["promo"]
				if o.get("tierUp", false):
					k["tier_up"] = true
				if o.has("demo"):
					k["demo"] = o["demo"]
				if o.get("shield", false):
					k["shield"] = true
				if o.get("box", false):
					k["box"] = true
		"top":
			LB["loading"] = false
			LB["list"] = m.get("list", [])
			LB["total"] = int(m.get("total", 0))
			LB["me"] = m["me"] if m.get("me") is Dictionary else {}
			LB["err"] = str(m.get("err", ""))


func net_begin_draw(S: Dictionary) -> void:
	net["start"] = S
	net["on"] = true
	var slots: Array = S["slots"]
	net["my_slot"] = -1
	for i in slots.size():
		if slots[i]["pid"] != null and int(slots[i]["pid"]) == int(net["id"]):
			net["my_slot"] = i
	net["role"] = "host" if int(S["host"]) == int(net["id"]) else "client"
	net["inputs"] = {}
	net["prep_ready"] = []
	net["cnt"] = {"b": 0, "c": 0, "d": 0, "e": 0}
	_rng_state = int(S["seed"])
	var arena: Dictionary = ARENAS[int(mrand() * ARENAS.size())]
	var used := {}
	var picks: Array = []
	for i in slots.size():
		var c: Dictionary = chars[int(mrand() * chars.size())]
		while used.has(c["id"]):
			c = chars[int(mrand() * chars.size())]
		used[c["id"]] = true
		picks.append(c)
	var me: int = net["my_slot"]
	var my_team := int(slots[me]["team"])
	var ffa: bool = S["mode"] == "ffa"
	var ally_slots: Array = []
	var foe_slots: Array = []
	for i in slots.size():
		if i == me:
			continue
		if not ffa and int(slots[i]["team"]) == my_team:
			ally_slots.append(i)
		else:
			foe_slots.append(i)
	net["order"] = [me] + ally_slots + foe_slots
	pick = {"me": picks[me], "allies": ally_slots.map(func(i): return picks[i]), "foes": foe_slots.map(func(i): return picks[i]), "arena": arena, "mode": S["mode"], "online": true}
	pick["foe"] = pick["foes"][0]
	pick["ranked"] = bool(S.get("ranked", false))
	if pick["ranked"]:
		for i in slots.size():
			if i != me and not slots[i]["bot"]:
				save["rank"]["opp"] = int(slots[i].get("mmr", 1150))
				pick["opp_name"] = str(slots[i]["name"])
	last_mode = "ranked" if pick["ranked"] else "online"
	state = "draw"
	draw_t = 0.0
	revealed = [false, false, false]


func enter_net_prep() -> void:
	if state == "prep":
		return
	var S: Dictionary = net["start"]
	var slots: Array = S["slots"]
	var my_team := int(slots[net["my_slot"]]["team"])
	var all_chars: Array = [pick["me"]] + pick["allies"] + pick["foes"]
	var players: Array = []
	var order: Array = net["order"]
	for k in order.size():
		var i: int = order[k]
		var q: Dictionary = slots[i]
		players.append({"n": "Bot" if q["bot"] else q["name"], "c": all_chars[k], "slot": i, "pid": -1 if q["pid"] == null else int(q["pid"]), "me": i == net["my_slot"],
			"team": 0 if int(q["team"]) == my_team else 1, "bot": q["bot"], "at": 1e9})
	prep = {"t": 0.0, "ready": false, "ready_at": 0.0, "next": "net", "net": true, "players": players}
	prep_slot = ""
	state = "prep"


func net_prep_ready() -> void:
	if prep.is_empty() or prep.get("sent", false):
		return
	prep["ready"] = true
	prep["sent"] = true
	net_send({"t": "prepready", "gear": Items.my_gear(save, pick.get("ranked", false)), "cos": save["cos"]["eq"]})


func net_slot_f(slot: int) -> Fighter:
	for f: Fighter in G["all"]:
		if f.slot == slot:
			return f
	return null


func net_start_match() -> void:
	var S: Dictionary = net["start"]
	if S.is_empty():
		return
	prep = {}
	start_match()
	G["net"] = true
	var slots: Array = S["slots"]
	var order: Array = net["order"]
	var all_f: Array = G["all"]
	for k in order.size():
		var f: Fighter = all_f[k]
		f.slot = order[k]
		var q: Dictionary = slots[f.slot]
		f.remote = net["role"] == "host" and not q["bot"] and f.slot != net["my_slot"]
		if f.remote:
			f.bot = false
		f.net_name = "Bot" if q["bot"] else q["name"]
	# posições iguais em todas as telas
	var cc := Vector2((BX1 + BX2) / 2, (BY1 + BY2) / 2)
	var by_slot: Array = all_f.duplicate()
	by_slot.sort_custom(func(a, b): return a.slot < b.slot)
	if S["mode"] == "ffa":
		for i in by_slot.size():
			var ang := PI + i * TAU / by_slot.size()
			(by_slot[i] as Fighter).pos = cc + Vector2(cos(ang) * (BX2 - BX1) * 0.38, sin(ang) * (BY2 - BY1) * 0.36)
	else:
		for tm in [0, 1]:
			var arr: Array = by_slot.filter(func(f): return int(slots[f.slot]["team"]) == tm)
			for i in arr.size():
				(arr[i] as Fighter).pos = Vector2(BX1 + (BX2 - BX1) * (0.84 if tm else 0.16) + (i % 2) * (18.0 if tm else -18.0), BY1 + 50 + (BY2 - BY1 - 100) * (0.5 if arr.size() == 1 else float(i) / (arr.size() - 1)))
	for f: Fighter in all_f:
		f.face = 1.0 if f.pos.x < cc.x else -1.0
		f.aim = 0.0 if f.face > 0 else PI
		f.nx = f.pos.x
		f.ny = f.pos.y
	var gears: Dictionary = net["go"].get("gears", {})
	var coss: Dictionary = net["go"].get("cos", {})
	for f: Fighter in all_f:
		var q: Dictionary = slots[f.slot]
		f.cos = save["cos"]["eq"] if f == G["p"] else coss.get(str(f.slot), {})
		if net["role"] == "host" and not q["bot"] and f != G["p"] and gears.has(str(f.slot)):
			for k in f.gear:
				f.st[k] = float(f.st[k]) - float(f.gear[k])
			apply_gear(f, gears[str(f.slot)])
	G["tips"] = {"on": false, "q": [], "cur": {}, "done": {}}
	cam = cam_clamp((G["p"] as Fighter).pos - Vector2(W / 2, H / 2 + 10))
	net["snap_t"] = 0.0
	net["new_pops"] = []


func net_remote_input(f: Fighter) -> Vector2:
	var I: Dictionary = net["inputs"].get(f.slot, {})
	if I.is_empty():
		return Vector2.ZERO
	f.aim = float(I.get("aim", f.aim))
	var want_block: bool = not G["over"] and f.stun <= 0 and f.dash_t <= 0 and f.channel.is_empty() and f.broken <= 0 and bool(I.get("blk", false))
	if want_block and not f.blocking:
		f.block_start = time
	f.blocking = want_block
	if not G["over"] and f.stun <= 0:
		if I.get("a", false):
			do_a(f)
		if int(I.get("b", 0)) != int(f.last_in["b"]):
			f.last_in["b"] = int(I["b"])
			do_b(f)
		if int(I.get("c", 0)) != int(f.last_in["c"]):
			f.last_in["c"] = int(I["c"])
			do_c(f)
		if int(I.get("d", 0)) != int(f.last_in["d"]):
			f.last_in["d"] = int(I["d"])
			do_dash(f, float(I.get("da", f.aim)))
		if int(I.get("e", 0)) != int(f.last_in["e"]):
			f.last_in["e"] = int(I["e"])
			do_emote(f)
	return Vector2(float(I.get("mx", 0)), float(I.get("my", 0)))


func net_client_update(dt: float) -> void:
	var p: Fighter = G["p"]
	var mv := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP): mv.y -= 1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN): mv.y += 1
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT): mv.x -= 1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): mv.x += 1
	if touch["joy"] != -1:
		mv = touch["joy_v"]
	if mv.length() > 1:
		mv = mv.normalized()
	var aim := auto_aim(p) if is_touch else (get_local_mouse_position() + cam - (p.pos - Vector2(0, 8))).angle()
	var cnt: Dictionary = net["cnt"]
	if pressed["b"]: cnt["b"] = int(cnt["b"]) + 1
	if pressed["c"]: cnt["c"] = int(cnt["c"]) + 1
	if pressed["dash"]: cnt["d"] = int(cnt["d"]) + 1
	var blk: bool = Input.is_physical_key_pressed(KEY_SHIFT) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or touch["blk"] != -1
	var atk: bool = (Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) and not is_touch) or touch["a"] != -1
	net["in_t"] = float(net["in_t"]) + dt
	if float(net["in_t"]) >= 1.0 / 30.0 or pressed["b"] or pressed["c"] or pressed["dash"]:
		net["in_t"] = 0.0
		net_send({"t": "inp", "i": {"mx": snappedf(mv.x, 0.01), "my": snappedf(mv.y, 0.01), "aim": snappedf(aim, 0.01), "a": atk, "blk": blk,
			"b": cnt["b"], "c": cnt["c"], "d": cnt["d"], "da": snappedf(mv.angle() if mv.length() > 0.2 else aim, 0.01), "e": cnt["e"]}})
	pressed["b"] = false
	pressed["c"] = false
	pressed["dash"] = false
	if not p.dead and not G["over"]:
		p.aim = (p.foe.pos - p.pos).angle() if blk and p.foe != null else aim
		p.face = 1.0 if cos(p.aim) >= 0 else -1.0
		if blk and not p.blocking:
			p.block_start = time
		p.blocking = blk
		if p.stun <= 0 and p.dash_t <= 0:
			p.pos += mv * p.speed * (0.4 if blk else 1.0) * dt
			p.walk = p.walk + dt * 12 if mv.length() > 0.2 else 0.0
		p.pos.x = clampf(p.pos.x, BX1 + 7, BX2 - 7)
		p.pos.y = clampf(p.pos.y, BY1 + 16, BY2 - 2)
	for f: Fighter in G["all"]:
		var target := Vector2(f.nx, f.ny)
		var k := clampf(dt * (6.0 if f == p else 14.0), 0, 1)
		if f.pos.distance_to(target) > 60:
			f.pos = target
		else:
			f.pos = f.pos.lerp(target, k)
		f.flash = maxf(0, f.flash - dt)
		f.emote_t = maxf(0, f.emote_t - dt)
		if f.dash_t > 0:
			f.trail.append({"p": f.pos, "t": 0.0})
		for tr in f.trail:
			tr["t"] += dt
		f.trail = f.trail.filter(func(tr): return tr["t"] < 0.18)
		if f != p:
			f.walk = f.walk + dt * 12 if f.moving else 0.0
	var bd := 1e9
	for e: Fighter in G["all"]:
		if e.team != p.team and not e.dead and e.pos.distance_to(p.pos) < bd:
			bd = e.pos.distance_to(p.pos)
			p.foe = e
	for q in G["proj"]:
		q["p"] += q["v"] * dt
	for z in G["zones"]:
		z["t"] += dt
	for sl in G["slashes"]:
		sl["t"] += dt
	G["slashes"] = G["slashes"].filter(func(x): return x["t"] < 0.14)
	for pp in G["pops"]:
		pp["t"] += dt
	G["pops"] = G["pops"].filter(func(x): return x["t"] < 0.9)
	for pt in G["parts"]:
		pt["t"] += dt
		pt["p"] += pt["v"] * dt
	G["parts"] = G["parts"].filter(func(x): return x["t"] < x["life"])
	G["shake"] = maxf(0, G["shake"] - dt * 20)
	var zc: Rect2 = G["zone"]
	var zt: Rect2 = G["zt"]
	G["zone"] = Rect2(zc.position.lerp(zt.position, clampf(dt * 3, 0, 1)), zc.size.lerp(zt.size, clampf(dt * 3, 0, 1)))
	cam = cam.lerp(cam_clamp(p.pos - Vector2(W / 2, H / 2 + 10)), clampf(dt * 6, 0, 1))
	if G["over"]:
		G["ko_t"] += dt
		if G["ko_t"] > 1.6:
			state = "result"
			result_t = 0.0
			finish_result()


func net_host_tick(dt: float) -> void:
	net["snap_t"] = float(net["snap_t"]) + dt
	if net["snap_t"] < 0.05:
		return
	net["snap_t"] = 0.0
	var F: Array = []
	for f: Fighter in G["all"]:
		var fl := (1 if f.blocking else 0) | (2 if f.stun > 0 else 0) | (4 if f.freeze > 0 else 0) | (8 if f.shield_t > 0 else 0) | (16 if f.ghost > 0 else 0) | (32 if f.big > 0 else 0) | (64 if f.marked > 0 else 0) | (128 if f.reflect > 0 else 0) | (512 if f.inv > 0 else 0) | (1024 if f.broken > 0 else 0) | (2048 if f.dead else 0) | (4096 if f.dash_t > 0 else 0) | (8192 if f.vel.length() > 15 else 0)
		F.append([f.slot, snappedf(f.pos.x, 0.1), snappedf(f.pos.y, 0.1), roundi(f.hp), roundi(f.charge), f.face, snappedf(f.aim, 0.01), fl, roundi(f.guard), roundi(f.guard_max), snappedf(f.cd_a, 0.01), snappedf(f.cd_b, 0.01), snappedf(f.cd_dash, 0.01),
			f.emote if f.emote_t > 0 else 0, snappedf(f.reveal_t, 0.01), f.cover, [f.channel["kind"], f.channel["col"]] if not f.channel.is_empty() else 0, snappedf(f.block_start - time, 0.01)])
	var P: Array = []
	for q in G["proj"]:
		P.append([snappedf(q["p"].x, 0.1), snappedf(q["p"].y, 0.1), snappedf(q["v"].x, 0.1), snappedf(q["v"].y, 0.1), q.get("kind", ""), q.get("col", "#ffffff"), q.get("r", 3), snappedf(q.get("ang", 0.0), 0.01)])
	var Z: Array = []
	for z in G["zones"]:
		Z.append([snappedf(z["p"].x, 0.1), snappedf(z["p"].y, 0.1), z["r"], z["col"], snappedf(z["t"], 0.01), z["delay"], 1 if z["once"] else 0, z.get("kind", ""), z.get("dur", 0), 1 if z.get("special", false) else 0])
	var D: Array = []
	for d in G["decoys"]:
		D.append([(d["owner"] as Fighter).slot, snappedf(d["p"].x, 0.1), snappedf(d["p"].y, 0.1), d["face"], snappedf(d["t"], 0.01)])
	var SL: Array = []
	for sl in G["slashes"]:
		if sl["t"] < 0.05:
			SL.append([snappedf(sl["p"].x, 0.1), snappedf(sl["p"].y, 0.1), snappedf(sl["ang"], 0.01), snappedf(sl["arc"], 0.01), sl["r"], sl["col"]])
	var zt: Rect2 = G["zt"]
	var pops: Array = net["new_pops"].slice(0, 30)
	net["new_pops"] = []
	net_send({"t": "snap", "s": {"tm": snappedf(G["time"], 0.1), "zt": [zt.position.x, zt.position.y, zt.end.x, zt.end.y], "f": F, "p": P, "z": Z, "d": D, "sl": SL, "pp": pops}})


func net_apply_snap(S: Dictionary) -> void:
	G["time"] = float(S["tm"])
	var zt: Array = S["zt"]
	G["zt"] = Rect2(zt[0], zt[1], zt[2] - zt[0], zt[3] - zt[1])
	for e in S["f"]:
		var f := net_slot_f(int(e[0]))
		if f == null:
			continue
		f.nx = e[1]
		f.ny = e[2]
		if float(e[3]) < f.hp - 0.5:
			f.flash = 0.1
			sparks(f.pos - Vector2(0, 9), "#ffffff", 5, 80)
		f.hp = e[3]
		f.charge = e[4]
		var fl := int(e[7])
		if f != G["p"]:
			f.face = e[5]
			f.aim = e[6]
			f.blocking = fl & 1 != 0
			f.block_start = time + float(e[17])
		f.stun = 0.1 if fl & 2 else 0.0
		f.freeze = 0.1 if fl & 4 else 0.0
		f.shield_t = 0.1 if fl & 8 else 0.0
		f.ghost = 0.1 if fl & 16 else 0.0
		f.big = 0.1 if fl & 32 else 0.0
		f.marked = 0.1 if fl & 64 else 0.0
		f.reflect = 0.1 if fl & 128 else 0.0
		f.inv = 0.1 if fl & 512 else 0.0
		f.broken = 0.1 if fl & 1024 else 0.0
		f.dash_t = 0.1 if fl & 4096 else 0.0
		f.moving = fl & 8192 != 0
		if fl & 2048 and not f.dead:
			f.dead = true
			f.hp = 0
		f.guard = e[8]
		f.guard_max = maxf(1, float(e[9]))
		f.cd_a = e[10]
		f.cd_b = e[11]
		f.cd_dash = e[12]
		if typeof(e[13]) == TYPE_STRING:
			f.emote = e[13]
			f.emote_t = 0.3
		f.reveal_t = e[14]
		f.cover = int(e[15])
		f.channel = {"kind": e[16][0], "col": e[16][1], "t": 1.0, "tick": 1.0} if typeof(e[16]) == TYPE_ARRAY else {}
	var P: Array = []
	for q in S["p"]:
		P.append({"p": Vector2(q[0], q[1]), "v": Vector2(q[2], q[3]), "kind": q[4], "col": q[5], "r": float(q[6]), "ang": float(q[7]), "owner": G["p"], "hit": [], "t": 0.0, "life": 9.0})
	G["proj"] = P
	var Z: Array = []
	for z in S["z"]:
		Z.append({"p": Vector2(z[0], z[1]), "r": float(z[2]), "col": z[3], "t": float(z[4]), "delay": float(z[5]), "once": int(z[6]) == 1, "kind": z[7], "dur": float(z[8]), "special": int(z[9]) == 1, "owner": G["p"], "done": true, "tick_t": 9.0, "tick": 9.0, "base": 0.0})
	G["zones"] = Z
	var D: Array = []
	for d in S["d"]:
		var ow := net_slot_f(int(d[0]))
		D.append({"owner": ow if ow != null else G["p"], "p": Vector2(d[1], d[2]), "face": d[3], "t": float(d[4])})
	G["decoys"] = D
	for q in S["sl"]:
		G["slashes"].append({"p": Vector2(q[0], q[1]), "ang": float(q[2]), "arc": float(q[3]), "r": float(q[4]), "col": q[5], "t": 0.0})
	for q in S["pp"]:
		G["pops"].append({"p": Vector2(q[0], q[1]), "txt": q[2], "col": q[3], "sub": q[4], "size": int(q[5]), "t": 0.0})


func net_end(m: Dictionary) -> void:
	if G["over"]:
		return
	var w := net_slot_f(int(m["w"]))
	var st: Dictionary = m.get("st", {})
	for k in st:
		var f := net_slot_f(int(k))
		if f != null:
			f.stats = st[k]
	G["over"] = true
	G["winner"] = w if w != null else G["p"]
	G["ko_t"] = 0.0
	G["shake"] = 8.0


func net_host_end() -> void:
	var st := {}
	for f: Fighter in G["all"]:
		st[str(f.slot)] = f.stats
	net_send({"t": "end", "w": (G["winner"] as Fighter).slot, "st": st})


func _net_button(id: String) -> bool:
	match id:
		"online":
			state = "online"
			if not save.has("nick"):
				var _cb4 := func(v: String) -> void:
					var n := clean_nick(v)
					save["nick"] = n if n.length() >= 3 else "Jogador%d" % randi_range(100, 999)
					_persist()
					net_connect()
				ask_text("Seu nome de jogador (3 a 16 letras):", "", _cb4)
			elif net["status"] != "on":
				net_connect()
			else:
				net_send({"t": "list"})
			return true
		"netconn":
			net_connect()
			return true
		"netsrv":
			var _cb5 := func(v: String) -> void:
				if v != "":
					opt["server"] = v
					save["opt"] = opt
					_persist()
					if ws != null:
						ws.close()
					ws = null
					net["status"] = "off"
					net_connect()
			ask_text("Endereço do servidor (wss://...):", server_url(), _cb5)
			return true
		"netnick":
			if save.has("nick") and not net.get("can_rename", false):
				return true
			ask_nick()
			return true
		"accback":
			ACC.erase("pending")
			ACC["busy"] = false
			state = str(ACC.get("back", "online"))
			ACC.erase("back")
			return true
		"account":
			ACC["back"] = "online"
			state = "account"
			ACC["msg"] = ""
			ACC["err"] = ""
			if net["status"] != "on":
				net_connect()
			return true
		"accreg":
			acc_register()
			return true
		"acclog":
			acc_login()
			return true
		"accpass":
			acc_pass()
			return true
		"accout":
			open_modal("SAIR DA CONTA?", ["Este aparelho volta a ser um jogador novo, sem elo.", "Seu elo continua salvo na conta: é só entrar de novo."], [["mod:ok", "SAIR", "#ff6a6a"], ["mod:x", "CANCELAR", "#2e3358"]], acc_do_logout)
			return true
		"quickmatch":
			net["rank_q"] = false
			net_send({"t": "quickmatch"})
			return true
		"unqueue":
			net_send({"t": "unqueue"})
			state = "rank_lobby" if net.get("rank_q", false) else "online"
			return true
		"lobby":
			state = "lobby"
			net_send({"t": "list"})
			return true
		"netlist":
			net_send({"t": "list"})
			return true
		"createroom", "createlock":
			var locked := id == "createlock"
			var after_pass := func(nm: String, pw: String) -> void:
				if pw != "" or not locked:
					net_send({"t": "create", "name": nm, "mode": create_mode, "pass": pw})
			var after_name := func(nm: String) -> void:
				if nm == "":
					return
				if locked:
					var cbp := func(pw: String) -> void:
						after_pass.call(nm, pw)
					ask_text("Senha da sala:", "", cbp, true)
				else:
					after_pass.call(nm, "")
			ask_text("Nome da sala:", "Sala de %s" % save.get("nick", "Jogador"), after_name)
			return true
		"netready":
			var me_ready := false
			for q in net["room"].get("slots", []):
				if q != null and int(q["pid"]) == int(net["id"]):
					me_ready = q["ready"]
			net_send({"t": "ready", "v": not me_ready})
			return true
		"netstart":
			net_send({"t": "start"})
			return true
		"netleave":
			net_send({"t": "leave"})
			net["room"] = {}
			state = "lobby"
			return true
		"toroom":
			net["on"] = false
			net["role"] = ""
			state = "room" if not (net["room"] as Dictionary).is_empty() else "online"
			return true
	if id.begins_with("cmode:"):
		create_mode = id.substr(6)
		return true
	if id.begins_with("join:"):
		var rid := id.substr(5)
		var locked := false
		for r in net["rooms"]:
			if r["id"] == rid:
				locked = r["locked"]
		if locked:
			var cbj := func(pw: String) -> void:
				if pw != "":
					net_send({"t": "join", "id": rid, "pass": pw})
			ask_text("Senha da sala:", "", cbj, true)
		else:
			net_send({"t": "join", "id": rid, "pass": ""})
		return true
	if id.begins_with("slot:"):
		net_send({"t": "slot", "slot": int(id.substr(5))})
		return true
	if id.begins_with("qc:"):
		net_send({"t": "quick", "i": int(id.substr(3))})
		return true
	return false


func online_header(t: String) -> void:
	screen_bg()
	text(t, Vector2(W / 2, 22), 13, "#4fd1ff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var st: String = net["status"]
	text("%s · %s" % [save.get("nick", "Jogador"), ("online · %dms" % int(net["ping"])) if st == "on" else ("conectando…" if st == "connecting" else "desconectado")], Vector2(W - 8, 14), 8, "#46d160" if st == "on" else "#ff9a9a", HORIZONTAL_ALIGNMENT_RIGHT, "#0b0c14")
	if net["err"] != "" and time - float(net["err_t"]) < 4.0:
		text(net["err"], Vector2(W / 2, 240), 9, "#ff9a9a", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")


func draw_online() -> void:
	online_header("ONLINE")
	if net["status"] != "on":
		text("Conectando ao servidor…" if net["status"] == "connecting" else "Você está desconectado.", Vector2(W / 2, 90), 10, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
		if net["status"] != "connecting":
			btn("netconn", Rect2(W / 2 - 60, 124, 120, 22), "CONECTAR", "#4fd1ff", "#0b0c14", 9)
		text("Servidor: " + server_url(), Vector2(W / 2, 164), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		btn("netsrv", Rect2(W / 2 - 60, 172, 120, 14), "TROCAR SERVIDOR", "#2e3358", "#ffffff", 7)
	else:
		panel(Rect2(40, 50, 400, 170))
		btn("quickmatch", Rect2(52, 64, 120, 40), "PARTIDA RÁPIDA", "#ffd23f", "#0b0c14", 8)
		text("1x1 casual", Vector2(112, 116), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		btn("ranked", Rect2(180, 64, 120, 40), "RANQUEADA", "#ff8a3d", "#0b0c14", 9)
		text(Ranked.label(save["rank"]), Vector2(240, 116), 8, Ranked.color(save["rank"]), HORIZONTAL_ALIGNMENT_CENTER)
		text("1x1 valendo elo", Vector2(240, 127), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		btn("lobby", Rect2(308, 64, 120, 40), "SALAS", "#4fd1ff", "#0b0c14", 10)
		text("Até 10 pessoas, com senha", Vector2(368, 116), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
		var fx2: bool = save.has("nick") and not net.get("can_rename", false)
		btn("icons" if fx2 else "netnick", Rect2(52, 150, 116, 18), "MEU ÍCONE" if fx2 else "ESCOLHER NOME", "#2e3358", "#ffffff", 8)
		var u := str(save.get("user", ""))
		btn("account", Rect2(182, 150, 116, 18), ("CONTA: " + u.substr(0, 8)) if u != "" else "CRIAR CONTA", "#7a5af0", "#ffffff", 8)
		btn("netsrv", Rect2(312, 150, 116, 18), "SERVIDOR", "#2e3358", "#ffffff", 8)
		text("Itens valem online com o mesmo teto dos modos normais. Chat só com mensagens prontas.", Vector2(W / 2, 196), 8, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	btn("menu", Rect2(8, 248, 70, 16), "VOLTAR", "#2e3358", "#ffffff", 8)


func draw_queue() -> void:
	online_header("RANQUEADA" if net.get("rank_q", false) else "PARTIDA RÁPIDA")
	if net.get("rank_q", false):
		text(Ranked.label(save["rank"]) + " · procurando rival do seu nível", Vector2(W / 2, 80), 9, Ranked.color(save["rank"]), HORIZONTAL_ALIGNMENT_CENTER)
	text("Procurando outro jogador" + ".".repeat(1 + int(time * 2) % 3), Vector2(W / 2, 110), 11, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	spr("saci", Vector2(W / 2, 170), 2, 1.0 if sin(time * 3) > 0 else -1.0)
	btn("unqueue", Rect2(W / 2 - 50, 200, 100, 18), "CANCELAR", "#2e3358", "#ffffff", 8)


func draw_lobby() -> void:
	online_header("SALAS")
	var R: Array = net["rooms"]
	panel(Rect2(10, 32, 330, 204))
	if R.is_empty():
		text("Nenhuma sala aberta. Crie a primeira!", Vector2(175, 130), 9, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	for i in mini(8, R.size()):
		var r: Dictionary = R[i]
		var y := 36.0 + i * 25
		draw_rect(Rect2(14, y, 322, 22), Color.html("#1d2140"))
		text(("[senha] " if r["locked"] else "") + str(r["name"]), Vector2(20, y + 10), 9, "#ffffff")
		text("%s · %d/%d" % [MODES[r["mode"]][1] if MODES.has(r["mode"]) else r["mode"], int(r["players"]), int(r["max"])], Vector2(20, y + 19), 7, "#8a8fb8")
		if r["status"] == "lobby" and int(r["players"]) < int(r["max"]):
			btn("join:" + str(r["id"]), Rect2(276, y + 3, 56, 16), "ENTRAR", "#46d160", "#0b0c14", 7)
		else:
			text("CHEIA" if r["status"] == "lobby" else "JOGANDO", Vector2(304, y + 14), 7, "#ff8a3d", HORIZONTAL_ALIGNMENT_CENTER)
	panel(Rect2(348, 32, 122, 204))
	text("CRIAR SALA", Vector2(409, 44), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	var ms := [["1x1", "1x1"], ["2x2", "2x2"], ["3x3", "3x3"], ["5x5", "5x5"], ["ffa", "TODOS"]]
	for i in ms.size():
		var on: bool = create_mode == ms[i][0]
		btn("cmode:" + ms[i][0], Rect2(354 + (i % 2) * 56, 52 + (i / 2) * 20, 54, 17), ms[i][1], "#ffd23f" if on else "#2e3358", "#0b0c14" if on else "#ffffff", 7)
	btn("createroom", Rect2(354, 116, 110, 20), "CRIAR", "#46d160", "#0b0c14", 8)
	btn("createlock", Rect2(354, 140, 110, 16), "CRIAR COM SENHA", "#2e3358", "#ffffff", 6)
	var mx := {"1x1": 2, "2x2": 4, "3x3": 6, "5x5": 10, "ffa": 8}
	text("Até %d pessoas" % int(mx.get(create_mode, 2)), Vector2(409, 168), 7, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	text("Vagas sem gente viram bots", Vector2(409, 180), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	btn("netlist", Rect2(354, 192, 110, 16), "ATUALIZAR", "#2e3358", "#ffffff", 7)
	btn("joincode", Rect2(354, 212, 110, 18), "ENTRAR COM CÓDIGO", "#4fd1ff", "#0b0c14", 6)
	btn("online", Rect2(8, 248, 70, 16), "VOLTAR", "#2e3358", "#ffffff", 8)


func draw_room() -> void:
	var r: Dictionary = net["room"]
	if r.is_empty():
		state = "online"
		return
	online_header(str(r["name"]))
	text("%s%s" % [MODES[r["mode"]][1] if MODES.has(r["mode"]) else r["mode"], " · com senha" if r["locked"] else ""], Vector2(W / 2, 34), 9, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var host: bool = int(r["host"]) == int(net["id"])
	var ffa: bool = r["mode"] == "ffa"
	var slots: Array = r["slots"]
	var cols: Array = [range(0, slots.size(), 2), range(1, slots.size(), 2)]
	var rows: int = Array(cols[0]).size()
	var rh := 20.0 if rows > 3 else (26.0 if rows > 2 else 30.0)
	var bh := rh - 3.0
	if ffa:
		var cnt := 0
		for q in slots:
			if q != null:
				cnt += 1
		text("TODOS CONTRA TODOS · %d/%d pessoas" % [cnt, slots.size()], Vector2(W / 2, 48), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	for ci in cols.size():
		var x := 20.0 + ci * 230
		var w := 210.0
		if not ffa:
			text("EQUIPE B" if ci else "EQUIPE A", Vector2(x + w / 2, 48), 8, "#ff9a9a" if ci else "#7fc8ff", HORIZONTAL_ALIGNMENT_CENTER)
		var lst: Array = Array(cols[ci])
		for k in lst.size():
			var sl: int = lst[k]
			var y := 54.0 + k * rh
			var ty := y + bh / 2 + 4
			var q = slots[sl]
			var mine: bool = q != null and int(q["pid"]) == int(net["id"])
			draw_rect(Rect2(x, y, w, bh), Color.html("#2a3a60" if mine else "#1d2140"))
			if q != null:
				var is_host: bool = int(q["pid"]) == int(r["host"])
				var ttl := str(q.get("title", ""))
				var ico := str(q.get("icon", ""))
				var nx := x + (26.0 if ico != "" else 8.0)
				if ico != "" and sprites.has(ico):
					spr(ico, Vector2(x + 14, y + bh - 1), 1.0 if bh >= 24 else 0.7)
				if not mine:
					btn("rep:%d" % int(q["pid"]), Rect2(x + w - 96, y + (bh - 12) / 2, 12, 12), "!", "#5a2a36", "#ff9a9a", 7)
				text(("[dono] " if is_host else "") + str(q["name"]), Vector2(nx, ty - (3 if ttl != "" and bh >= 20 else 0)), 9 if rows > 3 else 10, "#ffffff")
				if ttl != "" and bh >= 20:
					text(ttl, Vector2(nx, ty + 6), 7, "#ffd23f")
				text("DONO" if is_host else ("PRONTO" if q["ready"] else "esperando"), Vector2(x + w - 8, ty), 8, "#ffd23f" if is_host else ("#46d160" if q["ready"] else "#8a8fb8"), HORIZONTAL_ALIGNMENT_RIGHT)
			else:
				text("vaga livre (bot)", Vector2(x + 8, ty), 9, "#6a6f98")
				btn("slot:%d" % sl, Rect2(x + w - 58, y + (bh - 15) / 2, 52, 15), "IR AQUI", "#2e3358", "#ffffff", 6)
	var cy := maxf(150.0, 58.0 + rows * rh)
	var ch: Array = net["chat"]
	for i in mini(3, ch.size()):
		text(ch[ch.size() - mini(3, ch.size()) + i], Vector2(20, cy + i * 11), 8, "#ffe2d0")
	var qk: Array = net["quick"]
	for i in qk.size():
		btn("qc:%d" % i, Rect2(20 + i * 64, cy + 36, 60, 14), qk[i], "#2e3358", "#ffffff", 6)
	if host:
		var ok := true
		for q in slots:
			if q != null and int(q["pid"]) != int(net["id"]) and not q["ready"]:
				ok = false
		btn("netstart", Rect2(W / 2 - 70, 226, 140, 20), "INICIAR PARTIDA" if ok else "ESPERANDO PRONTOS", "#ffd23f" if ok else "#3a3f66", "#0b0c14" if ok else "#8a8fb8", 8)
	else:
		var rd := false
		for q in slots:
			if q != null and int(q["pid"]) == int(net["id"]):
				rd = q["ready"]
		btn("netready", Rect2(W / 2 - 70, 226, 140, 20), "CANCELAR PRONTO" if rd else "PRONTO!", "#2e3358" if rd else "#46d160", "#ffffff" if rd else "#0b0c14", 9)
	if str(r.get("code", "")) != "":
		text("CÓDIGO: " + str(r["code"]), Vector2(W - 90, 240), 9, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		btn("invite", Rect2(W - 140, 247, 100, 18), "CONVIDAR AMIGO", "#46d160", "#0b0c14", 6)
	btn("netleave", Rect2(8, 248, 70, 16), "SAIR", "#2e3358", "#ffffff", 8)


# =====================================================================
# v1.5: LENDA DA SEMANA, MISSÕES, FIM DE SEMANA, BORDAS, CONVITE, CONQUISTAS, TUTORIAL
const DAY_MS := 86400000
const WEEK_MS := 7 * 86400000
const BRT_MS := 3 * 3600000
const WEEK_BONUS := 0.3
var t_off := 0   # diferença para o relógio do servidor (ms)


func now_ms() -> int:
	return int(Time.get_unix_time_from_system() * 1000.0) + t_off


func week_idx(t := -1) -> int:
	if t < 0:
		t = now_ms()
	return int(floor(float(t - BRT_MS - 4 * DAY_MS) / WEEK_MS))


func week_legend(w := -999999) -> Dictionary:
	if w == -999999:
		w = week_idx()
	var n := chars.size()
	return chars[posmod(w * 41 + 7, n)]


func week_left() -> String:
	var t := now_ms()
	var end := (week_idx(t) + 1) * WEEK_MS + BRT_MS + 4 * DAY_MS
	var d := end - t
	var dd := d / DAY_MS
	var hh := (d % DAY_MS) / 3600000
	return ("%dd %dh" % [dd, hh]) if dd > 0 else ("%dh %dmin" % [hh, (d % 3600000) / 60000])


func day_idx(t := -1) -> int:
	if t < 0:
		t = now_ms()
	return int(floor(float(t - BRT_MS) / DAY_MS))


func week_day(t := -1) -> int:   # 0 = segunda … 5 = sábado, 6 = domingo
	return posmod(day_idx(t) + 3, 7)


const MEL := ["Fogo", "Água", "Gelo", "Luz", "Trevas", "Natureza", "Terra", "Elétrico", "Humano"]
const MPOOL := [
	{"k": "win", "n": [2, 3], "gd": 90}, {"k": "play", "n": [3, 5], "gd": 60}, {"k": "el", "n": [1, 1], "gd": 110},
	{"k": "spec", "n": [4, 6], "gd": 80}, {"k": "perf", "n": [2, 3], "gd": 90}, {"k": "dodge", "n": [8, 12], "gd": 70},
	{"k": "ko", "n": [4, 6], "gd": 90}, {"k": "online", "n": [1, 2], "gd": 100}, {"k": "ffa", "n": [1, 1], "gd": 120},
	{"k": "team", "n": [2, 2], "gd": 80},
]


func miss_text(m: Dictionary) -> String:
	var n := int(m["n"])
	match str(m["k"]):
		"win": return "Vença %d partidas" % n
		"play": return "Jogue %d partidas" % n
		"el": return "Vença com uma lenda de %s" % str(m["el"])
		"spec": return "Acerte %d especiais (C)" % n
		"perf": return "Faça %d bloqueios perfeitos" % n
		"dodge": return "Esquive %d vezes" % n
		"ko": return "Derrube %d lendas" % n
		"online": return "Jogue %d partida(s) online" % n
		"ffa": return "Vença um Todos contra Todos"
		"team": return "Jogue 2 partidas em equipe (2x2, 3x3 ou 5x5)"
	return "?"


func miss_today() -> Dictionary:
	var d := day_idx()
	if save.has("miss") and int(save["miss"].get("day", -1)) == d:
		return save["miss"]
	var rng := RandomNumberGenerator.new()
	rng.seed = d * 7919 + 13
	var pool: Array = MPOOL.duplicate()
	var list: Array = []
	while list.size() < 3:
		var m: Dictionary = pool.pop_at(rng.randi() % pool.size())
		var n := int(m["n"][0]) + rng.randi() % (int(m["n"][1]) - int(m["n"][0]) + 1)
		list.append({"k": m["k"], "n": n, "p": 0, "el": MEL[rng.randi() % MEL.size()] if m["k"] == "el" else "", "gd": int(m["gd"]) + (n - int(m["n"][0])) * 20, "po": 1 + rng.randi() % 2, "cl": false})
	save["miss"] = {"day": d, "list": list, "all": false}
	_persist()
	return save["miss"]


func week_state() -> Dictionary:
	var w := week_idx()
	if not save.has("wk") or int(save["wk"].get("w", -1)) != w:
		save["wk"] = {"w": w, "days": [], "spun": false}
	return save["wk"]


func wk_hero_active() -> Dictionary:
	var h: Dictionary = save.get("wk_hero", {})
	if h.is_empty() or int(h.get("w", -1)) != week_idx() or week_day() < 5:
		return {}
	for c in chars:
		if c["id"] == h["id"]:
			return c
	return {}


func can_spin() -> bool:
	var Wk := week_state()
	return week_day() >= 5 and (Wk["days"] as Array).size() >= 5 and not Wk["spun"]


func miss_track(ev: Dictionary) -> int:
	var M := miss_today()
	var done := 0
	for m: Dictionary in M["list"]:
		if int(m["p"]) >= int(m["n"]):
			continue
		var add := 0
		match str(m["k"]):
			"win": add = 1 if ev["win"] else 0
			"play": add = 1
			"el": add = 1 if ev["win"] and ev["el"] == m["el"] else 0
			"spec": add = int(ev["spec"])
			"perf": add = int(ev["perf"])
			"dodge": add = int(ev["dodge"])
			"ko": add = int(ev["ko"])
			"online": add = 1 if ev["online"] else 0
			"ffa": add = 1 if ev["win"] and ev["ffa"] else 0
			"team": add = 1 if ev["team"] else 0
		if add > 0:
			m["p"] = mini(int(m["n"]), int(m["p"]) + add)
			if int(m["p"]) >= int(m["n"]):
				done += 1
	var all_done := true
	for m: Dictionary in M["list"]:
		if int(m["p"]) < int(m["n"]):
			all_done = false
	if all_done and not M["all"]:
		M["all"] = true
		var Wk := week_state()
		if not (Wk["days"] as Array).has(int(M["day"])):
			Wk["days"].append(int(M["day"]))
	_persist()
	return done


func miss_claimable() -> int:
	var n := 0
	for m: Dictionary in miss_today()["list"]:
		if int(m["p"]) >= int(m["n"]) and not m["cl"]:
			n += 1
	return n + (1 if can_spin() else 0)


var MS := {"spin_t": -1.0, "spin_id": "", "msg": ""}


func draw_week_card(x: float, y: float) -> void:
	var L := week_legend()
	var r := Rect2(x, y, 106, 100)
	draw_rect(r, Color(0.08, 0.09, 0.15, 0.92))
	draw_rect(r.grow(-1), Color.html("#ffd23f"), false, 2.0)
	text("LENDA DA SEMANA", Vector2(x + 53, y + 11), 7, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	draw_circle(Vector2(x + 53, y + 46), 22, Color(1, 0.82, 0.25, 0.12 + 0.1 * (0.5 + 0.5 * sin(time * 3))))
	spr(L["id"], Vector2(x + 53, y + 66), 2)
	text(L["name"], Vector2(x + 53, y + 78), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("+%d%% GD · 3x no sorteio" % int(WEEK_BONUS * 100), Vector2(x + 53, y + 88), 7, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
	text("termina em " + week_left(), Vector2(x + 53, y + 97), 6, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	buttons.append({"id": "weekinfo", "r": r})


func draw_title_extras() -> void:
	draw_week_card(366, 42)
	var M := miss_today()
	var dn := 0
	for m: Dictionary in M["list"]:
		if int(m["p"]) >= int(m["n"]):
			dn += 1
	var n := miss_claimable()
	btn("missions", Rect2(12, 104, 112, 22), "MISSÕES %d/3" % dn, "#8ef0a0" if n > 0 else "#2e3358", "#0b0c14" if n > 0 else "#ffffff", 8)
	if n > 0:
		draw_circle(Vector2(122, 106), 6, Color(1, 0.42, 0.42, 0.6 + 0.4 * sin(time * 6)))
		text(str(n), Vector2(122, 109), 7, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	var HH := wk_hero_active()
	if not HH.is_empty():
		text("Lenda fixa: " + str(HH["name"]), Vector2(68, 136), 7, "#4fd1ff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")


func draw_missions() -> void:
	screen_bg()
	text("MISSÕES DIÁRIAS", Vector2(W / 2, 20), 14, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	var t := now_ms()
	var left := (day_idx(t) + 1) * DAY_MS + BRT_MS - t
	text("Novas missões em %dh %dmin" % [left / 3600000, (left % 3600000) / 60000], Vector2(W / 2, 33), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	var M := miss_today()
	for i in 3:
		var m: Dictionary = M["list"][i]
		var y := 42.0 + i * 42
		var done := int(m["p"]) >= int(m["n"])
		panel(Rect2(30, y, 420, 36))
		text(miss_text(m), Vector2(42, y + 14), 9, "#8ef0a0" if done else "#ffffff")
		bar(Rect2(42, y + 21, 220, 6), float(m["p"]) / float(m["n"]), "#8ef0a0" if done else "#ffd23f")
		text("%d/%d" % [int(m["p"]), int(m["n"])], Vector2(270, y + 28), 8, "#c9cbe6")
		text("+%d GD · +%d Pó" % [int(m["gd"]), int(m["po"])], Vector2(330, y + 14), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
		if m["cl"]:
			text("RESGATADO", Vector2(400, y + 28), 8, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
		elif done:
			btn("mclaim:%d" % i, Rect2(356, y + 18, 86, 14), "RESGATAR", "#8ef0a0", "#0b0c14", 7)
		else:
			text("em andamento", Vector2(400, y + 28), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	var Wk := week_state()
	var y0 := 172.0
	panel(Rect2(30, y0, 420, 70))
	text("FIM DE SEMANA", Vector2(42, y0 + 13), 8, "#4fd1ff")
	text("Complete as 3 missões em 5 dias da semana e gire a roleta no sábado ou domingo.", Vector2(42, y0 + 25), 7, "#c9cbe6")
	var D := ["S", "T", "Q", "Q", "S", "S", "D"]
	var d0 := day_idx() - week_day()
	for i in 7:
		var ok := (Wk["days"] as Array).has(d0 + i)
		var today := i == week_day()
		var rr := Rect2(44 + i * 22, y0 + 32, 18, 18)
		draw_rect(rr, Color.html("#8ef0a0" if ok else ("#2e3358" if today else "#141626")))
		draw_rect(rr, Color.html("#ffd23f" if today else "#0b0c14"), false, 1.5)
		text(D[i], Vector2(53 + i * 22, y0 + 45), 8, "#0b0c14" if ok else "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	text("%d/5 dias" % mini(5, (Wk["days"] as Array).size()), Vector2(214, y0 + 45), 8, "#8ef0a0" if (Wk["days"] as Array).size() >= 5 else "#ffffff")
	var HH := wk_hero_active()
	if MS["spin_t"] >= 0:
		var el: float = time - float(MS["spin_t"])
		var L: Dictionary = chars[int(el * (16 - el * 5)) % chars.size()] if el < 2.2 else _char_by_id(MS["spin_id"])
		spr(L["id"], Vector2(370, y0 + 56), 2)
		if el >= 2.2:
			text(L["name"], Vector2(370, y0 + 66), 8, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	elif not HH.is_empty():
		spr(HH["id"], Vector2(350, y0 + 54), 2)
		text(HH["name"], Vector2(350, y0 + 65), 8, "#4fd1ff", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
		var off: bool = save.get("use_fixed", true) == false
		btn("usefix", Rect2(392, y0 + 34, 52, 16), "USAR" if off else "SORTEAR", "#4fd1ff" if off else "#2e3358", "#0b0c14" if off else "#ffffff", 6)
	elif can_spin():
		btn("wkspin", Rect2(330, y0 + 34, 110, 22), "GIRAR ROLETA!", "#ffd23f", "#0b0c14", 8)
	else:
		text(("Roleta já usada" if Wk["spun"] else "Faltam dias de missão") if week_day() >= 5 else "Roleta no sábado", Vector2(380, y0 + 46), 7, "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
	if str(MS["msg"]) != "":
		text(str(MS["msg"]), Vector2(W / 2, 252), 8, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
	btn("menu", Rect2(8, 248, 70, 16), "VOLTAR", "#2e3358", "#ffffff", 8)


func _char_by_id(id: String) -> Dictionary:
	for c in chars:
		if c["id"] == id:
			return c
	return chars[0]


# ---------- BORDAS POR ELO ----------
const FRAME := [["#5d626e", "#8a8f9a", "#3a3d45"], ["#9a5a2a", "#d08a4a", "#5a3214"], ["#9aa6b8", "#e4ecf7", "#5e6878"], ["#d9a020", "#ffe27a", "#8a5a08"], ["#2fa89a", "#8ff0e0", "#14605a"], ["#1f9d55", "#7cf0a8", "#0c5a2e"], ["#4f9ad9", "#c8ecff", "#1f4f8a"], ["#8a4fd9", "#d9b0ff", "#4a1f8a"], ["#d93a3a", "#ffb0a0", "#7a1414"], ["#ffd23f", "#ffffff", "#2f6fd9"]]
const TIER_N := ["Ferro", "Bronze", "Prata", "Ouro", "Platina", "Esmeralda", "Diamante", "Mestre", "Grão-Mestre", "Desafiante"]
const ROMAN_N := ["IV", "III", "II", "I"]


func frame_key(r: Dictionary) -> Dictionary:
	if int(r.get("tier", -1)) < 0:
		return {}
	return {"t": Ranked.apex(r), "d": int(r["div"]) if int(r["tier"]) < 7 else 3}


func frame_name(t: int, d: int) -> String:
	return TIER_N[t] if t >= 7 else "%s %s" % [TIER_N[t], ROMAN_N[d]]


func rank_frame(x: float, y: float, sz: float, t: int, d: int) -> void:
	var P: Array = FRAME[t]
	var b := maxf(3.0, roundf(sz * 0.13))
	if t >= 7:
		var a := 0.35 + 0.25 * sin(time * 3)
		draw_rect(Rect2(x - b, y - b, sz + 2 * b, sz + 2 * b), Color.html(["#b07aff", "#ff5a3c", "#ffe27a"][t - 7]) * Color(1, 1, 1, a))
	draw_rect(Rect2(x - 1, y - 1, sz + 2, sz + 2), Color.html("#0b0c14"))
	var c0 := Color.html(P[0])
	var c1 := Color.html(P[1])
	var c2 := Color.html(P[2])
	draw_rect(Rect2(x, y, sz, b), c1)
	draw_rect(Rect2(x, y, b, sz), c1)
	draw_rect(Rect2(x, y + sz - b, sz, b), c2)
	draw_rect(Rect2(x + sz - b, y, b, sz), c0)
	if t >= 1:
		var rr := maxf(1.5, b * 0.38)
		for cp in [Vector2(x + b / 2, y + b / 2), Vector2(x + sz - b / 2, y + b / 2), Vector2(x + b / 2, y + sz - b / 2), Vector2(x + sz - b / 2, y + sz - b / 2)]:
			draw_circle(cp, rr * (1.3 if t >= 3 else 1.0), c1 if t >= 3 else c2)
			if t >= 3:
				draw_circle(cp, rr * 0.6, Color.WHITE if t >= 6 else c0)
	var ng := 3 if t >= 7 else d
	var gs := maxf(2.5, sz * 0.075)
	for i in ng:
		var gx := x + sz / 2 + (i - (ng - 1) / 2.0) * gs * 2.6
		var gy := y + b / 2
		draw_colored_polygon(PackedVector2Array([Vector2(gx, gy - gs - 1), Vector2(gx + gs + 1, gy), Vector2(gx, gy + gs + 1), Vector2(gx - gs - 1, gy)]), Color.html("#0b0c14"))
		draw_colored_polygon(PackedVector2Array([Vector2(gx, gy - gs), Vector2(gx + gs, gy), Vector2(gx, gy + gs), Vector2(gx - gs, gy)]), Color.WHITE if t >= 6 else Color.html(["#ff6a6a", "#8ef0a0", "#7fc8ff"][i]))
	if d == 3 and t >= 2:
		for sg in [-1.0, 1.0]:
			var ex: float = x if sg < 0 else x + sz
			draw_colored_polygon(PackedVector2Array([Vector2(ex, y + sz * 0.3), Vector2(ex + sg * b * 1.6, y + sz * 0.22), Vector2(ex + sg * b * 1.1, y + sz * 0.42), Vector2(ex + sg * b * 1.5, y + sz * 0.5), Vector2(ex, y + sz * 0.55)]), c1)
	if t == 8:
		for i in 5:
			var fx := x + sz * (0.15 + i * 0.175)
			var fh := b * (1.2 + 0.7 * sin(time * 8 + i * 1.7))
			draw_colored_polygon(PackedVector2Array([Vector2(fx - b * 0.5, y), Vector2(fx, y - fh), Vector2(fx + b * 0.5, y)]), Color.html("#ffb02e" if i % 2 else "#ff4a2a"))
	if t == 9:
		var cw := sz * 0.5
		var cx := x + sz / 2
		var cy := y - b * 0.2
		var ch := b * 2.2
		draw_colored_polygon(PackedVector2Array([Vector2(cx - cw / 2, cy), Vector2(cx - cw / 2, cy - ch), Vector2(cx - cw / 4, cy - ch * 0.5), Vector2(cx, cy - ch * 1.15), Vector2(cx + cw / 4, cy - ch * 0.5), Vector2(cx + cw / 2, cy - ch), Vector2(cx + cw / 2, cy)]), Color.html("#ffd23f"))
		draw_circle(Vector2(cx, cy - ch * 0.35), b * 0.35, Color.html("#2f6fd9"))


func my_frame() -> Dictionary:
	var R: Dictionary = save["rank"]
	var fr := str(save.get("frame", "elo"))
	if fr != "elo":
		for b2: Dictionary in R.get("borders", []):
			if "s%d" % int(b2["s"]) == fr:
				return {"t": int(b2["t"]), "d": int(b2["d"])}
	return frame_key(R)


func portrait(x: float, y: float, sz: float, f: Dictionary) -> void:
	var best := my_icon()
	if f.is_empty():
		draw_rect(Rect2(x - 1, y - 1, sz + 2, sz + 2), Color.html("#0b0c14"))
		draw_rect(Rect2(x, y, sz, sz), Color.html("#4a4f7a"))
	else:
		rank_frame(x, y, sz, int(f["t"]), int(f["d"]))
	var b := 3.0 if f.is_empty() else maxf(3.0, roundf(sz * 0.13))
	draw_rect(Rect2(x + b, y + b, sz - 2 * b, sz - 2 * b), Color.html("#23264a"))
	spr(best, Vector2(x + sz / 2, y + sz - b - 1), 1)


func season_left() -> String:
	var end := int(net.get("season_end", 1803870000000))   # 1º/mar/2027 00h BRT
	var d := maxi(0, end - now_ms())
	return ("%d dias" % ceili(d / float(DAY_MS))) if d > DAY_MS else ("%dh" % ceili(d / 3600000.0))


func draw_borders() -> void:
	screen_bg()
	text("BORDAS DE ELO", Vector2(W / 2, 20), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("A cor vem do elo · as gemas vêm da divisão (IV → I) · Mestre e acima são animadas", Vector2(W / 2, 33), 7, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	for t in 10:
		var x := 34.0 + (t % 5) * 86
		var y := 40.0 + (t / 5) * 84
		rank_frame(x + 14, y + 6, 40, t, 3)
		emblem(Vector2(x + 34, y + 26), 8, {"tier": mini(t, 7), "div": 3, "lp": 200 if t == 8 else (500 if t == 9 else 0), "placed": 5})
		text(TIER_N[t], Vector2(x + 34, y + 58), 8, FRAME[t][1], HORIZONTAL_ALIGNMENT_CENTER)
		if t < 7:
			for d in 4:
				rank_frame(x + 2 + d * 17, y + 62, 12, t, d)
	panel(Rect2(30, 206, 420, 36))
	text("SUAS BORDAS", Vector2(42, 218), 8, "#ffd23f")
	var R: Dictionary = save["rank"]
	var cur := frame_key(R)
	var opts: Array = [["elo", ("Elo atual: " + frame_name(int(cur["t"]), int(cur["d"]))) if not cur.is_empty() else "Elo atual (sem elo)"]]
	for b2: Dictionary in R.get("borders", []):
		opts.append(["s%d" % int(b2["s"]), "T%d: %s" % [int(b2["s"]), frame_name(int(b2["t"]), int(b2["d"]))]])
	var x2 := 42.0
	for o in opts:
		var on: bool = str(save.get("frame", "elo")) == o[0]
		var w := minf(140.0, font.get_string_size(o[1], HORIZONTAL_ALIGNMENT_LEFT, -1, 6).x + 14)
		if x2 + w > 446:
			break
		btn("frm:" + o[0], Rect2(x2, 224, w, 14), o[1], "#ffd23f" if on else "#2e3358", "#0b0c14" if on else "#ffffff", 6)
		x2 += w + 6
	text("Temporada %d termina em %s. Você ganha a borda do maior elo que alcançar." % [int(R.get("season", 1)), season_left()], Vector2(W / 2, 252), 7, "#8ef0a0", HORIZONTAL_ALIGNMENT_CENTER)
	btn("profile", Rect2(8, 256, 60, 12), "VOLTAR", "#2e3358", "#ffffff", 6)


# ---------- CONQUISTAS E TÍTULOS ----------
func stx() -> Dictionary:
	if not save.has("st"):
		save["st"] = {"kos": 0, "spec": 0, "perf": 0, "dodge": 0, "ffa": 0, "tour": 0, "online": 0, "miss": 0, "wins_by": {}, "wins_vs": {}, "el_wins": {}}
	return save["st"]


func best_by() -> Array:
	var b := ""
	var n := 0
	for k in stx()["wins_by"]:
		if int(stx()["wins_by"][k]) > n:
			n = int(stx()["wins_by"][k])
			b = k
	return [b, n]


func peak_score() -> int:
	return maxi(int(save["rank"].get("peak", -1)), Ranked.score(save["rank"]))


const ACH := [
	["w1", "Primeira vitória", "Vença 1 partida", "Novato da Arena", 1], ["w10", "Duelista", "Vença 10 partidas", "Duelista", 10],
	["w50", "Veterano", "Vença 50 partidas", "Veterano", 50], ["w200", "Lenda viva", "Vença 200 partidas", "Lenda Viva", 200],
	["g100", "Incansável", "Jogue 100 partidas", "Incansável", 100], ["c25", "Colecionador", "Descubra 25 lendas", "Colecionador", 25],
	["c60", "Curador", "Descubra 60 lendas", "Curador", 60], ["c108", "Enciclopédia", "Descubra as 108 lendas", "Enciclopédia das Lendas", 108],
	["ko100", "Derrubador", "Derrube 100 lendas", "Derrubador", 100], ["pf50", "Muralha", "Faça 50 bloqueios perfeitos", "Muralha", 50],
	["dg200", "Intocável", "Esquive 200 vezes", "Intocável", 200], ["sp100", "Especialista", "Acerte 100 especiais", "Mestre dos Especiais", 100],
	["ffa10", "Último de pé", "Vença 10 Todos contra Todos", "Último de Pé", 10], ["tour1", "Campeão", "Vença um torneio", "Campeão", 1],
	["tour5", "Dinastia", "Vença 5 torneios", "Dinastia", 5], ["on20", "Conectado", "Jogue 20 partidas online", "Conectado", 20],
	["saci", "Caçador de Sacis", "Vença 10 partidas contra o Saci", "Caçador de Sacis", 10], ["zeus", "Desafiou o Olimpo", "Vença 10 partidas contra Zeus", "Desafiante do Olimpo", 10],
	["one100", "Alma gêmea", "Vença 100 partidas com a mesma lenda", "", 100], ["els", "Senhor dos elementos", "Vença com lendas de todos os 13 elementos", "Senhor dos Elementos", 13],
	["gold", "Dourado", "Chegue ao Ouro na ranqueada", "Dourado", 1], ["dia", "Diamante bruto", "Chegue ao Diamante na ranqueada", "Diamante Bruto", 1],
	["des", "Topo do mundo", "Chegue a Desafiante", "Desafiante", 1], ["m30", "Dedicado", "Resgate 30 missões diárias", "Dedicado", 30],
]


func ach_val(k: String) -> int:
	var S := stx()
	match k:
		"w1", "w10", "w50", "w200": return int(save["wins"])
		"g100": return int(save["games"])
		"c25", "c60", "c108": return save["seen"].size()
		"ko100": return int(S["kos"])
		"pf50": return int(S["perf"])
		"dg200": return int(S["dodge"])
		"sp100": return int(S["spec"])
		"ffa10": return int(S["ffa"])
		"tour1", "tour5": return int(S["tour"])
		"on20": return int(S["online"])
		"saci": return int(S["wins_vs"].get("saci", 0))
		"zeus": return int(S["wins_vs"].get("zeus", 0))
		"one100": return int(best_by()[1])
		"els": return S["el_wins"].size()
		"gold": return 1 if peak_score() >= 1200 else 0
		"dia": return 1 if peak_score() >= 2400 else 0
		"des": return 1 if peak_score() >= 3300 else 0
		"m30": return int(S["miss"])
	return 0


func ach_title(a: Array) -> String:
	if a[0] == "one100":
		return "Mestre de " + str(_char_by_id(str(best_by()[0]))["name"])
	return a[3]


func ach_check() -> Array:
	if not save.has("ach"):
		save["ach"] = {}
	var got: Array = []
	for a in ACH:
		if not save["ach"].has(a[0]) and ach_val(a[0]) >= int(a[4]):
			save["ach"][a[0]] = now_ms()
			got.append(a)
	if not got.is_empty():
		_persist()
		ach_toast = ", ".join(PackedStringArray(got.map(func(x): return x[1])))
		ach_toast_t = time
	return got


var ach_page := 0
var ach_toast := ""
var ach_toast_t := -9.0


func draw_ach_toast() -> void:
	if ach_toast == "":
		return
	var e := time - ach_toast_t
	if e > 4:
		ach_toast = ""
		return
	var y := (-24 + e / 0.3 * 30) if e < 0.3 else (6 - (e - 3.6) / 0.4 * 30 if e > 3.6 else 6.0)
	draw_rect(Rect2(W / 2 - 150, y - 2, 300, 24), Color.html("#0b0c14"))
	draw_rect(Rect2(W / 2 - 148, y, 296, 20), Color.html("#ffd23f"))
	text("CONQUISTA: " + ach_toast, Vector2(W / 2, y + 13), 8, "#0b0c14", HORIZONTAL_ALIGNMENT_CENTER)


func draw_ach() -> void:
	screen_bg()
	var done := 0
	for a in ACH:
		if save.get("ach", {}).has(a[0]):
			done += 1
	text("CONQUISTAS", Vector2(W / 2, 20), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("%d/%d · toque em USAR para exibir o título no perfil e no online" % [done, ACH.size()], Vector2(W / 2, 33), 7, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	for i in range(ach_page * 8, mini(ACH.size(), ach_page * 8 + 8)):
		var a: Array = ACH[i]
		var j := i - ach_page * 8
		var x := 14.0 + (j % 2) * 230
		var y := 40.0 + (j / 2) * 50
		var ok: bool = save.get("ach", {}).has(a[0])
		var v := mini(ach_val(a[0]), int(a[4]))
		panel(Rect2(x, y, 222, 46))
		draw_rect(Rect2(x + 6, y + 8, 22, 22), Color.html("#ffd23f" if ok else "#2e3358"))
		text("*" if ok else "?", Vector2(x + 17, y + 24), 12, "#0b0c14" if ok else "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
		text(a[1], Vector2(x + 34, y + 13), 9, "#ffd23f" if ok else "#ffffff")
		text(a[2], Vector2(x + 34, y + 24), 7, "#c9cbe6")
		if not ok:
			bar(Rect2(x + 34, y + 30, 120, 5), float(v) / float(a[4]), "#4fd1ff")
			text("%d/%d" % [v, int(a[4])], Vector2(x + 158, y + 36), 7, "#8a8fb8")
		else:
			var tt := ach_title(a)
			var on: bool = str(save.get("title", "")) == tt
			text("Título: " + tt, Vector2(x + 34, y + 40), 7, "#8ef0a0")
			btn("ttl:" + a[0], Rect2(x + 170, y + 28, 46, 13), "EM USO" if on else "USAR", "#8ef0a0" if on else "#2e3358", "#0b0c14" if on else "#ffffff", 6)
	var pages := ceili(ACH.size() / 8.0)
	text("%d/%d" % [ach_page + 1, pages], Vector2(W / 2, 252), 8, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	btn("achp", Rect2(W / 2 - 60, 244, 26, 14), "<", "#2e3358", "#ffffff", 8)
	btn("achn", Rect2(W / 2 + 34, 244, 26, 14), ">", "#2e3358", "#ffffff", 8)
	if str(save.get("title", "")) != "":
		btn("ttl:none", Rect2(W - 90, 244, 82, 14), "TIRAR TÍTULO", "#2e3358", "#ffffff", 6)
	btn("profile", Rect2(8, 248, 60, 16), "VOLTAR", "#2e3358", "#ffffff", 7)


# ---------- TUTORIAL ----------
const TUT := [
	["Ande pela arena", "Use o joystick à esquerda", "Use as teclas W, A, S, D"],
	["Ataque básico (A)", "Toque no botão A três vezes", "Clique com o mouse três vezes"],
	["Habilidade (B)", "Toque no botão B", "Aperte a tecla E"],
	["Esquiva (DASH)", "Toque em DASH para escapar de golpes", "Aperte Espaço para escapar de golpes"],
	["Bloqueio", "Segure BLOQ por um instante", "Segure Shift ou o botão direito do mouse"],
	["Especial (C)", "A barra encheu! Toque em C", "A barra encheu! Aperte Q"],
	["Agora derrote o rival!", "Use tudo o que aprendeu", "Use tudo o que aprendeu"],
]


func start_tutorial() -> void:
	var me := _char_by_id("saci")
	var foe: Dictionary = chars[1]
	for c in chars:
		if c["name"] == "Golem":
			foe = c
	var ar: Dictionary = ARENAS[0]
	for a in ARENAS:
		if a["id"] == "coliseu":
			ar = a
	pick = {"me": me, "allies": [], "foes": [foe], "foe": foe, "arena": ar, "mode": "1x1", "ranked": false, "tut": true}
	last_mode = "1x1"
	start_match()
	var pl: Fighter = G["p"]
	G["tut"] = {"step": 0, "a": 0, "b": 0, "c": 0, "dash": 0, "blk": 0.0, "start": pl.pos, "ok_t": 0.0}
	G["tips"]["on"] = false
	(G["b"] as Fighter).dummy = true
	G["time"] = 999.0
	G["shrink_t"] = 99999.0
	cd_t = 1.0


func tut_ev(f: Fighter, k: String) -> void:
	if G.has("tut") and f == G["p"]:
		G["tut"][k] = int(G["tut"][k]) + 1


func tut_ok(T2: Dictionary) -> bool:
	var pl: Fighter = G["p"]
	match int(T2["step"]):
		0: return pl.pos.distance_to(T2["start"]) > 70
		1: return int(T2["a"]) >= 3
		2: return int(T2["b"]) >= 1
		3: return int(T2["dash"]) >= 1
		4: return float(T2["blk"]) > 0.6
		5: return int(T2["c"]) >= 1
	return false


func update_tut(dt: float) -> void:
	var T2: Dictionary = G["tut"]
	if int(T2["step"]) >= TUT.size():
		return
	var pl: Fighter = G["p"]
	if pl.blocking:
		T2["blk"] = float(T2["blk"]) + dt
	if float(T2["ok_t"]) > 0:
		T2["ok_t"] = float(T2["ok_t"]) - dt
		if float(T2["ok_t"]) <= 0:
			T2["step"] = int(T2["step"]) + 1
			T2["start"] = pl.pos
			tut_enter(int(T2["step"]))
		return
	if tut_ok(T2):
		T2["ok_t"] = 0.7
		popup(pl.pos + Vector2(0, -40), "BOA!", "#8ef0a0", "", 8)


func tut_enter(step: int) -> void:
	if step == 5:
		(G["p"] as Fighter).charge = 100.0
	if step == 6:
		var b2: Fighter = G["b"]
		b2.dummy = false
		b2.hp = minf(b2.hp, 350.0)
		G["time"] = 60.0


func draw_tut() -> void:
	if not G.has("tut") or G["over"]:
		return
	var T2: Dictionary = G["tut"]
	var st := mini(int(T2["step"]), TUT.size() - 1)
	var S: Array = TUT[st]
	draw_rect(Rect2(W / 2 - 120, 40, 240, 34), Color(0.04, 0.05, 0.08, 0.85))
	draw_rect(Rect2(W / 2 - 120, 40, 240, 34), Color.html("#ffd23f"), false, 1.5)
	text("TUTORIAL %d/%d · %s" % [st + 1, TUT.size(), S[0]], Vector2(W / 2, 52), 8, "#8ef0a0" if float(T2["ok_t"]) > 0 else "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER)
	text(S[1] if is_touch else S[2], Vector2(W / 2, 66), 8, "#ffffff", HORIZONTAL_ALIGNMENT_CENTER)
	for i in TUT.size():
		draw_rect(Rect2(W / 2 - 46 + i * 14, 77, 10, 3), Color.html("#8ef0a0" if i < st else ("#ffd23f" if i == st else "#3a3f66")))
	btn("tutskip", Rect2(W / 2 + 124, 44, 40, 14), "PULAR", "#2e3358", "#ffffff", 6)


# ---------- CONVITE ----------
const GAME_URL := "https://alissoneves.github.io/Duel-Legends-Arena/"   # página própria do jogo


func invite_friend() -> void:
	var r: Dictionary = net.get("room", {})
	if r.is_empty() or str(r.get("code", "")) == "":
		return
	var md: String = MODES[r["mode"]][1] if MODES.has(r["mode"]) else str(r["mode"])
	var txt := "Bora duelar no Duel Legends Arena!\nEntre na minha sala (%s):\n%s?sala=%s\n\nOu abra o jogo e vá em ONLINE > SALAS > ENTRAR COM CÓDIGO: %s" % [md, GAME_URL, r["code"], r["code"]]
	DisplayServer.clipboard_set(txt)
	OS.shell_open("https://wa.me/?text=" + txt.uri_encode())
	net["err"] = "Convite copiado! Se o WhatsApp não abrir, cole a mensagem."
	net["err_t"] = time


# ---------- BOTÕES ----------
func _feat_button(id: String) -> bool:
	if id.begins_with("mclaim:"):
		var m: Dictionary = miss_today()["list"][int(id.substr(7))]
		if int(m["p"]) >= int(m["n"]) and not m["cl"]:
			m["cl"] = true
			save["gd"] = int(save["gd"]) + int(m["gd"])
			save["po"] = int(save["po"]) + int(m["po"])
			stx()["miss"] = int(stx()["miss"]) + 1
			MS["msg"] = "+%d GD e +%d Pó Mágico!" % [int(m["gd"]), int(m["po"])]
			ach_check()
			_persist()
		return true
	if id.begins_with("frm:"):
		save["frame"] = id.substr(4)
		_persist()
		return true
	if id.begins_with("ttl:"):
		var k := id.substr(4)
		if k == "none":
			save["title"] = ""
		else:
			for a in ACH:
				if a[0] == k and save.get("ach", {}).has(k):
					save["title"] = ach_title(a)
		_persist()
		if net["status"] == "on":
			net_send(hello_msg(save.get("nick", "Jogador")))
		return true
	match id:
		"missions":
			state = "missions"
			MS["msg"] = ""
			MS["spin_t"] = -1.0
		"wkspin":
			if can_spin():
				var L: Dictionary = chars[randi() % chars.size()]
				save["wk_hero"] = {"w": week_idx(), "id": L["id"]}
				week_state()["spun"] = true
				save["use_fixed"] = true
				MS["spin_t"] = time
				MS["spin_id"] = L["id"]
				MS["msg"] = "%s é sua lenda fixa até domingo 23h59!" % L["name"]
				_persist()
		"usefix":
			save["use_fixed"] = save.get("use_fixed", true) == false
			_persist()
		"weekinfo":
			var L2 := week_legend()
			open_modal("LENDA DA SEMANA: " + str(L2["name"]).to_upper(), ["Sai 3x mais no sorteio contra bots e na partida rápida.", "Vencendo com %s: +%d%% de Duel Gold." % [L2["name"], int(WEEK_BONUS * 100)], "Troca toda segunda-feira. Termina em " + week_left() + "."], [["mod:x", "OK", "#ffd23f"]])
		"borders":
			state = "borders"
		"ach":
			state = "ach"
			ach_page = 0
			ach_check()
		"achp":
			ach_page = maxi(0, ach_page - 1)
		"achn":
			ach_page = mini(ceili(ACH.size() / 8.0) - 1, ach_page + 1)
		"tutskip":
			if G.has("tut"):
				G["tut"]["step"] = TUT.size() - 1
				tut_enter(TUT.size() - 1)
		"tutstart":
			start_tutorial()
		"invite":
			invite_friend()
		"joincode":
			ask_text("Código da sala que seu amigo mandou:", "", _join_code)
		_:
			return false
	return true


func _join_code(v: String) -> void:
	if v != "":
		net_send({"t": "joincode", "code": v})


# =====================================================================
# v1.6: FILTRO DE NOMES, DENÚNCIA, NOME FIXO, ÍCONES DE PERFIL, DADOS DE BALANCEAMENTO
const BAD_ROOTS := ["porra", "caralh", "karalh", "buceta", "bucet", "xoxota", "xereca", "xota", "puta", "puto", "putinha", "viado", "viadinh", "bixa", "bicha",
	"vagabund", "arrombad", "cuzao", "cusao", "cuzinh", "fdp", "filhodaput", "foder", "fodase", "fodas", "fodid", "merd", "bosta", "bostinh", "porrinh", "caralinh", "cuzinho", "piroca", "pirok", "rola",
	"punheta", "siririca", "boquete", "chupaminha", "pauno", "paunocu", "corno", "otario", "babaca", "retardad", "mongoloid", "estupr", "pedofil", "nazi", "hitler",
	"crioulo", "fuck", "fuk", "shit", "bitch", "cunt", "dick", "pussy", "whore", "slut", "nigg", "nigga", "faggot", "retard",
	"sexo", "porn", "xvideo", "peitud", "gostos"]
const OK_WORDS := ["computa", "disputa", "reputa", "imputa", "deputad", "amputa", "putamen", "rolamento", "rolando", "rolagem", "controla", "escola", "carola", "crola",
	"marola", "corola", "pirola", "patrola", "petrola", "pintor", "pintura", "pintado", "pintassilgo", "shitake", "dickens", "bichano", "sexton",
	"consexo", "sussex", "essex", "scunthorpe", "pintinho", "rolao", "rolinha", "otaku", "diaspora", "espora", "merdeka"]
const ACCENTS := {"á": "a", "à": "a", "â": "a", "ã": "a", "ä": "a", "é": "e", "è": "e", "ê": "e", "ë": "e", "í": "i", "ì": "i", "î": "i", "ï": "i",
	"ó": "o", "ò": "o", "ô": "o", "õ": "o", "ö": "o", "ú": "u", "ù": "u", "û": "u", "ü": "u", "ç": "c", "ñ": "n"}
var _rx_letters: RegEx
var _rx_repeat: RegEx


func norm_name(s: String) -> String:
	if _rx_letters == null:
		_rx_letters = RegEx.new()
		_rx_letters.compile("[^a-z]")
		_rx_repeat = RegEx.new()
		_rx_repeat.compile("(.)\\1+")
	var n := s.to_lower()
	for k in ACCENTS:
		n = n.replace(k, ACCENTS[k])
	for pair in [["4", "a"], ["@", "a"], ["3", "e"], ["1", "i"], ["!", "i"], ["|", "i"], ["0", "o"], ["5", "s"], ["$", "s"], ["7", "t"]]:
		n = n.replace(pair[0], pair[1])
	n = _rx_letters.sub(n, "", true)
	return _rx_repeat.sub(n, "$1", true)


func bad_name(s: String) -> bool:
	var n := norm_name(s)
	for w in OK_WORDS:
		n = n.replace(norm_name(w), "#")
	for r in BAD_ROOTS:
		if n.contains(norm_name(r)):
			return true
	return false


# ---------- ícones de perfil ----------
const ICON_FREE := ["Saci", "Iara", "Curupira", "Boitatá", "Zeus", "Thor", "Anúbis", "Yeti"]
const ICON_PASS_F := {7: "Mula sem Cabeça", 15: "Caipora", 23: "Lobisomem"}
const ICON_PASS_P := {5: "Medusa", 13: "Poseidon", 21: "Hades", 29: "Fênix"}
const ICON_BOX := ["Dragão Escarlate", "Kraken", "Raijin", "Sun Wukong", "Rá", "Drácula", "Rei Arthur", "Valquíria", "Cuca", "Mapinguari", "Minotauro", "Golem"]


func id_of(name: String) -> String:
	for c in chars:
		if c["name"] == name:
			return c["id"]
	return ""


func icon_owned(id: String) -> bool:
	for c in chars:
		if c["id"] == id:
			return ICON_FREE.has(c["name"]) or (save.get("icons", []) as Array).has(id)
	return false


func icon_src(name: String) -> String:
	if ICON_FREE.has(name):
		return "Grátis"
	for lv in ICON_PASS_F:
		if ICON_PASS_F[lv] == name:
			return "Passe nível %d" % lv
	for lv in ICON_PASS_P:
		if ICON_PASS_P[lv] == name:
			return "Passe Premium %d" % lv
	if ICON_BOX.has(name):
		return "Caixa da Sorte"
	return "Loja (em breve)"


func give_icon(id: String) -> bool:
	if not save.has("icons"):
		save["icons"] = []
	if id != "" and not (save["icons"] as Array).has(id):
		save["icons"].append(id)
		_persist()
		return true
	return false


func my_icon() -> String:
	var ic := str(save.get("icon", ""))
	return ic if ic != "" and icon_owned(ic) else id_of("Saci")


func draw_icons() -> void:
	screen_bg()
	text("ÍCONE DE PERFIL", Vector2(W / 2, 20), 14, "#ffd23f", HORIZONTAL_ALIGNMENT_CENTER, "#0b0c14")
	text("Grátis, no Passe ou na Caixa da Sorte ao subir de elo. Mais ícones em breve na loja.", Vector2(W / 2, 33), 7, "#c9cbe6", HORIZONTAL_ALIGNMENT_CENTER)
	var list: Array = ICON_FREE + ICON_PASS_F.values() + ICON_PASS_P.values() + ICON_BOX
	var cur := my_icon()
	for i in list.size():
		var n: String = list[i]
		var id := id_of(n)
		if id == "":
			continue
		var x := 22.0 + (i % 9) * 50
		var y := 44.0 + (i / 9) * 62
		var own := icon_owned(id)
		var on := id == cur
		draw_rect(Rect2(x - 2, y - 2, 44, 44), Color.html("#ffd23f" if on else "#0b0c14"))
		draw_rect(Rect2(x, y, 40, 40), Color.html("#23264a" if own else "#141626"))
		spr(id, Vector2(x + 20, y + 38), 1.6, 1.0, false, 1.0 if own else 0.25)
		if not own:
			text("?", Vector2(x + 20, y + 26), 14, "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
		text(n if n.length() <= 9 else n.left(8) + "…", Vector2(x + 20, y + 50), 7, "#ffffff" if own else "#6a6f98", HORIZONTAL_ALIGNMENT_CENTER)
		text(("EM USO" if on else "") if own else icon_src(n), Vector2(x + 20, y + 58), 6, "#ffd23f" if on else "#8a8fb8", HORIZONTAL_ALIGNMENT_CENTER)
		if own:
			buttons.append({"id": "ico:" + id, "r": Rect2(x, y, 40, 40)})
	btn("profile", Rect2(8, 248, 60, 16), "VOLTAR", "#2e3358", "#ffffff", 7)


# ---------- dados de balanceamento ----------
func stat_push(win: bool) -> void:
	var pl: Fighter = G["p"]
	var mk := "bots_1x1"
	if G.get("tour", false):
		mk = "bots_1x1"
	elif pick.get("ranked", false):
		mk = "ranked"
	elif G.get("ffa", false):
		mk = "ffa"
	elif G.get("multi", false):
		mk = "equipe"
	elif pick.get("online", false):
		mk = "online_1x1"
	var q: Array = save.get("stat_q", [])
	q.append({"c": pl.d["name"], "m": mk, "w": win})
	while q.size() > 60:
		q.pop_front()
	save["stat_q"] = q
	stat_flush()


func stat_flush() -> void:
	var q: Array = save.get("stat_q", [])
	if q.is_empty() or net["status"] != "on" or not net.get("ready", false):
		return
	net_send({"t": "stat", "list": q})
	save["stat_q"] = []
	_persist()


# ---------- denúncia ----------
var rep_target := -1


func open_report(pid: int, who: String) -> void:
	rep_target = pid
	open_modal("DENUNCIAR " + who, ["Qual é o problema?", "Denúncias falsas podem bloquear a sua conta."], [["mod:rep:nome", "NOME", "#ff9a9a"], ["mod:rep:trapaca", "TRAPAÇA", "#ff9a9a"], ["mod:rep:comport", "ATITUDE", "#ff9a9a"], ["mod:x", "CANCELAR", "#c9cbe6"]])


func opp_humans() -> Array:
	var out: Array = []
	var S: Dictionary = net.get("start", {})
	for q in S.get("slots", []):
		if q != null and not q.get("bot", false) and int(q["pid"]) != int(net["id"]):
			out.append(q)
	return out


func _v16_button(id: String) -> bool:
	if id.begins_with("ico:"):
		var ic := id.substr(4)
		if icon_owned(ic):
			save["icon"] = ic
			_persist()
			if net["status"] == "on":
				net_send(hello_msg(save.get("nick", "Jogador")))
		return true
	if id.begins_with("rep:"):
		var pid := int(id.substr(4))
		var nm := "JOGADOR"
		for q in net.get("room", {}).get("slots", []):
			if q != null and int(q["pid"]) == pid:
				nm = str(q["name"])
		open_report(pid, nm)
		return true
	match id:
		"icons":
			state = "icons"
		"repopp":
			var o := opp_humans()
			if o.size() == 1:
				open_report(int(o[0]["pid"]), str(o[0]["name"]))
		_:
			return false
	return true
