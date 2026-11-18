import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gerarBento } from './bento.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CARDS = join(AQUI, '..', 'cards');
const PERFIL = JSON.parse(readFileSync(join(AQUI, 'perfil.json'), 'utf8'));
const TOKEN = process.env.GITHUB_TOKEN;

const C = {
  fundo1: '#0b0614', fundo2: '#1b0b2f', borda: '#3b1856', roxo: '#8323b5', roxoClaro: '#b05be0',
  lavanda: '#deaaf9', texto: '#e9d8f6', suave: '#a993bd', apagado: '#5b4670', chip: '#1f0d36', chipBorda: '#4a1f6e',
};
const MONO = "'JetBrains Mono','Cascadia Code',Consolas,monospace";
const SANS = "'Segoe UI',Ubuntu,'Helvetica Neue',Arial,sans-serif";
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sorteio(semente) {
  let a = semente >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashTexto = (t) => [...t].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆
// DADOS
// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆

async function buscarDados() {
  const consulta = `query($login:String!){user(login:$login){followers{totalCount}
    repositories(ownerAffiliations:OWNER,privacy:PUBLIC){totalCount}
    linguagens:repositories(ownerAffiliations:OWNER,privacy:PUBLIC,isFork:false,first:100){nodes{languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
    contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'perfil-cards' },
    body: JSON.stringify({ query: consulta, variables: { login: PERFIL.usuario } }),
  });
  const j = await r.json();
  if (!j.data?.user) throw new Error(`GitHub não respondeu: ${JSON.stringify(j.errors || j).slice(0, 300)}`);
  const u = j.data.user;
  const cal = u.contributionsCollection.contributionCalendar;
  const bytes = {};
  for (const repo of u.linguagens.nodes) for (const e of repo.languages.edges) bytes[e.node.name] = (bytes[e.node.name] || 0) + e.size;
  const linguagens = Object.entries(bytes).map(([nome, n]) => ({ nome, bytes: n })).sort((a, b) => b.bytes - a.bytes);
  return { seguidores: u.followers.totalCount, repos: u.repositories.totalCount, total: cal.totalContributions, semanas: cal.weeks.map((w) => w.contributionDays), linguagens };
}

function resumo(dias) {
  let maior = 0, atual = 0, sequencia = 0, recorde = { n: 0, data: '' };
  for (const d of dias) {
    if (d.contributionCount > 0) { sequencia++; maior = Math.max(maior, sequencia); } else sequencia = 0;
    if (d.contributionCount > recorde.n) recorde = { n: d.contributionCount, data: d.date };
  }
  for (let i = dias.length - 1; i >= 0; i--) {
    if (dias[i].contributionCount > 0) atual++;
    else if (i === dias.length - 1) continue;
    else break;
  }
  return { ativos: dias.filter((d) => d.contributionCount > 0).length, maior, atual, recorde, hoje: dias.at(-1)?.contributionCount ?? 0 };
}

// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆
// PEÇAS DO DESENHO
// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆

function estrelasDeFundo(w, h, semente, quantas) {
  const s = sorteio(semente);
  let out = '';
  for (let i = 0; i < quantas; i++) {
    const x = (s() * w).toFixed(1), y = (s() * h).toFixed(1), r = (0.4 + s() * 0.9).toFixed(2), o = (0.15 + s() * 0.45).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.lavanda}" opacity="${o}"/>`;
  }
  return out;
}

const brilho = (x, y, t, cor = C.lavanda, o = 1) =>
  `<path d="M${x} ${y - t} Q${x + t * 0.18} ${y - t * 0.18} ${x + t} ${y} Q${x + t * 0.18} ${y + t * 0.18} ${x} ${y + t} Q${x - t * 0.18} ${y + t * 0.18} ${x - t} ${y} Q${x - t * 0.18} ${y - t * 0.18} ${x} ${y - t}Z" fill="${cor}" opacity="${o}"/>`;

