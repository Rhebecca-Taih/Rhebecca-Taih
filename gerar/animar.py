"""Monta os cartões animados (WebP) a partir dos fundos gerados por gerar.mjs.

Uso (no PC, depois de rodar gerar.mjs):
    python gerar/animar.py <pasta APROVADOS> <pasta recortes> <pasta elementos> [nomes, para refazer só alguns]
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageSequence

AQUI = Path(__file__).parent
FUNDOS = AQUI / "fundos"
CARDS = AQUI.parent / "cards"
ESCALA = 2
TEMPO_PARADO = 2600
TEMPO_MINIMO = 2600
QUADROS_TRANSICAO = 7
QUALIDADE = {"humor": 80}
GIF_DA_EXPRESSAO = {
    "dormindo": "01-dormindo", "chorando": "02-chorando", "surpresa": "04-assustada", "cafezinho": "05-cafe",
    "debochada": "06-pensativa", "pensativa": "08-curiosa", "carinhosa": "09-abraco",
    "comemorando": "11-comemorando", "piscadinha": "12-piscadinha",
}
EDGE = next(p for p in [Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
                        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe")] if p.exists())


def fotografar_todos(pecas, pasta):
    largura = max(w for _, w, _ in pecas)
    altura = sum(h for _, _, h in pecas)
    blocos, topo, posicoes = [], 0, {}
    for svg, w, h in pecas:
        blocos.append(f'<div style="width:{w}px;height:{h}px;overflow:hidden">{svg.read_text(encoding="utf-8")}</div>')
        posicoes[svg.stem] = (topo, w, h)
        topo += h
    pagina = pasta / "fundos.html"
    pagina.write_text('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block}</style></head>'
                      f'<body>{"".join(blocos)}</body></html>', encoding="utf-8")
    saida = pasta / "fundos.png"
    subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--force-device-scale-factor={ESCALA}",
                    "--default-background-color=00000000", f"--user-data-dir={pasta / 'edge'}", f"--window-size={largura},{altura}",
                    "--virtual-time-budget=1500", f"--screenshot={saida}", pagina.as_uri()],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    foto = Image.open(saida).convert("RGBA")
    return {nome: foto.crop((0, y * ESCALA, w * ESCALA, (y + h) * ESCALA)) for nome, (y, w, h) in posicoes.items()}


def quadros_gif(arquivo):
    im = Image.open(arquivo)
    quadros = [(q.convert("RGBA"), max(20, q.info.get("duration", 80))) for q in ImageSequence.Iterator(im)]
    caixa = None
    for q, _ in quadros:
        b = q.getbbox()
        if b:
            caixa = b if caixa is None else (min(caixa[0], b[0]), min(caixa[1], b[1]), max(caixa[2], b[2]), max(caixa[3], b[3]))
    return [(q.crop(caixa), t) for q, t in quadros]


def encaixar(figura, caixa):
    x, y, w, h = [v * ESCALA for v in caixa]
    s = min(w / figura.width, h / figura.height)
    nova = figura.resize((max(1, round(figura.width * s)), max(1, round(figura.height * s))), Image.LANCZOS)
    alfa = nova.getchannel("A").filter(ImageFilter.GaussianBlur(0.8))
    nova.putalpha(ImageChops.multiply(alfa, alfa.point(lambda v: 255 if v > 40 else v * 6)))
    return nova, (round(x + (w - nova.width) / 2), round(y + (h - nova.height) / 2))


def origem(nome, pastas):
    aprovados, recortes, elementos = pastas
    if nome in GIF_DA_EXPRESSAO and (aprovados / f"{GIF_DA_EXPRESSAO[nome]}.gif").exists():
        return quadros_gif(aprovados / f"{GIF_DA_EXPRESSAO[nome]}.gif")
    if (elementos / f"{nome}.gif").exists():
        return quadros_gif(elementos / f"{nome}.gif")
    estatica = Image.open(recortes / f"{nome}.png").convert("RGBA")
    return [(estatica.crop(estatica.getbbox()), TEMPO_PARADO)]


def compor(fundo, frente, figura, caixa, circulo=None):
    quadro = fundo.copy()
    nova, pos = encaixar(figura, caixa)
    camada = Image.new("RGBA", quadro.size, (0, 0, 0, 0))
    camada.alpha_composite(nova, pos)
    if circulo:
        cx, cy, r = [v * ESCALA for v in circulo]
        mascara = Image.new("L", quadro.size, 0)
        ImageDraw.Draw(mascara).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
        camada.putalpha(ImageChops.multiply(camada.getchannel("A"), mascara))
    quadro.alpha_composite(camada)
    if frente is not None:
        quadro.alpha_composite(frente)
    return quadro


def sequencia(nomes, pastas):
    trechos = []
    for nome in nomes:
        quadros = origem(nome, pastas)
        total, trecho = 0, []
        while total < TEMPO_MINIMO:
            for q, t in quadros:
                trecho.append((q, t))
                total += t
        trechos.append(trecho)
    return trechos


def main():
    pastas = tuple(Path(p) for p in sys.argv[1:4])
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        animacoes = json.loads((FUNDOS / "animacoes.json").read_text(encoding="utf-8"))
        pecas = []
        so = set(sys.argv[4:])
        animacoes = [a for a in animacoes if not so or a["nome"] in so]
        for anim in animacoes:
            pecas.append((FUNDOS / f"{anim['nome']}.svg", anim["w"], anim["h"]))
            if anim["frente"]:
                pecas.append((FUNDOS / f"{anim['nome']}-frente.svg", anim["w"], anim["h"]))
        fotos = fotografar_todos(pecas, tmp)
        for anim in animacoes:
            fundo = fotos[anim["nome"]]
            frente = fotos.get(f"{anim['nome']}-frente")
            camada = anim["camadas"][0]
            saida = []
            if camada["tipo"] == "gif":
                for q, t in origem(camada["nome"], pastas):
                    saida.append((compor(fundo, frente, q, camada["caixa"], camada.get("circulo")), t))
            else:
                trechos = sequencia(camada["nomes"], pastas)
                for k, trecho in enumerate(trechos):
                    for q, t in trecho:
                        saida.append((compor(fundo, frente, q, camada["caixa"]), t))
                    a = compor(fundo, frente, trecho[-1][0], camada["caixa"])
                    b = compor(fundo, frente, trechos[(k + 1) % len(trechos)][0][0], camada["caixa"])
                    for i in range(1, QUADROS_TRANSICAO + 1):
                        saida.append((Image.blend(a, b, i / (QUADROS_TRANSICAO + 1)), 50))
            destino = CARDS / f"animado-{anim['nome']}.webp"
            imagens = [q for q, _ in saida]
            imagens[0].save(destino, save_all=True, append_images=imagens[1:], duration=[t for _, t in saida],
                            loop=0, quality=QUALIDADE.get(anim['nome'], 88), method=6, alpha_quality=85)
            print(destino.name, imagens[0].size, len(imagens), "quadros", round(destino.stat().st_size / 1024), "KB")


main()
