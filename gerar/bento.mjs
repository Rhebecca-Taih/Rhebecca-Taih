import { existsSync, mkdirSync, readFileSync, writeFileSync as gravar } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PASTA = join(AQUI, 'personagem');
const PASTA_GIF = join(AQUI, 'gifs');
const B = {
  roxo1: '#5b2d91', roxo2: '#341660', claro: '#f6eefe', claro2: '#e9dcfb', tinta: '#2a1145',
  lavanda: '#deaaf9', branco: '#ffffff', suave: '#cdb6ec', verde: '#3ddc84', borda: '#4b2a7a', medio: '#b48be8',
};
const FONTE = "'Poppins','Segoe UI',Ubuntu,'Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono','Cascadia Code',Consolas,monospace";
const DIAS_KANJI = ['日', '月', '火', '水', '木', '金', '土'];
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const P = 16;

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cache = {};
const dado = (nome) => (cache[nome] ??= `data:image/webp;base64,${readFileSync(join(PASTA, `${nome}.webp`)).toString('base64')}`);
const dadoGif = (nome) => (cache[`gif-${nome}`] ??= `data:image/gif;base64,${readFileSync(join(PASTA_GIF, `${nome}.gif`)).toString('base64')}`);
const fonte = (nome) => dado(nome);
const PASTA_FUNDOS = join(AQUI, 'fundos');
const ELEMENTO = /^(kuromi|bruxa)|^(codigo|controle|gato-pixel|lua|brilhos|laco|coracoes)$/;
let balancos = 0;
const img = (nome, x, y, w, h, alinhar = 'xMidYMax') => {
  const imagem = `<image href="${fonte(nome)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${alinhar} meet"/>`;
  if (!ELEMENTO.test(nome)) return imagem;
  const k = balancos++, cx = x + w / 2, cy = y + h / 2, a = 4 + (k % 3);
  const giro = `values="${-a} ${cx} ${cy};${a} ${cx} ${cy};${-a} ${cx} ${cy}" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"`;
  return `<g>${imagem}<animateTransform attributeName="transform" type="rotate" ${giro} dur="${(2.6 + (k % 4) * 0.4).toFixed(1)}s" begin="${((k * 0.37) % 2).toFixed(2)}s" repeatCount="indefinite"/></g>`;
};
const gif = (nome, x, y, w, h) => `<image href="${dadoGif(nome)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const svg = (w, h, corpo, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>
<linearGradient id="gRoxo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${B.roxo1}"/><stop offset="1" stop-color="${B.roxo2}"/></linearGradient>
<linearGradient id="gClaro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${B.claro}"/><stop offset="1" stop-color="${B.claro2}"/></linearGradient>
<filter id="sombra" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity="0.45"/></filter>
${defs}</defs>${corpo}</svg>`;

function cartao(x, y, w, h, tipo = 'claro', rx = 26) {
  const preenchimento = { claro: 'url(#gClaro)', roxo: 'url(#gRoxo)', escuro: '#1a0b2e' }[tipo];
  const borda = tipo === 'roxo' ? '' : ` stroke="${B.borda}" stroke-width="2"`;
  return `<g filter="url(#sombra)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${preenchimento}"${borda}/></g>`;
}

function estrela(x, y, t, atraso = 0, cor = B.branco) {
  const d = `M${x} ${y - t} Q${x + t * 0.15} ${y - t * 0.15} ${x + t} ${y} Q${x + t * 0.15} ${y + t * 0.15} ${x} ${y + t} Q${x - t * 0.15} ${y + t * 0.15} ${x - t} ${y} Q${x - t * 0.15} ${y - t * 0.15} ${x} ${y - t}Z`;
  return `<path d="${d}" fill="${cor}"><animate attributeName="opacity" values="1;0.2;1" dur="${(2.2 + atraso).toFixed(1)}s" begin="${atraso}s" repeatCount="indefinite"/></path>`;
}

function trocaImagens(nomes, x, y, w, h, porImagem = 2.4) {
  const n = nomes.length;
  const chaves = nomes.map((_, k) => (k / n).toFixed(4)).join(';');
  return nomes.map((nome, i) => {
    const valores = nomes.map((_, k) => (k === i ? 1 : 0)).join(';');
    return `<g opacity="${i === 0 ? 1 : 0}"><animate attributeName="opacity" values="${valores}" keyTimes="${chaves}" calcMode="discrete" dur="${n * porImagem}s" repeatCount="indefinite"/>${img(nome, x, y, w, h, 'xMidYMid')}</g>`;
  }).join('');
}

function frases(x, y, lista, tamanho = 15, cor = B.lavanda) {
  const porLetra = tamanho * 0.6, ciclo = lista.length * 4.5;
  return lista.map((frase, k) => {
    const largura = Math.ceil(frase.length * porLetra) + 2;
    const ini = k / lista.length, fim = (k + 1) / lista.length, fatia = fim - ini;
    const marcos = [[0, 0], [ini, 0], [ini + fatia * 0.45, largura], [fim - fatia * 0.12, largura], [fim - 0.001, 0], [1, 0]].filter(([t], i, l) => i === 0 || t > l[i - 1][0]);
    return `<clipPath id="bf-${k}"><rect x="${x}" y="${y - tamanho}" height="${tamanho + 8}" width="0"><animate attributeName="width" values="${marcos.map((m) => m[1]).join(';')}" keyTimes="${marcos.map((m) => m[0].toFixed(4)).join(';')}" dur="${ciclo}s" repeatCount="indefinite"/></rect></clipPath>
<text x="${x}" y="${y}" fill="${cor}" font-family="${MONO}" font-size="${tamanho}" clip-path="url(#bf-${k})">${esc(frase)}</text>`;
  }).join('');
}