function moldura(w, h, id, conteudo, { estrelas = 40 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="${id}-fundo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.fundo1}"/><stop offset="1" stop-color="${C.fundo2}"/></linearGradient>
  <filter id="${id}-luz" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${id}-luzforte" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="18" fill="url(#${id}-fundo)" stroke="${C.borda}" stroke-width="1.5"/>
<g>${estrelasDeFundo(w, h, hashTexto(id), estrelas)}</g>
${conteudo}
</svg>`;
}

function chip(x, y, texto, { tamanho = 12 } = {}) {
  const largura = Math.round(texto.length * tamanho * 0.62 + 34);
  return {
    largura,
    svg: `<g transform="translate(${x} ${y})"><rect width="${largura}" height="${tamanho + 14}" rx="${(tamanho + 14) / 2}" fill="${C.chip}" stroke="${C.chipBorda}"/>`
      + brilho(14, (tamanho + 14) / 2, 4, C.roxoClaro)
      + `<text x="24" y="${(tamanho + 14) / 2 + tamanho * 0.36}" fill="${C.lavanda}" font-family="${MONO}" font-size="${tamanho}">${esc(texto)}</text></g>`,
  };
}

function linhaDeChips(x, y, itens, maximo, opcoes) {
  let cx = x, cy = y, out = '';
  for (const t of itens) {
    const c = chip(cx, cy, t, opcoes);
    if (cx + c.largura > maximo && cx !== x) { cx = x; cy += 34; }
    out += chip(cx, cy, t, opcoes).svg;
    cx += c.largura + 10;
  }
  return out;
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

// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆
// CARTÕES
// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆

function cartaoTopo(d, r) {
  const avatar = readFileSync(join(AQUI, 'avatar.gif')).toString('base64');
  const stats = [
    [`${d.repos}`, 'repositórios públicos'],
    [`${d.total}`, 'contribuições no ano'],
    [`${r.ativos}`, 'dias com estrela'],
    [`${d.seguidores}`, 'seguidores'],
  ];
  const linhas = stats.map(([n, t], i) => {
    const x = 48 + (i % 2) * 270, y = 220 + Math.floor(i / 2) * 28;
    return brilho(x + 5, y - 5, 5, C.roxoClaro) + `<text x="${x + 18}" y="${y}" font-family="${MONO}" font-size="14"><tspan fill="${C.lavanda}" font-weight="700">${n}</tspan><tspan fill="${C.texto}"> ${esc(t)}</tspan></text>`;
  }).join('');
  const cx = 712, cy = 168;
  const orbita = `<ellipse cx="${cx}" cy="${cy}" rx="128" ry="42" fill="none" stroke="${C.roxoClaro}" stroke-opacity="0.35" stroke-dasharray="2 6" transform="rotate(-18 ${cx} ${cy})"/>`;
  const conteudo = `
<text x="48" y="60" fill="${C.roxoClaro}" font-family="${MONO}" font-size="14">⋆˚✮ @${esc(PERFIL.usuario)}</text>
<text x="46" y="110" fill="${C.lavanda}" font-family="${SANS}" font-size="44" font-weight="700" filter="url(#topo-luz)">${esc(PERFIL.saudacao)}</text>
${frasesDigitando(48, 146, PERFIL.frases)}
<text x="48" y="182" fill="${C.suave}" font-family="${MONO}" font-size="13">${esc(PERFIL.subtitulo)}</text>
${linhas}
${linhaDeChips(48, 278, PERFIL.destaques, 560, { tamanho: 12 })}
<circle cx="${cx}" cy="${cy}" r="116" fill="none" stroke="${C.lavanda}" stroke-opacity="0.18"/>
<circle cx="${cx}" cy="${cy}" r="102" fill="${C.fundo1}" stroke="${C.roxo}" stroke-width="2" filter="url(#topo-luz)"/>
<clipPath id="topo-recorte"><circle cx="${cx}" cy="${cy}" r="98"/></clipPath>
<image href="data:image/gif;base64,${avatar}" x="${cx - 66}" y="${cy - 62}" width="132" height="136" clip-path="url(#topo-recorte)" style="image-rendering:pixelated"/>
${orbita}
${brilho(cx + 110, cy - 76, 9, C.lavanda)}${brilho(cx - 118, cy + 62, 6, C.roxoClaro)}${brilho(cx + 94, cy + 90, 4, C.lavanda, 0.8)}`;
  return moldura(860, 330, 'topo', conteudo, { estrelas: 55 });
}

function frasesDigitando(x, y, frases) {
  const tamanho = 16, porLetra = tamanho * 0.6, ciclo = frases.length * 4.5;
  const textos = [], cursores = [];
  frases.forEach((frase, k) => {
    const largura = Math.ceil(frase.length * porLetra) + 2;
    const ini = k / frases.length, fim = (k + 1) / frases.length, fatia = fim - ini;
    const marcos = [[0, 0], [ini, 0], [ini + fatia * 0.45, largura], [fim - fatia * 0.12, largura], [fim - 0.001, 0], [1, 0]]
      .filter(([t], i, l) => i === 0 || t > l[i - 1][0]);
    const tempos = marcos.map(([t]) => t.toFixed(4)).join(';');
    const larguras = marcos.map(([, w]) => w).join(';');
    const posicoes = marcos.map(([, w]) => x + w + 2).join(';');
    const visivel = marcos.map(([t]) => (t >= ini && t < fim ? 1 : 0)).join(';');
    textos.push(`<clipPath id="frase-${k}"><rect x="${x}" y="${y - tamanho}" height="${tamanho + 8}" width="0"><animate attributeName="width" values="${larguras}" keyTimes="${tempos}" dur="${ciclo}s" repeatCount="indefinite"/></rect></clipPath>
<text x="${x}" y="${y}" fill="${C.lavanda}" font-family="${MONO}" font-size="${tamanho}" clip-path="url(#frase-${k})">${esc(frase)}</text>`);
    cursores.push(`<rect x="${x}" y="${y - tamanho + 2}" width="2" height="${tamanho + 2}" fill="${C.roxoClaro}" opacity="0"><animate attributeName="x" values="${posicoes}" keyTimes="${tempos}" dur="${ciclo}s" repeatCount="indefinite"/><animate attributeName="opacity" values="${visivel}" keyTimes="${tempos}" calcMode="discrete" dur="${ciclo}s" repeatCount="indefinite"/></rect>`);
  });
  return `${textos.join('\n')}\n<g><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/>${cursores.join('')}</g>`;
}

function cartaoCeu(d, r) {
  const dias = d.semanas.flat();
  const maximo = Math.max(1, ...dias.map((x) => x.contributionCount));
  const x0 = 330, x1 = 800, y0 = 96, y1 = 268;
  const passoX = (x1 - x0) / Math.max(1, d.semanas.length - 1), passoY = (y1 - y0) / 6;
  const pos = new Map();
  d.semanas.forEach((semana, i) => semana.forEach((dia) => {
    const s = sorteio(hashTexto(dia.date));
    const dow = new Date(`${dia.date}T12:00:00Z`).getUTCDay();
    pos.set(dia.date, { x: x0 + i * passoX + (s() - 0.5) * passoX * 0.7, y: y0 + dow * passoY + (s() - 0.5) * passoY * 0.6 });
  }));
  let linhas = '', pontos = '', anterior = null;
  for (const dia of dias) {
    const p = pos.get(dia.date);
    if (dia.contributionCount > 0 && anterior?.contributionCount > 0) {
      const a = pos.get(anterior.date);
      linhas += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${C.roxoClaro}" stroke-opacity="0.55" stroke-width="1"/>`;
    }
    if (dia.contributionCount === 0) pontos += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.1" fill="${C.lavanda}" opacity="0.28"/>`;
    else {
      const forca = dia.contributionCount / maximo;
      const tam = 2.2 + Math.log2(dia.contributionCount + 1) * 1.4;
      pontos += forca >= 0.5
        ? `<g filter="url(#ceu-luzforte)">${brilho(p.x, p.y, tam * 1.6, C.lavanda)}</g>`
        : `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(tam * 0.7).toFixed(2)}" fill="${C.lavanda}" filter="url(#ceu-luz)" opacity="${(0.55 + forca * 0.45).toFixed(2)}"/>`;
    }
    anterior = dia;
  }
  let meses = '', ultimoMes = -1;
  d.semanas.forEach((semana, i) => {
    const m = new Date(`${semana[0].date}T12:00:00Z`).getUTCMonth();
    if (m !== ultimoMes) { ultimoMes = m; if (i > 0 && i < d.semanas.length - 2) meses += `<text x="${(x0 + i * passoX).toFixed(1)}" y="296" fill="${C.apagado}" font-family="${MONO}" font-size="10" text-anchor="middle">${MESES[m]}</text>`; }
  });
  const dataBr = (iso) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—';
  const info = [
    ['dias com estrela', r.ativos],
    ['recorde num dia', `${r.recorde.n} (${dataBr(r.recorde.data)})`],
    ['maior constelação', `${r.maior} dia${r.maior === 1 ? '' : 's'}`],
    ['constelação atual', `${r.atual} dia${r.atual === 1 ? '' : 's'}`],
  ].map(([t, v], i) => `<text x="48" y="${200 + i * 24}" font-family="${MONO}" font-size="13"><tspan fill="${C.suave}">${esc(t)}:</tspan><tspan fill="${C.texto}"> ${esc(v)}</tspan></text>`).join('');
  const lua = `<g transform="translate(796 60)"><circle r="16" fill="${C.lavanda}" opacity="0.9" filter="url(#ceu-luz)"/><circle cx="7" cy="-5" r="15" fill="${C.fundo2}"/></g>`;
  const conteudo = `
<text x="48" y="58" fill="${C.texto}" font-family="${SANS}" font-size="22" font-weight="700">Céu de contribuições</text>
<text x="48" y="80" fill="${C.suave}" font-family="${MONO}" font-size="11">cada estrela é um dia; dias seguidos viram constelação</text>
<text x="48" y="124" fill="${C.roxoClaro}" font-family="${MONO}" font-size="11" letter-spacing="2">NO ÚLTIMO ANO</text>
<text x="46" y="170" fill="${C.lavanda}" font-family="${SANS}" font-size="46" font-weight="700" filter="url(#ceu-luz)">${d.total}</text>
${info}
${lua}
<g>${linhas}</g><g>${pontos}</g>
${meses}`;
  return moldura(860, 320, 'ceu', conteudo, { estrelas: 25 });
}

