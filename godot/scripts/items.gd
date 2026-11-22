extends RefCounted
## Itens, loja, forja e Caixa da Sorte.
## Duel Gold (GD) e Pó Mágico só se ganham jogando. Os dados ficam em data/items.json (34 tipos x 6 raridades = 204 itens).

const ITEM_CAP := 150        # teto de bônus nos modos normais
const ITEM_CAP_RANK := 50    # teto de bônus na ranqueada

const SLOTS := [["arma", "Arma"], ["mao", "Mão secundária"], ["corpo", "Corpo"], ["costas", "Costas"], ["pes", "Pés"], ["cabeca", "Cabeça"]]
# nome, cor, pontos de atributo, preço em GD (Supremo não é vendido na loja)
const RARI := [["Normal", "#c9cbe6", 3, 120], ["Incomum", "#46d160", 6, 400], ["Raro", "#4f8dff", 10, 1200],
	["Épico", "#b07aff", 15, 3500], ["Lendário", "#ffb02e", 21, 9000], ["Supremo", "#ff4d5e", 28, 20000]]
const SHOP_ODDS := [0.45, 0.30, 0.17, 0.07, 0.01, 0.0]
const BOX_ODDS := [0.50, 0.30, 0.145, 0.042, 0.010, 0.003]
const UPG_PO := [1, 1, 2, 2, 3, 3, 4, 5, 6, 8]
const UPG_CHANCE := [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.7, 0.5, 0.35]
const STN := {"atk": "ATQ", "def": "DEF", "vel": "VEL", "esp": "ESP", "esq": "ESQ"}

# ícones 8x8: '#' = cor da raridade, b = marrom, w = branco, d = escuro
const ICONS := {
	"varinha": ["......#.", ".....###", "......#.", ".....b..", "....b...", "...b....", "..b.....", ".b......"],
	"espada": [".......w", "......ww", ".....ww.", "....ww..", ".b.ww...", "..bw....", ".bdb....", "b..b...."],
	"maca": ["....#.#.", "...####.", "..######", "...####.", "..b#.#..", ".b......", "b.......", "........"],
	"machado": ["....##..", "...####.", "..b####.", ".b..##..", "b.......", "........", "........", "........"],
	"escudo": [".######.", "########", "###ww###", "###ww###", "########", ".######.", "..####..", "...##..."],
	"orbe": ["..####..", ".#ww###.", "##w#####", "########", "########", ".######.", "..####..", "...bb..."],
	"armadura": [".##..##.", "########", "###ww###", "########", ".######.", ".######.", ".##..##.", "........"],
	"manto": ["...##...", "..####..", ".######.", ".######.", "########", "########", "########", "#.#..#.#"],
	"capa": [".ww..ww.", ".######.", ".######.", "########", "########", "########", "#######.", ".#.#.#.."],
	"bota": ["..###...", "..###...", "..###...", "..###...", "..#####.", ".#######", ".#######", "........"],
	"sandalia": ["........", "..#..#..", "..####..", "...##...", "..####..", ".######.", ".bbbbbbb", "........"],
	"chapeu": ["....#...", "...##...", "...###..", "..####..", "..#ww#..", ".######.", "########", "........"],
	"bandana": ["........", "########", "#ww##ww#", "########", "......##", ".......#", "......#.", "........"],
	"bone": ["........", "..####..", ".######.", ".##ww##.", "########", "########", ".....###", "........"],
	"cajado": [".....##.", "....#ww#", ".....##.", ".....b..", "....b...", "...b....", "..b.....", ".b......"],
	"adaga": ["........", "......ww", ".....ww.", "....ww..", "..bww...", "...b....", "..b.....", "........"],
	"martelo": ["..####..", "..####..", "..####..", "...b....", "...b....", "...b....", "...b....", "...b...."],
	"lanca": [".......w", "......ww", ".....bw.", "....b...", "...b....", "..b.....", ".b......", "b......."],
	"arco": ["..#b....", ".#..b...", "#....b..", "#....w..", "#....b..", ".#..b...", "..#b....", "........"],
	"broquel": ["..####..", ".######.", "###ww###", "###ww###", ".######.", "..####..", "........", "........"],
	"tomo": [".######.", ".#wwww#.", ".#w##w#.", ".#wwww#.", ".######.", ".######.", ".bbbbbb.", "........"],
	"talisma": ["..b..b..", "...bb...", "...##...", "..####..", "..#ww#..", "..####..", "...##...", "........"],
	"cota": [".##..##.", "#w#ww#w#", "########", "#w#w#w##", ".######.", ".#w#w#w.", ".##..##.", "........"],
	"peitoral": ["........", ".##..##.", "########", "##w##w##", "########", ".######.", "..####..", "........"],
	"tunica": [".##..##.", "########", ".######.", ".######.", ".######.", "..####..", "..####..", "..#..#.."],
	"colete": [".#....#.", ".##..##.", ".##..##.", ".##ww##.", ".##..##.", ".##..##.", ".######.", "........"],
	"aljava": ["..w.w.w.", "..b.b.b.", ".######.", ".######.", ".######.", ".######.", "..####..", "........"],
	"estandarte": ["b.......", "b######.", "b##ww##.", "b######.", "b#####..", "b####...", "b.......", "b......."],
	"capote": ["..####..", ".######.", "########", "########", "###ww###", "########", "########", ".#.##.#."],
	"greva": [".####...", ".#ww#...", ".####...", ".####...", ".#####..", ".######.", ".######.", "........"],
	"sapato": ["........", "........", "..###...", "..####..", ".######.", "########", "bbbbbbbb", "........"],
	"elmo": ["..####..", ".######.", "########", "#ww##ww#", "########", "##....##", "##....##", "........"],
	"capuz": ["...##...", "..####..", ".######.", ".#dddd#.", "##dddd##", "########", "########", "........"],
	"tiara": ["........", "...w....", "#..#..#.", "##.#.##.", "########", "........", "........", "........"],
}