function quebrar(texto, porLinha) {
  const linhas = [];
  let atual = '';
  for (const p of texto.split(' ')) {
    if ((atual + ' ' + p).trim().length > porLinha) { linhas.push(atual); atual = p; } else atual = (atual + ' ' + p).trim();
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function avatarRedondo(nome, cx, cy, r, id, online = true) {
  const w = r * 3, h = r * 3.4;
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r + 2}" fill="${B.claro2}"/>
<image href="${fonte(nome)}" x="${cx - w / 2}" y="${cy - h * 0.56}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${id})"/>
${online ? `<circle cx="${cx + r * 0.72}" cy="${cy + r * 0.72}" r="${r * 0.3}" fill="${B.verde}" stroke="${B.branco}" stroke-width="2"/>` : ''}`;
}

const coracao = (x, y, s, cor) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 4 C0 -2 8 -3 10 3 C12 -3 20 -2 20 4 C20 10 12 14 10 17 C8 14 0 10 0 4Z" fill="${cor}"/>`;
const pontinhos = (x, y) => `<g fill="${B.branco}">${[0, 1, 2].map((i) => `<circle cx="${x + i * 18}" cy="${y}" r="6"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" begin="${i * 0.2}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;

export function gerarBento({ dados, r, CARDS, writeFileSync, perfil }) {
  const hoje = new Date();
  const escrever = (nome, conteudo) => writeFileSync(join(CARDS, `bento-${nome}.svg`), conteudo);
  const T = perfil.textos;
  const animacoes = [];
  mkdirSync(PASTA_FUNDOS, { recursive: true });
  const fundo = (nome, w, h, tras, camadas, frente = '', defs = '') => {
    gravar(join(PASTA_FUNDOS, `${nome}.svg`), svg(w, h, tras, defs));
    if (frente) gravar(join(PASTA_FUNDOS, `${nome}-frente.svg`), svg(w, h, frente, defs));
    animacoes.push({ nome, w, h, frente: !!frente, camadas });
  };

  // ── topo e abas ──
  const textoTopo = `<text x="72" y="32" fill="${B.branco}" font-family="${FONTE}" font-size="18" font-weight="800">Rhebecca</text>
<text x="72" y="52" fill="${B.suave}" font-family="${FONTE}" font-size="12">@${esc(perfil.usuario)} · online</text>`;
  escrever('topo-perfil', svg(500, 72, `${avatarRedondo('piscadinha', 34, 36, 26, 'tp-av')}${textoTopo}`));
  fundo('topo', 500, 72, `<circle cx="34" cy="36" r="28" fill="${B.claro2}"/>${textoTopo}`,
    [{ tipo: 'gif', nome: 'piscadinha', caixa: [34 - 39, 36 - 88.4 * 0.64, 78, 88.4], circulo: [34, 36, 26] }],
    `<circle cx="${34 + 26 * 0.72}" cy="${36 + 26 * 0.72}" r="${26 * 0.3}" fill="${B.verde}" stroke="${B.branco}" stroke-width="2"/>`);
  for (const [id, rotulo] of [['home', 'Home'], ['about', 'About'], ['code', 'Code'], ['projects', 'Projects']]) {
    escrever(`aba-${id}`, svg(96, 72, id === 'home'
      ? `<rect x="6" y="22" width="84" height="28" rx="6" fill="${B.roxo1}"/><text x="48" y="42" text-anchor="middle" fill="${B.branco}" font-family="${FONTE}" font-size="15" font-weight="700">${rotulo}</text>`
      : `<text x="48" y="42" text-anchor="middle" fill="${B.claro}" font-family="${FONTE}" font-size="15" font-weight="600">${rotulo}</text><rect x="22" y="50" width="52" height="2" rx="1" fill="${B.lavanda}" opacity="0"><animate attributeName="opacity" values="0;0.8;0" dur="3s" begin="${['about', 'code', 'projects'].indexOf(id) * 0.6}s" repeatCount="indefinite"/></rect>`));
  }

  // ── hero ──
  const boasVindas = quebrar(T.boasVindas, 46);
  const barras = [0, 1, 2].map((i) => `<rect x="${60 + i * 66}" y="${P + 290}" width="56" height="7" rx="3.5" fill="${B.branco}" opacity="0.4"/><rect x="${60 + i * 66}" y="${P + 290}" width="56" height="7" rx="3.5" fill="${B.branco}" opacity="0"><animate attributeName="opacity" values="${[0, 1, 2].map((k) => (k === i ? 1 : 0)).join(';')};${i === 0 ? 1 : 0}" keyTimes="0;0.333;0.666;1" calcMode="discrete" dur="9s" repeatCount="indefinite"/></rect>`).join('');
  escrever('hero', svg(860, 330 + P * 2, `
<rect x="2" y="${P + 30}" width="856" height="300" rx="34" fill="url(#gRoxo)" filter="url(#sombra)"/>
<g clip-path="url(#hero-c)"><circle cx="720" cy="${P + 300}" r="190" fill="${B.lavanda}" opacity="0.12"/><circle cx="90" cy="${P + 50}" r="120" fill="${B.lavanda}" opacity="0.06"/></g>
<text x="60" y="${P + 80}" fill="${B.claro2}" font-family="${FONTE}" font-size="15" letter-spacing="3">レベッカ ⋆˚✮</text>
<text x="56" y="${P + 132}" fill="${B.branco}" font-family="${FONTE}" font-size="48" font-weight="800">${esc(T.saudacao)}</text>
${coracao(58, P + 156, 1.1, B.lavanda)}
<text x="88" y="${P + 178}" fill="${B.branco}" font-family="${FONTE}" font-size="36" font-weight="800" textLength="${T.nome.length * 21}" lengthAdjust="spacingAndGlyphs">${esc(T.nome)}</text>
${coracao(96 + T.nome.length * 21, P + 156, 1.1, B.lavanda)}
${boasVindas.map((l, i) => `<text x="60" y="${P + 214 + i * 22}" fill="${B.claro}" font-family="${FONTE}" font-size="15">${esc(l)}</text>`).join('')}
${frases(60, P + 268, perfil.frases, 14, B.lavanda)}
${barras}
${img('retrato', 540, P - 6, 310, 334)}
${estrela(536, P + 70, 10, 0)}${estrela(842, P + 110, 7, 0.8)}${estrela(820, P + 290, 9, 0.4, B.lavanda)}`, `<clipPath id="hero-c"><rect x="2" y="${P + 30}" width="856" height="300" rx="34"/></clipPath>`));

  // ── about ──
  let ySobre;
  ySobre = P + 96;
  const topicos = T.sobre.map((t, k) => {
    const linhas = quebrar(t, 44);
    const bloco = `${coracao(24, ySobre - 11, 0.62, k % 2 ? B.medio : B.roxo1)}${linhas.map((l, i) => `<text x="44" y="${ySobre + i * 18}" fill="${B.tinta}" font-family="${FONTE}" font-size="13.5" font-weight="500">${esc(l)}</text>`).join('')}`;
    ySobre += linhas.length * 18 + 7;
    return bloco;
  }).join('');
  const alturaSobre = Math.max(262, ySobre - P + 4);
  const amo = [['codigo', 'code'], ['controle', 'games'], ['gato-pixel', 'gatos'], ['kuromi', 'Kuromi']]
    .map(([n, t], i) => {
      const passoY = (alturaSobre - 60) / 2;
      const x = 648 + 22 + (i % 2) * 88, y = P + 58 + Math.floor(i / 2) * passoY + (passoY - 92) / 2;
      return `${img(n, x, y, 78, 60, 'xMidYMid')}<text x="${x + 39}" y="${y + 80}" text-anchor="middle" fill="${B.tinta}" font-family="${FONTE}" font-size="13" font-weight="700">${t}</text>`;
    }).join('');
  const hS = alturaSobre + P * 2;
  escrever('sobre', svg(860, hS, `
${cartao(2, P, 396, alturaSobre)}
<text x="24" y="${P + 50}" fill="${B.roxo1}" font-family="${FONTE}" font-size="26" font-weight="800">quem sou eu</text>
<text x="374" y="${P + 48}" text-anchor="end" fill="${B.tinta}" font-family="${FONTE}" font-size="15">わたし ♡</text>
<line x1="2" y1="${P + 68}" x2="398" y2="${P + 68}" stroke="${B.borda}" stroke-width="2"/>
${topicos}
${cartao(418, P, 210, alturaSobre)}
<text x="523" y="${P + 36}" text-anchor="middle" fill="${B.roxo1}" font-family="${FONTE}" font-size="16" font-weight="800">humor de hoje</text>
${trocaImagens(['feliz', 'debochada', 'irritada', 'chorando', 'surpresa'], 428, P + 50, 190, alturaSobre - 62)}
${cartao(648, P, 210, alturaSobre)}
<text x="753" y="${P + 36}" text-anchor="middle" fill="${B.roxo1}" font-family="${FONTE}" font-size="16" font-weight="800">eu amo ♡</text>
${amo}`));
  escrever('sobre-texto', svg(410, hS, `
${cartao(2, P, 396, alturaSobre)}
<text x="24" y="${P + 50}" fill="${B.roxo1}" font-family="${FONTE}" font-size="26" font-weight="800">quem sou eu</text>
<text x="374" y="${P + 48}" text-anchor="end" fill="${B.tinta}" font-family="${FONTE}" font-size="15">わたし ♡</text>
<line x1="2" y1="${P + 68}" x2="398" y2="${P + 68}" stroke="${B.borda}" stroke-width="2"/>
${topicos}`));
  fundo('humor', 220, hS, `${cartao(8, P, 210, alturaSobre)}
<text x="113" y="${P + 36}" text-anchor="middle" fill="${B.roxo1}" font-family="${FONTE}" font-size="16" font-weight="800">humor de hoje</text>`,
    [{ tipo: 'sequencia', nomes: ['feliz', 'debochada', 'irritada', 'chorando', 'surpresa'], caixa: [18, P + 50, 190, alturaSobre - 62] }]);
  escrever('sobre-amo', svg(230, hS, `${cartao(18, P, 210, alturaSobre)}
<text x="123" y="${P + 36}" text-anchor="middle" fill="${B.roxo1}" font-family="${FONTE}" font-size="16" font-weight="800">eu amo ♡</text>
<g transform="translate(-630 0)">${amo}</g>`));

  // ── dia ──
  const dia = hoje.getDate(), mes = MESES[hoje.getMonth()], semana = hoje.getDay();
  escrever('dia', svg(860, 190 + P * 2, `
${cartao(2, P, 396, 190, 'roxo')}
<text x="30" y="${P + 72}" fill="${B.branco}" font-family="${FONTE}" font-size="56" font-weight="700">${dia}</text>
<text x="32" y="${P + 104}" fill="${B.branco}" font-family="${FONTE}" font-size="24" font-weight="500">${mes}</text>
<text x="30" y="${P + 166}" fill="${B.branco}" font-family="'Yu Gothic','Meiryo','MS Gothic',sans-serif" font-size="50" font-weight="700">${DIAS_KANJI[semana]}</text>
<text x="96" y="${P + 158}" fill="${B.claro}" font-family="${FONTE}" font-size="15">${DIAS[semana]} · ${hoje.getFullYear()}</text>
${img('lua', 300, P + 26, 66, 60, 'xMidYMid')}
${pontinhos(318, P + 158)}
${cartao(418, P, 210, 190)}
${gif('kitty-dormindo', 443, P + 12, 160, 166)}
${estrela(446, P + 34, 7, 0.3, B.roxo1)}${estrela(602, P + 150, 6, 1.1, B.roxo1)}
${cartao(648, P, 210, 190, 'roxo')}
<text x="672" y="${P + 64}" fill="${B.branco}" font-family="${FONTE}" font-size="44" font-weight="800">${r.atual}</text>
<text x="674" y="${P + 90}" fill="${B.claro}" font-family="${FONTE}" font-size="14">dia${r.atual === 1 ? '' : 's'} seguido${r.atual === 1 ? '' : 's'}</text>
<text x="674" y="${P + 110}" fill="${B.claro}" font-family="${FONTE}" font-size="14">codando</text>
${img('kuromi-cristal', 770, P + 82, 72, 100)}`));
  const hD = 190 + P * 2;
  escrever('dia-data', svg(410, hD, `
${cartao(2, P, 396, 190, 'roxo')}
<text x="30" y="${P + 72}" fill="${B.branco}" font-family="${FONTE}" font-size="56" font-weight="700">${dia}</text>
<text x="32" y="${P + 104}" fill="${B.branco}" font-family="${FONTE}" font-size="24" font-weight="500">${mes}</text>
<text x="30" y="${P + 166}" fill="${B.branco}" font-family="'Yu Gothic','Meiryo','MS Gothic',sans-serif" font-size="50" font-weight="700">${DIAS_KANJI[semana]}</text>
<text x="96" y="${P + 158}" fill="${B.claro}" font-family="${FONTE}" font-size="15">${DIAS[semana]} · ${hoje.getFullYear()}</text>
${img('lua', 300, P + 26, 66, 60, 'xMidYMid')}
${pontinhos(318, P + 158)}`));
  fundo('dia-kuromi', 220, hD, `${cartao(8, P, 210, 190)}
${estrela(36, P + 34, 7, 0.3, B.roxo1)}${estrela(192, P + 150, 6, 1.1, B.roxo1)}`,
    [{ tipo: 'gif', nome: 'kuromi-dormindo-giphy', caixa: [33, P + 12, 160, 166] }]);
  escrever('dia-seguidos', svg(230, hD, `
${cartao(18, P, 210, 190, 'roxo')}
<text x="42" y="${P + 64}" fill="${B.branco}" font-family="${FONTE}" font-size="44" font-weight="800">${r.atual}</text>
<text x="44" y="${P + 90}" fill="${B.claro}" font-family="${FONTE}" font-size="14">dia${r.atual === 1 ? '' : 's'} seguido${r.atual === 1 ? '' : 's'}</text>
<text x="44" y="${P + 110}" fill="${B.claro}" font-family="${FONTE}" font-size="14">codando</text>
${img('kuromi-cristal', 140, P + 82, 72, 100)}`));

  // ── ouvindo e jogando agora ──
  const ouvindo = T.ouvindo, jogando = T.jogando;
  const equalizador = [0, 1, 2, 3, 4].map((i) => {
    const alturas = [[10, 26, 14, 30, 10], [22, 8, 28, 12, 22], [16, 30, 10, 24, 16], [28, 12, 22, 8, 28], [12, 20, 30, 16, 12]][i];
    const ys = alturas.map((a) => P + 64 - a);
    return `<rect x="${470 + i * 8}" width="5" rx="2" fill="${B.lavanda}" y="${ys[0]}" height="${alturas[0]}"><animate attributeName="height" values="${alturas.join(';')}" dur="${(1 + i * 0.13).toFixed(2)}s" repeatCount="indefinite"/><animate attributeName="y" values="${ys.join(';')}" dur="${(1 + i * 0.13).toFixed(2)}s" repeatCount="indefinite"/></rect>`;
  }).join('');
  const coracoesVida = [0, 1, 2].map((i) => `<path transform="translate(${606 + i * 30} ${P + 150})" d="M0 4 C0 -2 8 -3 10 3 C12 -3 20 -2 20 4 C20 10 12 14 10 17 C8 14 0 10 0 4Z" fill="${B.roxo1}">${i === 2 ? '<animate attributeName="opacity" values="1;0.15;1" dur="1.4s" repeatCount="indefinite"/>' : ''}</path>`).join('');
  escrever('agora', svg(860, 190 + P * 2, `
${cartao(2, P, 528, 190, 'escuro')}
<defs><linearGradient id="capa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${B.lavanda}"/><stop offset="1" stop-color="${B.roxo1}"/></linearGradient></defs>
<rect x="24" y="${P + 22}" width="146" height="146" rx="18" fill="url(#capa)"/>
${img('kuromi-lua', 50, P + 34, 94, 122, 'xMidYMid')}
<text x="194" y="${P + 46}" fill="${B.suave}" font-family="${FONTE}" font-size="12" font-weight="700" letter-spacing="2">♪ OUVINDO AGORA</text>
<text x="194" y="${P + 80}" fill="${B.branco}" font-family="${FONTE}" font-size="22" font-weight="800">${esc(ouvindo.musica)}</text>
<text x="194" y="${P + 104}" fill="${B.claro}" font-family="${FONTE}" font-size="15">${esc(ouvindo.artista)}</text>
${equalizador}
<rect x="194" y="${P + 128}" width="310" height="5" rx="2.5" fill="${B.borda}"/>
<rect x="194" y="${P + 128}" width="0" height="5" rx="2.5" fill="${B.lavanda}"><animate attributeName="width" values="0;310" dur="40s" repeatCount="indefinite"/></rect>
<g transform="translate(300 ${P + 160})" fill="${B.branco}">
<path d="M-40 -8 L-40 8 M-38 0 L-26 -9 L-26 9 Z" stroke="${B.branco}" stroke-width="3"/>
<circle r="16" fill="${B.lavanda}"/><rect x="-6" y="-7" width="4" height="14" fill="${B.roxo2}"/><rect x="2" y="-7" width="4" height="14" fill="${B.roxo2}"/>
<path d="M40 -8 L40 8 M38 0 L26 -9 L26 9 Z" stroke="${B.branco}" stroke-width="3"/></g>
${cartao(550, P, 308, 190)}
<text x="574" y="${P + 40}" fill="${B.roxo1}" font-family="${FONTE}" font-size="12" font-weight="800" letter-spacing="2">✦ JOGANDO AGORA</text>
<text x="574" y="${P + 78}" fill="${B.tinta}" font-family="${FONTE}" font-size="22" font-weight="800">${esc(jogando.jogo)}</text>
<text x="574" y="${P + 102}" fill="${B.roxo1}" font-family="${FONTE}" font-size="14">${esc(jogando.plataforma)}</text>
${coracoesVida}
${img('controle', 742, P + 110, 100, 70, 'xMidYMid')}`));

  // ── títulos ──
  const titulo = (id, arquivo, texto, japones, cenario, foco, enfeites) => {
    const botoes = [['_', 784], ['□', 806], ['×', 828]].map(([s, x]) => `<rect x="${x}" y="${P + 8}" width="16" height="16" rx="3" fill="${B.claro}" stroke="${B.roxo2}" stroke-width="1.5"/><text x="${x + 8}" y="${P + 21}" text-anchor="middle" fill="${B.roxo2}" font-family="${MONO}" font-size="12" font-weight="800">${s}</text>`).join('');
    escrever(`titulo-${id}`, svg(860, 176 + P * 2, `
<g filter="url(#sombra)"><rect x="2" y="${P}" width="856" height="176" rx="16" fill="${B.lavanda}"/></g>
<text x="22" y="${P + 22}" fill="${B.roxo2}" font-family="${MONO}" font-size="13" font-weight="800">♡ ${esc(arquivo)}</text>
${botoes}
<g clip-path="url(#jan-${id})"><image href="${dado(cenario)}" x="8" y="${P + 32}" width="844" height="136" preserveAspectRatio="xMidY${foco} slice"/><rect x="8" y="${P + 32}" width="844" height="136" fill="url(#escurece-${id})"/></g>
<rect x="8" y="${P + 32}" width="844" height="136" rx="10" fill="none" stroke="${B.roxo2}" stroke-width="2"/>
<text x="40" y="${P + 108}" fill="${B.branco}" font-family="${FONTE}" font-size="42" font-weight="800">${esc(texto)}</text>
<text x="44" y="${P + 140}" fill="${B.claro}" font-family="${FONTE}" font-size="16">${japones} ⋆˚✮</text>
${estrela(44 + texto.length * 26, P + 66, 9, 0)}${estrela(70 + texto.length * 26, P + 96, 6, 0.7, B.lavanda)}
${enfeites}`, `<clipPath id="jan-${id}"><rect x="8" y="${P + 32}" width="844" height="136" rx="10"/></clipPath>
<linearGradient id="escurece-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${B.roxo2}" stop-opacity="0.95"/><stop offset="0.42" stop-color="${B.roxo2}" stop-opacity="0.6"/><stop offset="1" stop-color="${B.roxo2}" stop-opacity="0.05"/></linearGradient>`));
  };
  titulo('about', 'about_me.exe', 'About me', 'わたし', 'cenario-kuromi', 'Min', `${img('bruxa-gato-fantasma', 700, P + 40, 100, 120)}${img('bruxa-vela', 790, P + 70, 56, 90)}`);
  titulo('code', 'code.exe', 'Code', 'プログラミング', 'cenario-pixel', 'Mid', `${img('kuromi-livro', 664, P + 52, 76, 100)}${img('kuromi-varinha', 750, P + 46, 50, 112)}${img('brilhos', 796, P + 44, 50, 46, 'xMidYMid')}`);
  titulo('projects', 'projects.exe', 'Projects', 'プロジェクト', 'cenario-kuromi', 'Max', `${img('kuromi-bau', 640, P + 70, 96, 86)}${img('kuromi-chave', 740, P + 50, 64, 104)}${img('kuromi-lanterna', 800, P + 52, 46, 104)}`);

  // ── code ──
  const COR = { kw: '#ff8fd8', str: '#b6f2c8', nome: B.branco, pont: B.suave, fn: '#8fd3ff' };
  const LINHAS = T.codigo;
  const codigo = LINHAS.map((partes, k) => {
    const y = P + 88 + k * 22;
    return `<text x="28" y="${y}" fill="${B.suave}" opacity="0.5" font-family="${MONO}" font-size="12">${k + 1}</text>
<text x="56" y="${y}" font-family="${MONO}" font-size="13">${partes.map(([t, c]) => `<tspan fill="${COR[c]}" xml:space="preserve">${esc(t)}</tspan>`).join('')}</text>`;
  }).join('');
  const yPrompt = P + 88 + LINHAS.length * 22 + 18;
  const comando = T.comando, resposta = T.resposta;
  const larguraComando = Math.ceil(comando.length * 7.8) + 4;
  const terminal = `<line x1="20" y1="${yPrompt - 22}" x2="484" y2="${yPrompt - 22}" stroke="${B.borda}" stroke-dasharray="4 4"/>
<clipPath id="cmd"><rect x="56" y="${yPrompt - 15}" height="22" width="0"><animate attributeName="width" values="0;0;${larguraComando};${larguraComando};0" keyTimes="0;0.02;0.3;0.95;1" dur="8s" repeatCount="indefinite"/></rect></clipPath>
<text x="28" y="${yPrompt}" fill="${B.lavanda}" font-family="${MONO}" font-size="13">&gt;&gt;&gt;</text>
<text x="56" y="${yPrompt}" fill="${B.branco}" font-family="${MONO}" font-size="13" clip-path="url(#cmd)">${esc(comando)}</text>
<text x="28" y="${yPrompt + 24}" fill="${COR.str}" font-family="${MONO}" font-size="13" opacity="0">${esc(resposta)}<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.38;0.95;1" calcMode="discrete" dur="8s" repeatCount="indefinite"/></text>`;
  const estudo = T.estudando.map((t, i) => `<g transform="translate(546 ${P + 118 + i * 46})">${estrela(8, -7, 8, i * 0.5, B.roxo1)}<text x="26" y="0" fill="${B.roxo1}" font-family="${FONTE}" font-size="21" font-weight="800">${esc(t)}</text></g>`).join('');
  escrever('code', svg(860, 292 + P * 2, `
${cartao(2, P, 500, 292, 'escuro')}
<circle cx="30" cy="${P + 28}" r="7" fill="#ff6b9a"/><circle cx="52" cy="${P + 28}" r="7" fill="#ffd36b"/><circle cx="74" cy="${P + 28}" r="7" fill="${B.verde}"/>
<text x="252" y="${P + 33}" text-anchor="middle" fill="${B.suave}" font-family="${MONO}" font-size="13">rhebecca.py</text>
${img('kuromi-estrela', 452, P + 4, 34, 44, 'xMidYMid')}
<line x1="2" y1="${P + 52}" x2="502" y2="${P + 52}" stroke="${B.borda}"/>
${codigo}
${terminal}
${cartao(522, P, 336, 292)}
<text x="546" y="${P + 46}" fill="${B.roxo1}" font-family="${FONTE}" font-size="24" font-weight="800">Agora estudando</text>
<text x="546" y="${P + 72}" fill="${B.tinta}" font-family="${FONTE}" font-size="13">${esc(T.estudandoSub)}</text>
${estudo}
${img('programando', 680, P + 104, 170, 182)}`));

  // ── stack e atividade ──
  const grupos = perfil.stack.map((g, i) => {
    const x = 26 + (i % 2) * 262, y = P + 78 + Math.floor(i / 2) * 84;
    let cx = x, cy = y;
    const chips = g.itens.map((t) => {
      const w = Math.round(t.length * 7.2 + 26);
      if (cx + w > x + 244) { cx = x; cy += 30; }
      const c = `<rect x="${cx}" y="${cy + 10}" width="${w}" height="24" rx="12" fill="${B.roxo1}"/><text x="${cx + w / 2}" y="${cy + 26}" text-anchor="middle" fill="${B.branco}" font-family="${FONTE}" font-size="12" font-weight="600">${esc(t)}</text>`;
      cx += w + 6;
      return c;
    }).join('');
    return `<text x="${x}" y="${y}" fill="${B.roxo1}" font-family="${FONTE}" font-size="11" font-weight="800" letter-spacing="1.5">${esc(g.grupo.toUpperCase())}</text>${chips}`;
  }).join('');

  const totalBytes = Math.max(1, dados.linguagens.reduce((t, l) => t + l.bytes, 0));
  const TONS = [B.branco, B.lavanda, B.medio, '#8a5cd0', '#6a3fb0'];
  const linguagens = dados.linguagens.slice(0, 5).map((l, i) => ({ ...l, pct: (100 * l.bytes) / totalBytes, cor: TONS[i] }));
  let xBarra = 586;
  const barra = linguagens.map((l) => {
    const w = (l.pct / 100) * 248;
    const parte = `<rect x="${xBarra.toFixed(1)}" y="${P + 78}" width="${w.toFixed(1)}" height="14" fill="${l.cor}"/>`;
    xBarra += w;
    return parte;
  }).join('');
  const listaLing = linguagens.map((l, i) => `<g transform="translate(588 ${P + 128 + i * 26})"><circle cx="6" cy="-5" r="6" fill="${l.cor}"/><text x="20" y="0" fill="${B.branco}" font-family="${FONTE}" font-size="15" font-weight="700">${esc(l.nome)}</text><text x="246" y="0" text-anchor="end" fill="${B.claro}" font-family="${MONO}" font-size="14">${l.pct.toFixed(1)}%</text></g>`).join('');
  escrever('stack', svg(860, 262 + P * 2, `
${cartao(2, P, 540, 262)}
<text x="26" y="${P + 44}" fill="${B.roxo1}" font-family="${FONTE}" font-size="24" font-weight="800">Stack</text>
${grupos}
${cartao(562, P, 296, 262, 'roxo')}
<text x="588" y="${P + 44}" fill="${B.branco}" font-family="${FONTE}" font-size="22" font-weight="800">Linguagens</text>
<text x="588" y="${P + 64}" fill="${B.claro}" font-family="${FONTE}" font-size="12">nos repositórios públicos</text>
<clipPath id="barra-ling"><rect x="586" y="${P + 78}" width="0" height="14" rx="7"><animate attributeName="width" values="0;248;248" keyTimes="0;0.25;1" dur="8s" repeatCount="indefinite"/></rect></clipPath>
<rect x="586" y="${P + 78}" width="248" height="14" rx="7" fill="${B.roxo2}"/>
<g clip-path="url(#barra-ling)">${barra}</g>
${listaLing}
${img('kuromi-pocao', 776, P + 168, 64, 84)}`));

  // ── Cooking for Kuromi ──
  const X0 = 36, Y0 = P + 96, PASSO = 15, LADO = 12;
  const centro = (i, d) => [X0 + i * PASSO + LADO / 2, Y0 + d * PASSO + LADO / 2];
  const nivelCal = (n) => (n === 0 ? '#2d1a4a' : n < 2 ? B.medio : n < 4 ? B.lavanda : B.branco);
  const ativos = [];
  const celulas = dados.semanas.map((semana, i) => semana.map((d) => {
    const linha = new Date(`${d.date}T12:00:00Z`).getUTCDay();
    if (d.contributionCount) ativos.push({ i, d: linha, n: d.contributionCount });
    return `<rect x="${X0 + i * PASSO}" y="${Y0 + linha * PASSO}" width="${LADO}" height="${LADO}" rx="3" fill="#2d1a4a"/>`;
  }).join('')).join('');
  ativos.sort((a, b) => a.i - b.i || (a.i % 2 ? b.d - a.d : a.d - b.d));
  const ultimaColuna = dados.semanas.length - 1;
  const pontos = [[X0 - 40, centro(0, 3)[1]]];
  const paradas = [];
  for (const a of ativos) {
    const [cx, cy] = centro(a.i, a.d);
    const [ux, uy] = pontos.at(-1);
    if (ux !== cx) pontos.push([cx, uy]);
    if (uy !== cy) pontos.push([cx, cy]);
    paradas.push(pontos.length - 1);
  }
  const [fx, fy] = pontos.at(-1);
  pontos.push([fx, centro(0, 3)[1]], [X0 + ultimaColuna * PASSO + 60, centro(0, 3)[1]]);
  const VELOCIDADE = 110, PAUSA = 0.35, FIM = 1.6;
  const tempos = [0];
  const valores = [pontos[0]];
  const chegadas = [];
  for (let k = 1; k < pontos.length; k++) {
    const dist = Math.abs(pontos[k][0] - pontos[k - 1][0]) + Math.abs(pontos[k][1] - pontos[k - 1][1]);
    tempos.push(tempos.at(-1) + dist / VELOCIDADE);
    valores.push(pontos[k]);
    for (const _ of paradas.filter((p) => p === k)) { chegadas.push(tempos.at(-1)); tempos.push(tempos.at(-1) + PAUSA); valores.push(pontos[k]); }
  }
  const DUR = tempos.at(-1) + FIM;
  tempos.push(DUR);
  valores.push(valores.at(-1));
  const comeu = chegadas.map((t) => t / DUR);
  const comidas = ativos.map((a, k) => {
    const t = (comeu[k] ?? 0.99).toFixed(4);
    const [cx, cy] = centro(a.i, a.d);
    return `<rect x="${cx - LADO / 2}" y="${cy - LADO / 2}" width="${LADO}" height="${LADO}" rx="3" fill="${nivelCal(a.n)}"><animate attributeName="opacity" values="1;0;1" keyTimes="0;${t};0.985" calcMode="discrete" dur="${DUR.toFixed(2)}s" repeatCount="indefinite"/></rect>
<text x="${cx}" y="${cy - 10}" text-anchor="middle" fill="${B.lavanda}" font-family="${FONTE}" font-size="12" font-weight="800" opacity="0">+${a.n}<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;${t};${(+t + 0.005).toFixed(4)};${(+t + 0.04).toFixed(4)};1" dur="${DUR.toFixed(2)}s" repeatCount="indefinite"/><animate attributeName="y" values="${cy - 10};${cy - 10};${cy - 28};${cy - 28}" keyTimes="0;${t};${(+t + 0.04).toFixed(4)};1" dur="${DUR.toFixed(2)}s" repeatCount="indefinite"/></text>`;
  }).join('');
  let soma = 0;
  const contador = ativos.map((a, k) => {
    soma += a.n;
    const ini = comeu[k] ?? 0.99, fim = comeu[k + 1] ?? 0.985;
    return `<text x="834" y="${P + 50}" text-anchor="end" fill="${B.branco}" font-family="${MONO}" font-size="20" font-weight="800" opacity="0">${soma}<animate attributeName="opacity" values="0;1;0" keyTimes="0;${ini.toFixed(4)};${fim.toFixed(4)}" calcMode="discrete" dur="${DUR.toFixed(2)}s" repeatCount="indefinite"/></text>`;
  }).join('');
  const meses = [];
  let mesAnterior = -1;
  dados.semanas.forEach((s, i) => {
    const m = new Date(`${s[0].date}T12:00:00Z`).getUTCMonth();
    if (m !== mesAnterior && i < dados.semanas.length - 2) { if (mesAnterior !== -1 || i === 0) meses.push(`<text x="${X0 + i * PASSO}" y="${Y0 - 10}" fill="${B.suave}" font-family="${FONTE}" font-size="11">${MESES[m].slice(0, 3).toLowerCase()}</text>`); mesAnterior = m; }
  });
  const caminho = valores.map((v) => `${v[0] - 21},${v[1] - 22}`).join(';');
  escrever('kuromi', svg(860, 236 + P * 2, `
${cartao(2, P, 856, 236, 'escuro')}
<text x="30" y="${P + 44}" fill="${B.branco}" font-family="${FONTE}" font-size="22" font-weight="800">${esc(T.kuromi.titulo)}</text>
<text x="30" y="${P + 66}" fill="${B.suave}" font-family="${FONTE}" font-size="13">${esc(T.kuromi.subtitulo)} · ${dados.total} contribuições no último ano</text>
<text x="834" y="${P + 70}" text-anchor="end" fill="${B.suave}" font-family="${FONTE}" font-size="11">lanchinhos</text>
<text x="834" y="${P + 50}" text-anchor="end" fill="${B.branco}" font-family="${MONO}" font-size="20" font-weight="800">0<animate attributeName="opacity" values="1;0;1" keyTimes="0;${(comeu[0] ?? 0.99).toFixed(4)};0.985" calcMode="discrete" dur="${DUR.toFixed(2)}s" repeatCount="indefinite"/></text>
${contador}
${meses.join('')}
${celulas}
<text x="${X0}" y="${Y0 + 7 * PASSO + 22}" fill="${B.suave}" font-family="${FONTE}" font-size="11">menos</text>${[0, 1, 2, 4].map((n, i) => `<rect x="${X0 + 40 + i * PASSO}" y="${Y0 + 7 * PASSO + 12}" width="${LADO}" height="${LADO}" rx="3" fill="${nivelCal(n)}"/>`).join('')}<text x="${X0 + 40 + 4 * PASSO + 4}" y="${Y0 + 7 * PASSO + 22}" fill="${B.suave}" font-family="${FONTE}" font-size="11">mais</text>
<text x="834" y="${Y0 + 7 * PASSO + 22}" text-anchor="end" fill="${B.suave}" font-family="${FONTE}" font-size="11">ela come um quadradinho por dia de commit ♡</text>
${comidas}
<g clip-path="url(#cal-c)"><g>${gif('kitty-brava', 0, 0, 42, 44)}<animateTransform attributeName="transform" type="translate" values="${caminho}" keyTimes="${tempos.map((t) => (t / DUR).toFixed(4)).join(';')}" dur="${DUR.toFixed(2)}s" repeatCount="indefinite"/></g></g>`, `<clipPath id="cal-c"><rect x="2" y="${P}" width="856" height="236" rx="26"/></clipPath>`));

  // ── projetos ──
  const ROSTO = { planejador: 'cafezinho', arcano: 'pensativa', vagas: 'dormindo', rfid: 'comemorando' };
  for (const p of perfil.projetos) {
    const tamanho = p.nome.length > 16 ? 15 : 17;
    const rosto = ROSTO[p.id] || 'piscadinha';
    const corpo = (comRosto) => `
${cartao(8, P, 196, 270)}
<rect x="22" y="${P + 14}" width="${p.status.length * 7.6 + 22}" height="24" rx="12" fill="${B.roxo1}"/><text x="33" y="${P + 30}" fill="${B.branco}" font-family="${FONTE}" font-size="12" font-weight="700">${esc(p.status)}</text>
${comRosto ? img(rosto, 24, P + 44, 164, 170, 'xMidYMid') : ''}
<line x1="30" y1="${P + 222}" x2="182" y2="${P + 222}" stroke="${B.suave}" stroke-width="1.5"/>
<text x="106" y="${P + 250}" text-anchor="middle" fill="${B.roxo1}" font-family="${FONTE}" font-size="${tamanho}" font-weight="800">${esc(p.nome)}</text>`;
    escrever(`projeto-${p.id}`, svg(212, 270 + P * 2, corpo(true)));
    fundo(`projeto-${p.id}`, 212, 270 + P * 2, corpo(false), [{ tipo: 'gif', nome: rosto, caixa: [24, P + 44, 164, 170] }]);
  }

  const destaques = perfil.projetos.filter((p) => p.destaque);
  escrever('ver-todos', svg(860, 64 + P * 2, `
${cartao(2, P, 856, 64, 'claro', 32)}
<text x="40" y="${P + 40}" fill="${B.roxo1}" font-family="${FONTE}" font-size="20" font-weight="800">ver todos os projetos</text>
<text x="270" y="${P + 39}" fill="${B.tinta}" font-family="${FONTE}" font-size="14">${dados.repos} repositórios públicos ✦</text>
${img('bruxa-livros', 700, P + 6, 70, 52, 'xMidYMid')}
<g transform="translate(814 ${P + 32})"><circle r="18" fill="${B.roxo1}"/><path d="M-4 -7 L4 0 L-4 7" fill="none" stroke="${B.branco}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>`));
  const README = join(AQUI, '..', 'README.md');
  if (existsSync(README)) {
    const linhas = destaques.map((p) => {
      const animado = existsSync(join(CARDS, `animado-projeto-${p.id}.webp`)) ? `animado-projeto-${p.id}.webp` : `bento-projeto-${p.id}.svg`;
      return `  <a href="${p.link}"><img src="cards/${animado}" width="24%" alt="${esc(p.nome)}"/></a>`;
    });
    const bloco = ['<!-- projetos -->', ...linhas, '  <br><br>', `  <a href="${perfil.todosProjetos}"><img src="cards/bento-ver-todos.svg" width="100%" alt="Ver todos os projetos"/></a>`, '  <!-- /projetos -->'].join('\n');
    const texto = readFileSync(README, 'utf8');
    const ini = texto.indexOf('<!-- projetos -->'), fim = texto.indexOf('<!-- /projetos -->');
    if (ini >= 0 && fim > ini) gravar(README, texto.slice(0, ini) + bloco + texto.slice(fim + '<!-- /projetos -->'.length));
  }

  // ── view more e contato ──
  const verMais = (comGif) => `
${cartao(2, P, 856, 84, 'roxo', 42)}
<text x="40" y="${P + 54}" fill="${B.branco}" font-family="${FONTE}" font-size="30" font-weight="800">View More</text>
<text x="210" y="${P + 53}" fill="${B.claro}" font-family="${FONTE}" font-size="15">redes sociais e contato ✦</text>
${comGif ? gif('kitty-brava', 650, P + 4, 76, 76) : ''}${img('bruxa-bola-cristal', 740, P + 8, 60, 70, 'xMidYMid')}
<g transform="translate(814 ${P + 42})"><circle r="20" fill="${B.branco}"><animate attributeName="r" values="20;22;20" dur="1.6s" repeatCount="indefinite"/></circle><path d="M-4 -8 L5 0 L-4 8" fill="none" stroke="${B.roxo1}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  escrever('ver-mais', svg(860, 84 + P * 2, verMais(true)));
  fundo('ver-mais', 860, 84 + P * 2, verMais(false), [{ tipo: 'gif', nome: 'kuromi-brava-giphy', caixa: [650, P + 4, 76, 76] }]);

  const ICONES = {
    linkedin: `<rect x="-11" y="-11" width="22" height="22" rx="4" fill="${B.roxo1}"/><text x="0" y="6" text-anchor="middle" fill="${B.branco}" font-family="${FONTE}" font-size="14" font-weight="800">in</text>`,
    gmail: `<rect x="-12" y="-8" width="24" height="17" rx="3" fill="none" stroke="${B.roxo1}" stroke-width="2.4"/><path d="M-11 -6 L0 2 L11 -6" fill="none" stroke="${B.roxo1}" stroke-width="2.4"/>`,
    instagram: `<rect x="-11" y="-11" width="22" height="22" rx="7" fill="none" stroke="${B.roxo1}" stroke-width="2.4"/><circle r="5" fill="none" stroke="${B.roxo1}" stroke-width="2.4"/><circle cx="6" cy="-6" r="1.6" fill="${B.roxo1}"/>`,
  };
  for (const ct of perfil.contatos) {
    escrever(`contato-${ct.id}`, svg(260, 64, `${cartao(2, 2, 256, 54, 'claro', 27)}
<g transform="translate(36 29)">${ICONES[ct.id]}</g><text x="62" y="35" fill="${B.tinta}" font-family="${FONTE}" font-size="17" font-weight="800">${esc(ct.rotulo)}</text><text x="236" y="35" text-anchor="end" fill="${B.roxo1}" font-family="${FONTE}" font-size="16" font-weight="800">↗</text>`));
  }

  // ── base ──
  const avatares = ['feliz', 'piscadinha', 'programando', 'descolada', 'carinhosa'].map((n, i) => avatarRedondo(n, 36 + i * 50, P + 32, 19, `base-${i}`)).join('');
  const icones = ['bruxa-morcego', 'bruxa-chapeu', 'bruxa-caldeirao', 'bruxa-caveira', 'bruxa-coroa-lua'].map((n, i) => img(n, 296 + i * 46, P + 12, 38, 40, 'xMidYMid')).join('');
  escrever('base', svg(860, 64 + P * 2, `
${cartao(2, P, 540, 62, 'claro', 31)}
${avatares}${icones}
${cartao(562, P, 296, 62, 'roxo', 31)}
<text x="590" y="${P + 38}" fill="${B.branco}" font-family="${FONTE}" font-size="16" font-weight="600">${esc(T.rodape)}</text>
${pontinhos(796, P + 32)}`));
  gravar(join(PASTA_FUNDOS, 'animacoes.json'), JSON.stringify(animacoes, null, 2));
}