function cartaoStack() {
  const colunas = [48, 450];
  const grupos = PERFIL.stack.map((g, i) => {
    const x = colunas[i % 2], y = 104 + Math.floor(i / 2) * 82;
    return `<text x="${x}" y="${y}" fill="${C.roxoClaro}" font-family="${MONO}" font-size="11" letter-spacing="2">${esc(g.grupo.toUpperCase())}</text>` + linhaDeChips(x, y + 12, g.itens, x + 400, { tamanho: 11 });
  }).join('');
  const conteudo = `
<text x="48" y="58" fill="${C.texto}" font-family="${SANS}" font-size="22" font-weight="700">Stack</text>
<text x="48" y="80" fill="${C.suave}" font-family="${MONO}" font-size="11">o que aparece nos meus projetos</text>
${grupos}`;
  return moldura(860, 280, 'stack', conteudo, { estrelas: 22 });
}

const ESTILO_STATUS = {
  'no ar': { fundo: C.roxo, borda: C.roxo, texto: '#ffffff' },
  'em uso': { fundo: C.chip, borda: C.roxoClaro, texto: C.lavanda },
  'concluído': { fundo: 'none', borda: C.lavanda, texto: C.lavanda },
};

const EMBLEMAS = {
  planejador: (c) => `<rect x="-11" y="2" width="5" height="9" rx="1.5" fill="${c}"/><rect x="-3" y="-4" width="5" height="15" rx="1.5" fill="${c}"/><rect x="5" y="-10" width="5" height="21" rx="1.5" fill="${c}"/>`,
  arcano: (c) => `<path d="M0 -12 A12 12 0 0 0 0 12 A7 12 0 0 1 0 -12Z" fill="${c}"/>${brilho(7, -3, 5, c)}`,
  vagas: (c) => `<rect x="-12" y="-5" width="24" height="16" rx="3" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M-5 -5 V-9 H5 V-5" fill="none" stroke="${c}" stroke-width="2.4"/><line x1="-12" y1="2" x2="12" y2="2" stroke="${c}" stroke-width="2"/>`,
  rfid: (c) => `<path d="M-12 -8 H4 L12 0 L4 8 H-12Z" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="3" cy="0" r="2.4" fill="${c}"/><path d="M-8 -3 H-2 M-8 2 H-4" stroke="${c}" stroke-width="2"/>`,
};

