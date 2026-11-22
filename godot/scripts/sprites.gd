extends RefCounted
## Gera os sprites em pixel art a partir de mapas de texto (6 lendas feitas à mão)
## ou de parâmetros (as outras lendas). Cada sprite tem 16 x 20 pixels.
## Retorna [textura normal, textura branca (para o piscar de dano)].

const PAL := {
	"K": "#15131f", "R": "#e0393e", "r": "#a3222e", "S": "#7a4a32", "W": "#ffffff", "E": "#15131f",
	"P": "#9b6a35", "H": "#26254a", "h": "#45447a", "T": "#e8b07e", "G": "#2fae8f", "g": "#1c7563",
	"F": "#7fe0c8", "C": "#f48fb1",
}

const HAND := {
	"saci": {"pal": {}, "m": [
		"......KKKK......", ".....KRRRRK.....", "....KRRRRRRK....", "...KRRRRRRRRK...",
		"..KRRRRRRRRRRKK.", "..KSSSSSSSSSSK..", "..KSWESSSWESSK..", "..KSSSSSSSSSSKPP",
		"..KSSSKKKSSSSKP.", "...KSSSSSSSSK...", "....KKSSSSKK....", "...KSSSSSSSK....",
		"..KSKSSSSSSKSK..", "..KSKSSSSSSKSK..", "...KKrrrrrrKK...", "....KrrrrrrK....",
		"......KSSK......", "......KSSK......", ".....KKSSKK.....", ".....KKKKKK....."]},
	"iara": {"pal": {}, "m": [
		"....KKKKKK......", "...KHHHHHHK.....", "..KHHhHHHHHK....", "..KHTTTTTTHK....",
		".KHTEWTTEWTHK...", ".KHTTTTTTTTHK...", ".KHTTTKKTTTHK...", ".KHHTTTTTTHHK...",
		"KHHHKTTTTKHHHK..", "KHHKCTTTTCKHHK..", "KHHKTTTTTTKHHK..", ".KHKTTTTTTKHK...",
		"..KKGGGGGGKK....", "...KGgGGgGK.....", "...KGGGGGGK.....", "....KGgGGK......",
		"....KGGGGK......", "...KFKGGKFK.....", "..KFFFKKFFFK....", "..KKKK..KKKK...."]},
	"mula": {"pal": {"B": "#7a4a2a", "b": "#4e2c18", "F": "#ff6a13", "f": "#ffd23f", "S": "#a3222e", "H": "#2a2a2a"}, "m": [
		"...........ff...", "..........fFFf..", ".........fFfFf..", ".........fFFFf..",
		"..........FFF...", ".........KBBK...", ".........KBBK...", "..KKKKKKKKBBK...",
		".KBBBBBBBBBBK...", "KBBSSSSSBBBBK...", "KBBSSSSSBBBBK...", "KBBBBBBBBBBBK...",
		".KbBBBBBBBBbK...", ".KbK.KbK.KbK....", ".KbK.KbK.KbK....", ".KbK.KbK.KbK....",
		".KHK.KHK.KHK....", ".KKK.KKK.KKK...."]},
	"yeti": {"pal": {"W": "#f2f4f8", "w": "#c4cfde", "F": "#8aa0c0"}, "m": [
		"....KKKKKKKK....", "...KWWWWWWWWK...", "..KWWWWWWWWWWK..", "..KWFFFFFFFFWK..",
		"..KWFEFFFFEFWK..", "..KWFFFFFFFFWK..", "..KWFFKKKKFFWK..", ".KWWWFFFFFFWWWK.",
		"KWWWWWWWWWWWWWWK", "KWWKWWWWWWWWKWWK", "KWWKWWWWWWWWKWWK", "KwwKWWWWWWWWKwwK",
		".KK.KWWWWWWK.KK.", "....KWWWWWWK....", "....KwWWWWwK....", "....KWWKKWWK....",
		"....KWWKKWWK....", "...KWWWKKWWWK...", "...KKKKK.KKKKK.."]},
	"zeus": {"pal": {"W": "#f4f4f4", "G": "#ffd23f", "O": "#e6e8f2", "o": "#b4b8cc", "Y": "#ffe14d"}, "m": [
		".....KKKKKK.....", "....KGWGGWGK....", "...KWWWWWWWWK...", "...KWTTTTTTWK...",
		"...KWTETTETWK...", "...KWTTTTTTWK...", "...KWWWWWWWWK...", "...KWWWKKWWWK...",
		"....KWWWWWWK..Y.", "...KOOOOOOOOKYY.", "..KOKOOOOOOKOKY.", "..KTKOOOoOOKTKY.",
		"..KTKOOOoOOKTY..", "...KKOOOoOOKK...", "....KOOOoOOK....", "....KOOOOOOK....",
		"....KTTKKTTK....", "....KTTK.KTTK...", "....KKKK.KKKK..."]},
	"dracula": {"pal": {"H": "#1e1a2a", "P": "#e6e0f0", "E": "#e0393e", "W": "#ffffff", "C": "#2a1830", "R": "#b3203a", "S": "#2b2b3a"}, "m": [
		".....KKKKKK.....", "....KHHHHHHK....", "...KHHHHHHHHK...", "...KHPPHHPPHK...",
		"...KPPPPPPPPK...", "...KPEPPPPEPK...", "...KPPPPPPPPK...", "....KPWPPWPK....",
		".....KPPPPK.....", ".KKKKKKWWKKKKKK.", "KCRRRCKWWKCRRRCK", "KCRRRCKSSKCRRRCK",
		"KCRRRCKSSKCRRRCK", "KCRRCKSSSSKCRRCK", "KCRCK.KSSK.KCRCK", "KCCK..KSSK..KCCK",
		"KCK...KSSK...KCK", "KK....KKKK....KK"]},
}


