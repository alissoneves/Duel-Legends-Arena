extends RefCounted
## Ranqueada no estilo LoL: elos Ferro a Desafiante, divisões IV a I, PDL de 0 a 100,
## MMR oculto, 5 partidas de colocação, proteção de rebaixamento e Caixa da Sorte ao subir de elo.

const TIERS := [["Ferro", "#8a7d77"], ["Bronze", "#b9773f"], ["Prata", "#b4c3d3"], ["Ouro", "#efbf4f"], ["Platina", "#4fc6b2"],
	["Esmeralda", "#2fcf74"], ["Diamante", "#7fb0ff"], ["Mestre", "#bc84ff"], ["Grão-Mestre", "#ff5a64"], ["Desafiante", "#ffdc72"]]
const ROMAN := ["IV", "III", "II", "I"]


static func init_save(save: Dictionary) -> void:
	var r = save.get("rank", null)
	if not (r is Dictionary) or not (r as Dictionary).has("tier"):
		save["rank"] = {"tier": -1, "div": 0, "lp": 0, "mmr": 1150, "placed": 0, "w": 0, "l": 0, "shield": 0, "streak": 0,
			"peak": -1, "peak_name": "", "season": 1, "split": 1, "opp": 1150}


static func apex(r: Dictionary) -> int:
	var t := int(r["tier"])
	if t < 7:
		return t
	var lp := int(r["lp"])
	return 9 if lp >= 500 else (8 if lp >= 200 else 7)


static func tier_name(r: Dictionary) -> String:
	if int(r["tier"]) < 0:
		return "Sem elo"
	var t := apex(r)
	return TIERS[t][0] if t >= 7 else "%s %s" % [TIERS[t][0], ROMAN[int(r["div"])]]


static func color(r: Dictionary) -> String:
	return "#9aa3c7" if int(r["tier"]) < 0 else TIERS[apex(r)][1]


static func score(r: Dictionary) -> int:
	var t := int(r["tier"])
	return 2800 + int(r["lp"]) if t >= 7 else t * 400 + int(r["div"]) * 100 + int(r["lp"])


static func from_score(sc: int) -> Dictionary:
	sc = maxi(0, sc)
	if sc >= 2800:
		return {"tier": 7, "div": 0, "lp": 0}
	return {"tier": sc / 400, "div": (sc % 400) / 100, "lp": 0}


static func label(r: Dictionary) -> String:
	if int(r["tier"]) < 0:
		return "Colocação %d/5" % int(r["placed"]) if int(r["placed"]) > 0 else "Sem elo"
	return "%s · %d PDL" % [tier_name(r), int(r["lp"])]


static func bot_diff(r: Dictionary) -> float:
	return clampf(0.75 + (float(r.get("opp", 1150)) - 800.0) / 2200.0, 0.75, 1.4)


## Aplica o resultado de uma partida ranqueada e devolve o que mostrar na tela.
static func result(save: Dictionary, win: bool) -> Dictionary:
	var r: Dictionary = save["rank"]
	var opp := float(r.get("opp", r["mmr"]))
	var expv := 1.0 / (1.0 + pow(10.0, (opp - float(r["mmr"])) / 400.0))
	var k := 60.0 if int(r["placed"]) < 5 else 28.0
	r["mmr"] = roundi(float(r["mmr"]) + k * ((1.0 if win else 0.0) - expv))
	if win:
		r["w"] = int(r["w"]) + 1
		r["streak"] = maxi(1, int(r["streak"]) + 1)
	else:
		r["l"] = int(r["l"]) + 1
		r["streak"] = mini(-1, int(r["streak"]) - 1)
	var out := {"win": win, "d": 0}
	if int(r["placed"]) < 5:
		r["placed"] = int(r["placed"]) + 1
		out["placement"] = int(r["placed"])
		if int(r["placed"]) == 5:
			var f := from_score(int(r["mmr"]) - 400 - 60)
			r["tier"] = f["tier"]
			r["div"] = f["div"]
			r["lp"] = 0 if int(f["tier"]) >= 7 else randi_range(10, 40)
			r["shield"] = 3
			out["placed_now"] = tier_name(r)
			out["box"] = true
	else:
		var gap := (float(r["mmr"]) - 400.0 - score(r)) / 20.0
		var shield_was := int(r["shield"])
		r["shield"] = maxi(0, shield_was - 1)
		if win:
			out["d"] = roundi(clampf(21.0 + gap + (3.0 if int(r["streak"]) >= 3 else 0.0), 14.0, 34.0))
			r["lp"] = int(r["lp"]) + int(out["d"])
			if int(r["tier"]) < 7:
				while int(r["lp"]) >= 100:
					r["lp"] = int(r["lp"]) - 100
					if int(r["div"]) < 3:
						r["div"] = int(r["div"]) + 1
						out["promo"] = tier_name(r)
					else:
						r["tier"] = int(r["tier"]) + 1
						r["div"] = 0
						r["shield"] = 3
						out["promo"] = tier_name(r)
						out["tier_up"] = true
						if not r.has("box_t"):
							r["box_t"] = []
						if not (r["box_t"] as Array).has(int(r["tier"])):
							r["box_t"].append(int(r["tier"]))
							out["box"] = true
						if int(r["tier"]) >= 7:
							r["lp"] = 0
							break
		else:
			out["d"] = -roundi(clampf(18.0 - gap, 10.0, 28.0))
			if int(r["tier"]) >= 7:
				r["lp"] = int(r["lp"]) + int(out["d"])
				if int(r["lp"]) < 0:
					if shield_was > 0:
						r["lp"] = 0
						out["shield"] = true
					else:
						r["tier"] = 6
						r["div"] = 3
						r["lp"] = 75
						out["demo"] = tier_name(r)
			elif int(r["lp"]) > 0:
				r["lp"] = maxi(0, int(r["lp"]) + int(out["d"]))
			elif int(r["div"]) > 0:
				r["div"] = int(r["div"]) - 1
				r["lp"] = 75
				out["demo"] = tier_name(r)
			elif int(r["tier"]) > 0:
				if shield_was > 0:
					out["shield"] = true
				else:
					r["tier"] = int(r["tier"]) - 1
					r["div"] = 3
					r["lp"] = 75
					out["demo"] = tier_name(r)
	if out.get("box", false):
		save["boxes"] = int(save.get("boxes", 0)) + 1
	if int(r["tier"]) >= 0 and score(r) > int(r["peak"]):
		r["peak"] = score(r)
		r["peak_name"] = tier_name(r)
	out["after"] = label(r)
	out["col"] = color(r)
	return out