function cartaoProjeto(p) {
  const st = ESTILO_STATUS[p.status] || ESTILO_STATUS['em uso'];
  const larguraTag = Math.round(p.status.length * 7.4 + 22);
  const desc = quebrar(p.descricao, 44).slice(0, 2).map((l, i) => `<text x="96" y="${78 + i * 19}" fill="${C.texto}" font-family="${SANS}" font-size="13.5">${esc(l)}</text>`).join('');
  const tecs = linhaDeChips(96, 120, p.tecnologias.split(' · '), 412, { tamanho: 9 });
  const abrir = p.link.includes('github.com') ? 'ver projeto ↗' : 'abrir o app ↗';
  const conteudo = `
<rect x="1" y="1" width="6" height="178" rx="3" fill="${C.roxo}"/>
<circle cx="52" cy="58" r="28" fill="${C.chip}" stroke="${C.roxoClaro}" stroke-opacity="0.6"/>
<g transform="translate(52 58)" filter="url(#projeto-${p.id}-luz)">${(EMBLEMAS[p.id] || EMBLEMAS.arcano)(C.lavanda)}</g>
<text x="96" y="48" fill="${C.lavanda}" font-family="${SANS}" font-size="19" font-weight="700">${esc(p.nome)}</text>
<g transform="translate(${420 - 22 - larguraTag} 30)"><rect width="${larguraTag}" height="24" rx="12" fill="${st.fundo}" stroke="${st.borda}"/><text x="${larguraTag / 2}" y="16.5" text-anchor="middle" fill="${st.texto}" font-family="${MONO}" font-size="12">${esc(p.status)}</text></g>
${desc}
${tecs}
<text x="${420 - 22}" y="166" text-anchor="end" fill="${C.roxoClaro}" font-family="${MONO}" font-size="11">${abrir}</text>`;
  return moldura(420, 180, `projeto-${p.id}`, conteudo, { estrelas: 14 });
}