static func shade(hex: String, a: float) -> String:
	var c := Color.html(hex)
	if a < 0.0:
		c = Color(c.r * (1.0 + a), c.g * (1.0 + a), c.b * (1.0 + a))
	else:
		c = Color(c.r + (1.0 - c.r) * a, c.g + (1.0 - c.g) * a, c.b + (1.0 - c.b) * a)
	return "#" + c.to_html(false)


static func _textures(rows: Array, pal: Dictionary) -> Array:
	var h := rows.size()
	var w := 0
	for r in rows:
		w = maxi(w, (r as String).length())
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var wimg := Image.create(w, h, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	wimg.fill(Color(0, 0, 0, 0))
	for y in h:
		var row: String = rows[y]
		for x in row.length():
			var ch := row[x]
			if ch == ".":
				continue
			img.set_pixel(x, y, Color.html(pal.get(ch, "#ff00ff")))
			wimg.set_pixel(x, y, Color.WHITE)
	return [ImageTexture.create_from_image(img), ImageTexture.create_from_image(wimg)]


static func build_hand(key: String) -> Array:
	var d: Dictionary = HAND[key]
	var pal := PAL.duplicate()
	pal.merge(d["pal"], true)
	return _textures(d["m"], pal)


# ---------- gerador por parâmetros ----------
static func _set(g: Array, x: int, y: int, c: String) -> void:
	if x >= 0 and x < 16 and y >= 0 and y < 20:
		g[y][x] = c


static func _rect(g: Array, x1: int, y1: int, x2: int, y2: int, c: String) -> void:
	for y in range(y1, y2 + 1):
		for x in range(x1, x2 + 1):
			_set(g, x, y, c)


static func build_proc(p: Dictionary) -> Array:
	var g: Array = []
	for y in 20:
		var row: Array = []
		row.resize(16)
		row.fill(".")
		g.append(row)
	var s0: String = p.get("s", "#f0c39a")
	var h0: String = p.get("h", "#4a3220")
	var o0: String = p.get("o", "#3f5a8a")
	var creature: bool = p.get("t", "") == "creature"
	var pal := {
		"s": s0, "h": h0, "o": o0,
		"p": p.get("p", shade(o0, 0.4)) if creature else shade(o0, -0.35),
		"x": p.get("x", "#ffd23f"), "e": "#15131f", "w": "#ffffff", "m": "#c9cbe6", "b": "#7a4a2a",
		"c": p.get("cape", "#7a1028") if p.get("cape") != null else "#7a1028",
		"n": shade(s0, -0.3), "g": "#ffd23f", "K": "#15131f",
	}
	if creature:
		_creature(g, p.get("f", []))
	else:
		_human(g, p)
	# contorno automático
	var out: Array = []
	for y in 20:
		out.append((g[y] as Array).duplicate())
	for y in 20:
		for x in 16:
			if g[y][x] != ".":
				continue
			for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
				var nx: int = x + d.x
				var ny: int = y + d.y
				if nx >= 0 and nx < 16 and ny >= 0 and ny < 20 and g[ny][nx] != "." and g[ny][nx] != "K":
					out[y][x] = "K"
					break
	var rows: Array = []
	for y in 20:
		rows.append("".join(PackedStringArray(out[y])))
	return _textures(rows, pal)


static func _creature(g: Array, f: Array) -> void:
	var ser := f.has("serpent")
	if ser:
		_rect(g, 4, 5, 11, 10, "o"); _rect(g, 3, 11, 8, 13, "o"); _rect(g, 7, 14, 12, 16, "o"); _rect(g, 3, 17, 8, 18, "o"); _rect(g, 5, 9, 10, 10, "p")
	else:
		for y in 20:
			for x in 16:
				if pow((x - 7.5) / 6.4, 2) + pow((y - 12.2) / 6.4, 2) <= 1.0:
					_set(g, x, y, "o")
		for y in 20:
			for x in 16:
				if pow((x - 7.5) / 3.8, 2) + pow((y - 14.6) / 3.0, 2) <= 1.0:
					_set(g, x, y, "p")
		if not f.has("blob") and not f.has("tentacles") and not f.has("tracks"):
			_rect(g, 4, 18, 5, 18, "o"); _rect(g, 10, 18, 11, 18, "o")
	var ey := 7 if ser else 10
	if f.has("shell"):
		for y in range(5, 12):
			for x in 16:
				if g[y][x] == "o":
					_set(g, x, y, "x" if (x + y) % 4 == 0 else "h")
	if f.has("mask"):
		_rect(g, 3, ey - 1, 12, ey, "h")
	if f.has("robot"):
		_rect(g, 3, ey, 12, ey, "x"); _set(g, 7, 4, "x"); _set(g, 7, 5, "m")
	else:
		_set(g, 5, ey, "w"); _set(g, 6, ey, "e"); _set(g, 9, ey, "w"); _set(g, 10, ey, "e")
	if f.has("beak"):
		_set(g, 7, ey + 2, "x"); _set(g, 8, ey + 2, "x"); _set(g, 7, ey + 3, "x")
	elif f.has("teeth"):
		_rect(g, 5, ey + 3, 10, ey + 3, "K"); _set(g, 6, ey + 3, "w"); _set(g, 8, ey + 3, "w"); _set(g, 10, ey + 3, "w")
	else:
		_set(g, 7, ey + 3, "K"); _set(g, 8, ey + 3, "K")
	if f.has("ears"):
		_rect(g, 3, 5, 4, 7, "o"); _rect(g, 11, 5, 12, 7, "o"); _set(g, 4, 6, "p"); _set(g, 11, 6, "p")
	if f.has("tail"):
		_rect(g, 14, 13, 15, 14, "o"); _set(g, 15, 12, "o")
	if f.has("flame"):
		for pt in [[7, 3], [8, 2], [8, 3], [9, 3], [8, 4]]:
			_set(g, pt[0], pt[1], "x")
		for pt in [[7, 4], [9, 4], [6, 4]]:
			_set(g, pt[0], pt[1], "h")
	if f.has("tentacles"):
		for x in [2, 4, 6, 9, 11, 13]:
			_rect(g, x, 16, x, 18, "o")
			_set(g, x + (1 if x % 4 == 0 else -1), 19, "o")
	if f.has("fins"):
		for pt in [[7, 4], [8, 4], [8, 3], [0, 12], [15, 12]]:
			_set(g, pt[0], pt[1], "x")
	if f.has("tusks"):
		for pt in [[5, 14], [5, 15], [10, 14], [10, 15]]:
			_set(g, pt[0], pt[1], "w")
		_rect(g, 7, 13, 8, 17, "o")
	if f.has("leaves"):
		for pt in [[5, 4], [6, 3], [7, 4], [9, 3], [10, 4]]:
			_set(g, pt[0], pt[1], "x")
	if f.has("bigleaves"):
		_rect(g, 2, 1, 13, 5, "x"); _set(g, 4, 2, "h"); _set(g, 10, 3, "h")
	if f.has("wings"):
		_rect(g, 0, 8, 2, 13, "x"); _rect(g, 13, 8, 15, 13, "x")
	if f.has("horns"):
		for pt in [[4, 4], [4, 5], [11, 4], [11, 5]]:
			_set(g, pt[0], pt[1], "w")
	if f.has("spikes"):
		for pt in [[5, 5], [7, 4], [9, 4], [11, 5]]:
			_set(g, pt[0], pt[1], "x")
	if f.has("spark"):
		for pt in [[1, 7], [14, 8], [2, 16]]:
			_set(g, pt[0], pt[1], "x")
	if f.has("band"):
		_rect(g, 2, 8, 13, 8, "x")
	if f.has("gloves"):
		_rect(g, 0, 12, 2, 14, "x"); _rect(g, 13, 12, 15, 14, "x")
	if f.has("spots"):
		for pt in [[5, 8], [10, 15], [4, 14], [11, 9]]:
			_set(g, pt[0], pt[1], "h")
	if f.has("blob"):
		_set(g, 4, 9, "w"); _set(g, 5, 8, "w")
	if f.has("headdress"):
		_rect(g, 2, 6, 3, 15, "x"); _rect(g, 12, 6, 13, 15, "x"); _rect(g, 4, 5, 11, 6, "x")
	if f.has("tracks"):
		_rect(g, 2, 17, 13, 18, "h")
		for x in range(3, 13, 2):
			_set(g, x, 18, "K")


static func _human(g: Array, p: Dictionary) -> void:
	var b: String = p.get("b", "normal")
	var t1 := 3 if b == "big" else (5 if b == "slim" else 4)
	var t2 := 12 if b == "big" else (10 if b == "slim" else 11)
	var st: String = p.get("st", "short")
	if p.get("cape") != null:
		_rect(g, 3, 10, 12, 18, "c")
	if p.get("wings", 0):
		_rect(g, 0, 8, 2, 13, "w"); _rect(g, 13, 8, 15, 13, "w")
	if b == "big":
		_rect(g, 4, 16, 6, 18, "p"); _rect(g, 9, 16, 11, 18, "p")
	elif b == "slim":
		_rect(g, 6, 16, 6, 18, "p"); _rect(g, 9, 16, 9, 18, "p")
	else:
		_rect(g, 5, 16, 6, 18, "p"); _rect(g, 9, 16, 10, 18, "p")
	_rect(g, t1, 10, t2, 15, "o")
	if st != "robot":
		_rect(g, t1, 14, t2, 14, "x")
	var aw := 1 if b == "slim" else 2
	_rect(g, t1 - aw, 10, t1 - 1, 13, "o"); _rect(g, t1 - aw, 14, t1 - 1, 14, "s")
	_rect(g, t2 + 1, 10, t2 + aw, 13, "o"); _rect(g, t2 + 1, 14, t2 + aw, 14, "s")
	_rect(g, 3, 2, 12, 9, "s")
	for pt in [[3, 2], [12, 2], [3, 9], [12, 9]]:
		_set(g, pt[0], pt[1], ".")
	_set(g, 5, 5, "w"); _set(g, 6, 5, "e"); _set(g, 9, 5, "w"); _set(g, 10, 5, "e"); _set(g, 7, 8, "n"); _set(g, 8, 8, "n")
	match st:
		"long":
			_short(g); _rect(g, 2, 3, 3, 11, "h"); _rect(g, 12, 3, 13, 11, "h")
		"spiky", "flamehair", "skull":
			_short(g)
			for pt in [[4, 1], [6, 0], [6, 1], [8, 1], [9, 0], [9, 1], [11, 1]]:
				_set(g, pt[0], pt[1], "h")
		"crown":
			_short(g); _rect(g, 4, 1, 11, 1, "g")
			for x in [4, 7, 8, 11]:
				_set(g, x, 0, "g")
			_set(g, 7, 1, "x")
		"hat":
			_rect(g, 1, 2, 14, 2, "h"); _rect(g, 4, 0, 11, 0, "h"); _rect(g, 4, 1, 11, 1, "x")
		"tophat":
			_rect(g, 3, 2, 12, 2, "h"); _rect(g, 4, 0, 11, 1, "h"); _rect(g, 4, 1, 11, 1, "x")
		"hood", "scarf":
			_rect(g, 2, 1, 13, 4, "h"); _rect(g, 2, 4, 3, 11, "h"); _rect(g, 12, 4, 13, 11, "h")
		"cowl":
			_rect(g, 2, 1, 13, 4, "h"); _rect(g, 2, 4, 3, 9, "h"); _rect(g, 12, 4, 13, 9, "h")
			_set(g, 4, 0, "h"); _set(g, 11, 0, "h"); _rect(g, 4, 4, 11, 6, "h"); _rect(g, 5, 5, 6, 5, "w"); _rect(g, 9, 5, 10, 5, "w")
		"helmet":
			_rect(g, 3, 1, 12, 4, "m"); _rect(g, 2, 3, 2, 7, "m"); _rect(g, 13, 3, 13, 7, "m"); _rect(g, 7, 1, 8, 4, "x")
		"robot":
			_rect(g, 3, 2, 12, 9, "m"); _rect(g, 4, 5, 11, 6, "x"); _set(g, 7, 0, "x"); _set(g, 7, 1, "m")
			_rect(g, t1, 10, t2, 15, "o"); _rect(g, t1 + 1, 11, t2 - 1, 12, "m")
		"mask":
			_rect(g, 3, 2, 12, 9, "h"); _rect(g, 4, 5, 6, 6, "w"); _rect(g, 9, 5, 11, 6, "w")
		"band":
			_short(g); _rect(g, 3, 4, 12, 4, "x"); _set(g, 13, 5, "x"); _set(g, 14, 6, "x")
		"cap":
			_short(g); _rect(g, 9, 4, 14, 4, "h"); _rect(g, 4, 1, 10, 2, "h")
		"slick":
			_rect(g, 3, 2, 12, 3, "h")
			for pt in [[7, 4], [8, 4], [3, 4], [12, 4]]:
				_set(g, pt[0], pt[1], "h")
		"flat":
			_rect(g, 3, 1, 12, 3, "h")
		"horns":
			_short(g)
			for pt in [[2, 0], [2, 1], [3, 1], [13, 0], [13, 1], [12, 1]]:
				_set(g, pt[0], pt[1], "w")
		"wolf":
			_rect(g, 3, 2, 12, 3, "h")
			for pt in [[3, 0], [3, 1], [4, 1], [12, 0], [12, 1], [11, 1]]:
				_set(g, pt[0], pt[1], "h")
			_rect(g, 6, 7, 9, 9, "n"); _set(g, 7, 8, "K")
		"jackal":
			_rect(g, 3, 2, 12, 4, "h"); _rect(g, 4, 0, 4, 2, "h"); _rect(g, 11, 0, 11, 2, "h"); _rect(g, 6, 7, 9, 9, "n"); _rect(g, 4, 10, 11, 11, "x")
		"snakes":
			_short(g)
			for x in [2, 4, 11, 13]:
				_rect(g, x, 3, x, 8, "h"); _set(g, x, 9, "x")
			_set(g, 6, 1, "h"); _set(g, 9, 1, "h")
		"topknot":
			_rect(g, 3, 2, 12, 3, "h"); _rect(g, 7, 0, 8, 1, "h")
		"turban":
			_rect(g, 3, 1, 12, 3, "h"); _set(g, 7, 0, "h"); _rect(g, 7, 2, 8, 2, "x")
		"goggles":
			_short(g); _rect(g, 3, 4, 12, 4, "b"); _rect(g, 4, 4, 6, 5, "m"); _rect(g, 9, 4, 11, 5, "m")
		"halo":
			_short(g); _rect(g, 5, 0, 10, 0, "g")
		"falcon":
			_rect(g, 3, 2, 12, 9, "h"); _set(g, 5, 5, "w"); _set(g, 6, 5, "e"); _set(g, 9, 5, "w"); _set(g, 10, 5, "e")
			_rect(g, 12, 6, 13, 6, "x"); _set(g, 13, 7, "x"); _rect(g, 5, 0, 10, 1, "g"); _set(g, 7, 0, "x")
		"ogre":
			for pt in [[1, 4], [2, 4], [13, 4], [14, 4], [2, 5], [13, 5]]:
				_set(g, pt[0], pt[1], "s")
		"funnel":
			_rect(g, 5, 0, 10, 0, "m"); _rect(g, 6, 1, 9, 1, "m")
		"beret":
			_rect(g, 3, 2, 12, 3, "h"); _set(g, 12, 1, "h"); _set(g, 11, 1, "h")
		"bun":
			_short(g); _rect(g, 6, 0, 9, 1, "h")
		"bald":
			pass
		_:
			_short(g)
	if p.get("beard", 0):
		_rect(g, 4, 8, 11, 10, "h")
	if p.get("ears", 0):
		for pt in [[1, 4], [2, 4], [2, 5], [14, 4], [13, 4], [13, 5]]:
			_set(g, pt[0], pt[1], "s")
	match p.get("w", "none"):
		"sword":
			_rect(g, 14, 3, 14, 12, "m"); _set(g, 13, 12, "x"); _set(g, 15, 12, "x"); _set(g, 14, 13, "b")
		"staff":
			_rect(g, 14, 2, 14, 17, "b"); _set(g, 14, 1, "x")
		"bow":
			_set(g, 14, 5, "b"); _rect(g, 15, 6, 15, 12, "b"); _set(g, 14, 13, "b")
		"hammer":
			_rect(g, 14, 7, 14, 16, "b"); _rect(g, 13, 4, 15, 7, "m")


static func _short(g: Array) -> void:
	_rect(g, 3, 2, 12, 3, "h"); _set(g, 3, 4, "h"); _set(g, 12, 4, "h")