static var bases: Dictionary = {}


static func load_data() -> void:
	var raw = JSON.parse_string(FileAccess.get_file_as_string("res://data/items.json"))
	if raw is Dictionary:
		bases = raw


static func roll_odds(t: Array) -> int:
	var r := randf()
	for i in t.size():
		if r < float(t[i]):
			return i
		r -= float(t[i])
	return 0


static func base_ids() -> Array:
	return bases.keys()


static func slot_of(it: Dictionary) -> String:
	return bases[it["b"]]["slot"]


static func slot_name(slot: String) -> String:
	for s in SLOTS:
		if s[0] == slot:
			return s[1]
	return slot


static func item_name(it: Dictionary) -> String:
	var n: String = bases[it["b"]]["names"][int(it["r"])]
	return n + (" +%d" % int(it["up"]) if int(it.get("up", 0)) > 0 else "")


static func item_stats(it: Dictionary) -> Dictionary:
	var o := {}
	var m := 1.0 + 0.08 * int(it.get("up", 0))
	var st: Dictionary = bases[it["b"]]["st"]
	for k in st:
		o[k] = roundi(float(RARI[int(it["r"])][2]) * float(st[k]) * m)
	return o


static func stat_line(st: Dictionary) -> String:
	var parts: Array = []
	for k in st:
		parts.append("%s +%d" % [STN[k], int(st[k])])
	return "  ".join(PackedStringArray(parts))


static func power(it: Dictionary) -> int:
	var t := 0
	for v in item_stats(it).values():
		t += int(v)
	return t


static func price(it: Dictionary) -> int:
	return int(RARI[int(it["r"])][3])


# desmanchar: o item vira Pó Mágico (não existe mais venda por GD)
const DISM := [1, 2, 3, 6, 12, 25]


static func dism_po(it: Dictionary) -> int:
	return int(DISM[int(it["r"])]) + int(it.get("up", 0)) / 2


static func new_item(save: Dictionary, b: String, r: int) -> Dictionary:
	save["uid"] = int(save.get("uid", 0)) + 1
	return {"id": int(save["uid"]), "b": b, "r": r, "up": 0}


static func by_id(save: Dictionary, id) -> Dictionary:
	if id == null:
		return {}
	for it in save["inv"]:
		if int(it["id"]) == int(id):
			return it
	return {}