const ICONES_CONTATO = {
  linkedin: (c) => `<rect x="-9" y="-9" width="18" height="18" rx="3.5" fill="${c}"/><text x="0" y="5" text-anchor="middle" fill="${C.fundo1}" font-family="${SANS}" font-size="12" font-weight="800">in</text>`,
  gmail: (c) => `<rect x="-10" y="-7" width="20" height="14" rx="2.5" fill="none" stroke="${c}" stroke-width="2"/><path d="M-9 -5 L0 2 L9 -5" fill="none" stroke="${c}" stroke-width="2"/>`,
  instagram: (c) => `<rect x="-9" y="-9" width="18" height="18" rx="5.5" fill="none" stroke="${c}" stroke-width="2"/><circle r="4.2" fill="none" stroke="${c}" stroke-width="2"/><circle cx="5" cy="-5" r="1.4" fill="${c}"/>`,
};

function botaoContato(ct) {
  const conteudo = `<g transform="translate(34 27)">${ICONES_CONTATO[ct.id](C.lavanda)}</g>
<text x="56" y="32" fill="${C.lavanda}" font-family="${MONO}" font-size="14" font-weight="700">${esc(ct.rotulo)}</text>`;
  return moldura(190, 54, `contato-${ct.id}`, conteudo, { estrelas: 4 }).replace('rx="18"', 'rx="27"');
}

// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆
// GRIMÓRIO (versão C4)
// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆

const SERIF = "'Cormorant Garamond','Palatino Linotype','Book Antiqua',Palatino,Georgia,serif";
const G = { pagina1: '#150a23', pagina2: '#21103a', capa: '#2a1240', tinta: '#e7c9ff', tinta2: '#b9a0d0', ouro: '#d9b3ff' };
const ESCOLAS = { 'Linguagens': 'Encantamentos', 'Web e apps': 'Ilusões', 'Dados e nuvem': 'Alquimia', 'Automação': 'Autômatos' };

function arabesco(x, y, largura, cor = C.roxoClaro) {
  const m = largura / 2;
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${cor}" stroke-width="1.2" stroke-linecap="round">
<path d="M${-m} 0 C${-m * 0.6} -6 ${-m * 0.35} 6 -12 0"/><path d="M${m} 0 C${m * 0.6} -6 ${m * 0.35} 6 12 0"/>
<path d="M0 -6 L6 0 L0 6 L-6 0Z" fill="${cor}"/></g>`;
}

function cantoneira(x, y, rot, cor = C.roxoClaro) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" fill="none" stroke="${cor}" stroke-width="1.3" stroke-linecap="round" opacity="0.8">
<path d="M0 22 L0 0 L22 0"/><path d="M5 18 C5 9 9 5 18 5"/><circle cx="9" cy="9" r="2" fill="${cor}"/></g>`;
}

