const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resolução interna fixa
canvas.width = 800;
canvas.height = 400;

// --- RECURSOS ---
const musicaFundo = new Audio('assets/musica-fundo.mp3');
musicaFundo.loop = true;
let musicaIniciada = false;

const fundoImg = new Image();
fundoImg.src = 'assets/img-fundo.png';

// --- ESTADO DO JOGO ---
let scoreAranha = 0;
let scoreDuende = 0;
let jogoAtivo = true;

const aranha = {
    x: 100, y: 200, largura: 50, altura: 80,
    vida: 100, velX: 0, velY: 0, pulando: false,
    direcao: 1 // 1 para direita, -1 para esquerda
};

const duende = {
    x: 600, y: 200, largura: 50, altura: 80,
    vida: 100, velX: 0, velY: 0
};

let teias = [];
let bombas = [];
const keys = { a: false, d: false, w: false, f: false };

// --- FUNÇÕES DE APOIO ---
function iniciarSom() {
    if (!musicaIniciada) {
        musicaFundo.play().catch(() => { });
        musicaIniciada = true;
    }
}

function resetJogo() {
    aranha.vida = 100;
    duende.vida = 100;
    aranha.x = 100;
    duende.x = 600;
    aranha.velY = 0;
    teias = [];
    bombas = [];

    // Reset visual da interface
    document.getElementById('aranha-health').style.width = "100%";
    document.getElementById('duende-health').style.width = "100%";

    // Esconde o container de vitória
    const vitoriaContainer = document.getElementById('vitoria-msg-container');
    if (vitoriaContainer) vitoriaContainer.classList.add('hidden');

    jogoAtivo = true;
    requestAnimationFrame(loop);
}

// --- LÓGICA DE MOVIMENTO ---
function pular() {
    if (!aranha.pulando) {
        aranha.velY = -16;
        aranha.pulando = true;
        iniciarSom();
    }
}

function atirar() {
    teias.push({
        x: aranha.x + (aranha.direcao === 1 ? 50 : -10),
        y: aranha.y + 30,
        vX: aranha.direcao * 12
    });
    iniciarSom();
}

// --- LOOP PRINCIPAL ---
function loop() {
    if (!jogoAtivo) return;

    // 1. Limpar e Desenhar Fundo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (fundoImg.complete) {
        ctx.drawImage(fundoImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Gravidade e Chão
    [aranha, duende].forEach(p => {
        p.y += p.velY;
        if (p.y + p.altura < canvas.height - 20) {
            p.velY += 0.8;
        } else {
            p.velY = 0;
            p.y = canvas.height - 20 - p.altura;
            p.pulando = false;
        }
    });

    // 3. Movimento Homem-Aranha (A / D)
    if (keys.a) {
        aranha.velX = -6;
        aranha.direcao = -1;
    } else if (keys.d) {
        aranha.velX = 6;
        aranha.direcao = 1;
    } else {
        aranha.velX = 0;
    }
    aranha.x += aranha.velX;
    aranha.x = Math.max(0, Math.min(canvas.width - aranha.largura, aranha.x));

    // 4. IA Duende Verde
    const distancia = duende.x - aranha.x;
    if (distancia > 200) duende.x -= 2;
    else if (distancia < 150) duende.x += 2;

    if (Math.random() < 0.02) {
        bombas.push({
            x: duende.x,
            y: duende.y + 30,
            vX: duende.x > aranha.x ? -6 : 6,
            vY: -2
        });
    }

    // 5. Desenhar Personagens com Glow
    ctx.fillStyle = "#ff0000";
    ctx.shadowBlur = 15; ctx.shadowColor = "red";
    ctx.fillRect(aranha.x, aranha.y, aranha.largura, aranha.altura);

    ctx.fillStyle = "#39FF14";
    ctx.shadowColor = "#39FF14";
    ctx.fillRect(duende.x, duende.y, duende.largura, duende.altura);
    ctx.shadowBlur = 0;

    // 6. Processar Teias
    teias.forEach((t, i) => {
        t.x += t.vX;
        ctx.fillStyle = "cyan";
        ctx.fillRect(t.x, t.y, 15, 4);

        if (t.x > duende.x && t.x < duende.x + duende.largura && t.y > duende.y && t.y < duende.y + duende.altura) {
            duende.vida -= 5;
            document.getElementById('duende-health').style.width = Math.max(0, duende.vida) + "%";
            teias.splice(i, 1);
        }
        if (t.x < 0 || t.x > canvas.width) teias.splice(i, 1);
    });

    // 7. Processar Bombas
    bombas.forEach((b, i) => {
        b.x += b.vX;
        b.y += b.vY;
        b.vY += 0.1;

        ctx.fillStyle = "orange";
        ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill();

        if (b.x > aranha.x && b.x < aranha.x + aranha.largura && b.y > aranha.y && b.y < aranha.y + aranha.altura) {
            aranha.vida -= 10;
            document.getElementById('aranha-health').style.width = Math.max(0, aranha.vida) + "%";
            bombas.splice(i, 1);
        }
        if (b.y > canvas.height) bombas.splice(i, 1);
    });

    // 8. Condição de Vitória
    if (aranha.vida <= 0 || duende.vida <= 0) {
        jogoAtivo = false;
        const vitoriaContainer = document.getElementById('vitoria-msg-container');
        const vitoriaText = document.getElementById('vitoria-msg-text');

        if (aranha.vida > 0) {
            scoreAranha++;
            vitoriaText.innerText = "SPIDER-MAN WINS";
            vitoriaText.className = "vitoria-aranha";
        } else {
            scoreDuende++;
            vitoriaText.innerText = "GREEN GOBLIN WINS";
            vitoriaText.className = "vitoria-duende";
        }

        document.getElementById('score-aranha').innerText = scoreAranha;
        document.getElementById('score-duende').innerText = scoreDuende;

        if (vitoriaContainer) vitoriaContainer.classList.remove('hidden');

        setTimeout(resetJogo, 4000);
        return;
    }

    requestAnimationFrame(loop);
}

// --- CONTROLES (TECLADO) ---
window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    iniciarSom();
    if (key === 'a' || key === 'arrowleft') keys.a = true;
    if (key === 'd' || key === 'arrowright') keys.d = true;
    if (key === 'w' || key === 'arrowup') pular();
    if (key === 'f') atirar();
});

window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') keys.a = false;
    if (key === 'd' || key === 'arrowright') keys.d = false;
});

// --- CONTROLES (TOUCH/MOBILE) ---
const configurarBotao = (id, acaoStart, acaoEnd) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const start = (e) => { e.preventDefault(); iniciarSom(); acaoStart(); };
    const end = (e) => { e.preventDefault(); if (acaoEnd) acaoEnd(); };

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
};

configurarBotao('btn-esquerda', () => keys.a = true, () => keys.a = false);
configurarBotao('btn-direita', () => keys.d = true, () => keys.d = false);
configurarBotao('btn-pular', pular);
configurarBotao('btn-teia', atirar);

// Iniciar o loop
loop();