static func init_save(save: Dictionary) -> void:
	if not save.has("inv"):
		save["inv"] = []
		var a := new_item(save, "espada", 0)
		var b := new_item(save, "armadura", 0)
		var c := new_item(save, "bota", 0)
		save["inv"].append_array([a, b, c])
		save["equip"] = {"arma": a["id"], "corpo": b["id"], "pes": c["id"]}
	if not save.has("gd"):
		save["gd"] = 150
	if not save.has("po"):
		save["po"] = 2
	if not save.has("boxes"):
		save["boxes"] = 0
	if not save.has("shop") or not (save["shop"] as Dictionary).has("items"):
		shop_roll(save)


static func shop_roll(save: Dictionary) -> void:
	var ks := base_ids()
	var items: Array = []
	for i in 6:
		items.append({"b": ks[randi() % ks.size()], "r": roll_odds(SHOP_ODDS), "sold": false})
	save["shop"] = {"items": items, "n": 0}


static func gear_raw(save: Dictionary) -> Dictionary:
	var o := {"atk": 0, "def": 0, "vel": 0, "esp": 0, "esq": 0}
	for s in SLOTS:
		var it := by_id(save, save["equip"].get(s[0], null))
		if not it.is_empty():
			var st := item_stats(it)
			for k in st:
				o[k] += int(st[k])
	return o


static func total(o: Dictionary) -> int:
	var t := 0
	for v in o.values():
		t += int(v)
	return t


static func cap_gear(o: Dictionary, cap: int) -> Dictionary:
	var tot := total(o)
	if tot <= cap:
		return o
	var f := float(cap) / tot
	var r := {}
	for k in o:
		r[k] = roundi(o[k] * f)
	return r


static func my_gear(save: Dictionary, ranked: bool) -> Dictionary:
	return cap_gear(gear_raw(save), ITEM_CAP_RANK if ranked else ITEM_CAP)


static func bot_gear(d: Dictionary, pw: int) -> Dictionary:
	var ks := ["atk", "def", "vel", "esp", "esq"]
	var w: Array = []
	var sw := 0.0
	for k in ks:
		var v := float(d[k]) + randf_range(-10, 10)
		w.append(v)
		sw += v
	var o := {}
	for i in ks.size():
		o[ks[i]] = roundi(pw * w[i] / sw)
	return o


## Tenta melhorar o item. Retorna o texto do resultado (ou "" se faltar recurso).
static func upgrade(save: Dictionary, it: Dictionary) -> String:
	var up := int(it["up"])
	if up >= 10:
		return ""
	var po: int = UPG_PO[up]
	var gd := 40 * (up + 1)
	if int(save["po"]) < po or int(save["gd"]) < gd:
		return ""
	save["po"] = int(save["po"]) - po
	save["gd"] = int(save["gd"]) - gd
	if randf() < float(UPG_CHANCE[up]):
		it["up"] = up + 1
		return "SUCESSO! Agora é +%d" % (up + 1)
	var r := randf()
	var dn := 1 if r < 0.6 else (2 if r < 0.9 else 3)
	it["up"] = maxi(0, up - dn)
	return "Falhou… voltou para +%d" % int(it["up"])


## Abre uma Caixa da Sorte: escolhe o item, coloca na mochila e devolve a faixa da roleta.
static func open_box(save: Dictionary) -> Dictionary:
	if int(save.get("boxes", 0)) <= 0:
		return {}
	save["boxes"] = int(save["boxes"]) - 1
	var ks := base_ids()
	var win := new_item(save, ks[randi() % ks.size()], roll_odds(BOX_ODDS))
	save["inv"].append(win)
	var strip: Array = []
	for i in 46:
		if i == 38:
			strip.append(win)
		else:
			strip.append({"b": ks[randi() % ks.size()], "r": roll_odds([0.42, 0.28, 0.16, 0.08, 0.04, 0.02]), "up": 0})
	return {"strip": strip, "win": win, "t": 0.0, "dur": 5.2, "done": false, "last": -1, "target": 38.0 + randf_range(-0.32, 0.32)}