function pagina(w, h, id, conteudo, { estrelas = 12, moldura = true, cantos = true } = {}) {
  const fundo = moldura ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10" fill="url(#${id}-papel)" stroke="${C.roxo}" stroke-width="1.5"/>
<rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="6" fill="none" stroke="${C.lavanda}" stroke-opacity="0.15"/>` : '';
  const quinas = cantos ? cantoneira(16, 16, 0) + cantoneira(w - 16, 16, 90) + cantoneira(w - 16, h - 16, 180) + cantoneira(16, h - 16, 270) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="${id}-papel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${G.pagina1}"/><stop offset="1" stop-color="${G.pagina2}"/></linearGradient>
  <filter id="${id}-luz" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
${fundo}
${quinas}
<g>${estrelasDeFundo(w, h, hashTexto(id), estrelas)}</g>
${conteudo}
</svg>`;
}

function sigilo(nome, r, cor) {
  const s = sorteio(hashTexto(nome));
  const lados = 3 + Math.floor(s() * 4);
  const giro = s() * Math.PI;
  const pts = [...Array(lados)].map((_, i) => {
    const a = giro + (i * 2 * Math.PI) / lados;
    return [(Math.cos(a) * r * 0.72).toFixed(1), (Math.sin(a) * r * 0.72).toFixed(1)];
  });
  const traco = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + 'Z';
  const raio = pts.filter(() => s() > 0.4).map(([x, y]) => `<line x1="0" y1="0" x2="${x}" y2="${y}"/>`).join('');
  return `<g fill="none" stroke="${cor}" stroke-width="1.2"><circle r="${r}"/><circle r="${(r * 0.25).toFixed(1)}"/><path d="${traco}"/>${raio}</g>`;
}

function runa(nome, cor) {
  const s = sorteio(hashTexto(nome) ^ 0x5bd1);
  const tracos = [...Array(3)].map(() => {
    const x1 = (s() * 8 - 4).toFixed(1), y1 = (s() * 10 - 5).toFixed(1), x2 = (s() * 8 - 4).toFixed(1), y2 = (s() * 10 - 5).toFixed(1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');
  return `<g fill="none" stroke="${cor}" stroke-width="1.3" stroke-linecap="round"><line x1="0" y1="-6" x2="0" y2="6"/>${tracos}</g>`;
}

function grimorioAbertura(d, r) {
  const avatar = readFileSync(join(AQUI, 'avatar.gif')).toString('base64');
  const anotacoes = [
    `${d.total} contribuições neste ano`,
    `${r.ativos} noites de estudo registradas`,
    `${d.repos} grimórios públicos`,
  ].map((t, i) => `<text x="74" y="${262 + i * 24}" fill="${G.tinta2}" font-family="${SERIF}" font-size="16" font-style="italic">✦ ${esc(t)}</text>`).join('');
  const frases = frasesDigitando(74, 196, PERFIL.frases).replace(/font-family="[^"]*"/g, `font-family="${SERIF}"`).replace(/font-size="16"/g, 'font-size="17" font-style="italic"');
  const cx = 627, cy = 196;
  const conteudo = `
<rect x="12" y="10" width="836" height="372" rx="14" fill="${G.capa}" stroke="${C.roxo}" stroke-width="1.5"/>
<rect x="30" y="24" width="398" height="342" rx="6" fill="url(#abertura-papel)"/>
<rect x="432" y="24" width="398" height="342" rx="6" fill="url(#abertura-papel)"/>
<rect x="420" y="24" width="20" height="342" fill="${G.pagina1}" opacity="0.9"/>
<line x1="430" y1="24" x2="430" y2="366" stroke="${C.preto || '#000'}" stroke-opacity="0.6" stroke-width="2"/>
<path d="M700 24 V392 L712 382 L724 392 V24Z" fill="${C.roxo}"/>
<text x="74" y="70" fill="${C.roxoClaro}" font-family="${MONO}" font-size="11" letter-spacing="3">CAPÍTULO I · @${esc(PERFIL.usuario).toUpperCase()}</text>
<text x="72" y="126" fill="${G.tinta}" font-family="${SERIF}" font-size="42" font-weight="700" filter="url(#abertura-luz)">${esc(PERFIL.saudacao)}</text>
${arabesco(229, 152, 300)}
${frases}
<text x="74" y="230" fill="${G.tinta2}" font-family="${SERIF}" font-size="15">aprendiz de Ciência da Computação, Sorocaba/SP</text>
${anotacoes}
<ellipse cx="${cx}" cy="${cy}" rx="104" ry="128" fill="${G.pagina1}" stroke="${C.roxoClaro}" stroke-width="2" filter="url(#abertura-luz)"/>
<ellipse cx="${cx}" cy="${cy}" rx="114" ry="138" fill="none" stroke="${C.lavanda}" stroke-opacity="0.25" stroke-dasharray="1 5"/>
<clipPath id="abertura-oval"><ellipse cx="${cx}" cy="${cy}" rx="98" ry="122"/></clipPath>
<image href="data:image/gif;base64,${avatar}" x="${cx - 70}" y="${cy - 70}" width="140" height="144" clip-path="url(#abertura-oval)" style="image-rendering:pixelated"/>
${arabesco(cx, cy - 146, 120)}${arabesco(cx, cy + 146, 120)}
<text x="${cx}" y="358" text-anchor="middle" fill="${G.tinta2}" font-family="${SERIF}" font-size="13" font-style="italic">retrato da autora</text>
<text x="229" y="358" text-anchor="middle" fill="${C.apagado}" font-family="${SERIF}" font-size="13">i</text>`;
  return pagina(860, 400, 'abertura', conteudo, { estrelas: 30, moldura: false, cantos: false });
}

function grimorioFeiticos() {
  const colunas = PERFIL.stack.map((g, i) => {
    const x = 48 + i * 200, nome = ESCOLAS[g.grupo] || g.grupo;
    const itens = g.itens.map((t, k) => `<g transform="translate(${x + 12} ${178 + k * 26})">${runa(t, C.roxoClaro)}</g><text x="${x + 28}" y="${183 + k * 26}" fill="${G.tinta}" font-family="${SERIF}" font-size="17">${esc(t)}</text>`).join('');
    return `<g transform="translate(${x + 80} 104)" filter="url(#feiticos-luz)">${sigilo(nome, 22, C.lavanda)}</g>
<text x="${x + 80}" y="150" text-anchor="middle" fill="${G.tinta}" font-family="${SERIF}" font-size="18" font-weight="700">${esc(nome)}</text>
<text x="${x + 80}" y="166" text-anchor="middle" fill="${C.apagado}" font-family="${MONO}" font-size="9" letter-spacing="1.5">${esc(g.grupo.toUpperCase())}</text>
${itens}`;
  }).join('');
  const conteudo = `
<text x="430" y="52" text-anchor="middle" fill="${G.tinta}" font-family="${SERIF}" font-size="26" font-weight="700">Livro de feitiços</text>
${arabesco(430, 68, 220)}
${colunas}`;
  return pagina(860, 330, 'feiticos', conteudo);
}

function lua(cx, cy, r, f, id) {
  if (f <= 0) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.lavanda}" stroke-opacity="0.22"/>`;
  const dx = (2 * r * f).toFixed(2);
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
<g clip-path="url(#${id})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${G.tinta}"/><circle cx="${(cx - Number(dx)).toFixed(2)}" cy="${cy}" r="${r}" fill="${G.pagina1}"/></g>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.lavanda}" stroke-opacity="0.35"/>`;
}

function grimorioLua(d, r) {
  const semanas = d.semanas.map((s) => s.reduce((t, x) => t + x.contributionCount, 0));
  const maximo = Math.max(1, ...semanas);
  const porLinha = Math.ceil(semanas.length / 2);
  const luas = semanas.map((t, i) => {
    const col = i % porLinha, lin = Math.floor(i / porLinha);
    const f = t ? Math.min(1, 0.25 + 0.75 * (t / maximo)) : 0;
    return lua(300 + col * 19.5, 112 + lin * 46, 7.5, f, `lua-${i}`);
  }).join('');
  let meses = '', ultimo = -1;
  d.semanas.forEach((s, i) => {
    const m = new Date(`${s[0].date}T12:00:00Z`).getUTCMonth();
    if (m !== ultimo) { ultimo = m; const col = i % porLinha, lin = Math.floor(i / porLinha); meses += `<text x="${300 + col * 19.5}" y="${136 + lin * 46}" text-anchor="middle" fill="${C.apagado}" font-family="${SERIF}" font-size="11" font-style="italic">${MESES[m]}</text>`; }
  });
  const conteudo = `
<text x="48" y="58" fill="${G.tinta}" font-family="${SERIF}" font-size="26" font-weight="700">Diário lunar</text>
<text x="48" y="80" fill="${G.tinta2}" font-family="${SERIF}" font-size="14" font-style="italic">cada lua é uma semana; quanto mais código, mais cheia</text>
<text x="48" y="140" fill="${G.tinta}" font-family="${SERIF}" font-size="44" font-weight="700" filter="url(#lua-luz)">${d.total}</text>
<text x="48" y="162" fill="${G.tinta2}" font-family="${SERIF}" font-size="14">contribuições no ano</text>
<text x="48" y="194" fill="${G.tinta2}" font-family="${SERIF}" font-size="14" font-style="italic">lua mais cheia: ${maximo} na semana</text>
<text x="48" y="214" fill="${G.tinta2}" font-family="${SERIF}" font-size="14" font-style="italic">maior sequência: ${r.maior} dia${r.maior === 1 ? '' : 's'}</text>
${luas}${meses}`;
  return pagina(860, 250, 'lua', conteudo);
}

function grimorioReceita(p, n) {
  const yIng = 98 + quebrar(p.descricao, 40).slice(0, 3).length * 18;
  const ingredientes = p.tecnologias.split(' · ').map((t, i) => `<text x="40" y="${yIng + 18 + i * 19}" fill="${G.tinta}" font-family="${SERIF}" font-size="15">· ${esc(t)}</text>`).join('');
  const desc = quebrar(p.descricao, 40).slice(0, 3).map((l, i) => `<text x="40" y="${86 + i * 18}" fill="${G.tinta2}" font-family="${SERIF}" font-size="14.5" font-style="italic">${esc(l)}</text>`).join('');
  const conteudo = `
<text x="40" y="44" fill="${C.apagado}" font-family="${MONO}" font-size="10" letter-spacing="2">RECEITA Nº ${n}</text>
<text x="40" y="68" fill="${G.tinta}" font-family="${SERIF}" font-size="22" font-weight="700">${esc(p.nome)}</text>
${desc}
<text x="40" y="${yIng}" fill="${C.roxoClaro}" font-family="${MONO}" font-size="10" letter-spacing="2">INGREDIENTES</text>
${ingredientes}
<g transform="translate(352 74)">
  <path d="M0 -34 C14 -36 30 -22 33 -6 C38 10 24 32 4 34 C-16 37 -34 22 -34 2 C-35 -16 -18 -33 0 -34Z" fill="${C.roxo}"/>
  <circle r="23" fill="none" stroke="${C.lavanda}" stroke-opacity="0.5"/>
  <g filter="url(#receita-${p.id}-luz)">${(EMBLEMAS[p.id] || EMBLEMAS.arcano)(C.lavanda)}</g>
</g>
<text x="352" y="132" text-anchor="middle" fill="${G.tinta2}" font-family="${SERIF}" font-size="14" font-style="italic">${esc(p.status)}</text>
<text x="380" y="236" text-anchor="end" fill="${C.roxoClaro}" font-family="${SERIF}" font-size="14" font-style="italic">${p.link.includes('github.com') ? 'abrir o grimório ↗' : 'abrir o app ↗'}</text>`;
  return pagina(420, 256, `receita-${p.id}`, conteudo, { estrelas: 8 });
}

function grimorioFim() {
  const conteudo = `
${arabesco(430, 40, 260)}
<text x="430" y="78" text-anchor="middle" fill="${G.tinta}" font-family="${SERIF}" font-size="26" font-weight="700">Vamos conversar?</text>
<text x="430" y="102" text-anchor="middle" fill="${G.tinta2}" font-family="${SERIF}" font-size="15" font-style="italic">estágio, projetos ou só trocar feitiços de código</text>`;
  return pagina(860, 126, 'fim', conteudo);
}

function contatoGrimorio(ct) {
  const conteudo = `<g transform="translate(34 27)">${ICONES_CONTATO[ct.id](G.tinta)}</g>
<text x="56" y="33" fill="${G.tinta}" font-family="${SERIF}" font-size="17" font-weight="700">${esc(ct.rotulo)}</text>`;
  return pagina(190, 54, `gcontato-${ct.id}`, conteudo, { estrelas: 3, cantos: false });
}

// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆

async function gerarGrimorio({ dados, r, CARDS, writeFileSync }) {
  writeFileSync(join(CARDS, 'grimorio-abertura.svg'), grimorioAbertura(dados, r));
  writeFileSync(join(CARDS, 'grimorio-feiticos.svg'), grimorioFeiticos());
  writeFileSync(join(CARDS, 'grimorio-lua.svg'), grimorioLua(dados, r));
  PERFIL.projetos.forEach((p, i) => writeFileSync(join(CARDS, `grimorio-receita-${p.id}.svg`), grimorioReceita(p, i + 1)));
  writeFileSync(join(CARDS, 'grimorio-fim.svg'), grimorioFim());
  for (const ct of PERFIL.contatos) writeFileSync(join(CARDS, `grimorio-contato-${ct.id}.svg`), contatoGrimorio(ct));
}

function cartaoRodape() {
  const conteudo = `
<text x="430" y="62" text-anchor="middle" fill="${C.lavanda}" font-family="${SANS}" font-size="24" font-weight="700" filter="url(#rodape-luz)">Vamos conversar?</text>
<text x="430" y="90" text-anchor="middle" fill="${C.suave}" font-family="${MONO}" font-size="12">estágio, projetos ou só trocar ideia sobre código ⋆˚✮</text>
${brilho(250, 52, 7, C.roxoClaro)}${brilho(610, 52, 7, C.roxoClaro)}`;
  return moldura(860, 116, 'rodape', conteudo, { estrelas: 30 });
}

// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆
// SAÍDA
// ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆ ⋆⭒˚.⋆

if (!TOKEN) {
  console.error('Falta GITHUB_TOKEN (no PC: GITHUB_TOKEN=$(gh auth token) node gerar/gerar.mjs).');
  process.exit(1);
}
const dados = await buscarDados();
const r = resumo(dados.semanas.flat());
mkdirSync(CARDS, { recursive: true });
writeFileSync(join(CARDS, 'topo.svg'), cartaoTopo(dados, r));
writeFileSync(join(CARDS, 'ceu.svg'), cartaoCeu(dados, r));
writeFileSync(join(CARDS, 'stack.svg'), cartaoStack());
for (const p of PERFIL.projetos) writeFileSync(join(CARDS, `projeto-${p.id}.svg`), cartaoProjeto(p));
for (const ct of PERFIL.contatos) writeFileSync(join(CARDS, `contato-${ct.id}.svg`), botaoContato(ct));
writeFileSync(join(CARDS, 'rodape.svg'), cartaoRodape());
gerarBento({ dados, r, CARDS, writeFileSync, perfil: PERFIL });
if (process.argv.includes('--ideias')) {
  const IDEIAS = join(AQUI, '..', 'ideias');
  mkdirSync(IDEIAS, { recursive: true });
  await gerarGrimorio({ dados, r, CARDS: IDEIAS, writeFileSync });
}
console.log(`cartões gerados: ${dados.total} contribuições, ${r.ativos} dias ativos, maior sequência ${r.maior}`);
