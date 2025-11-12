/* Chino IA — lógica principal (custom player + modal + validações + IA integrada) */

const loadingScreen = document.getElementById('loading-screen');
const addBtn = document.getElementById('add-btn');
const formPopup = document.getElementById('form-popup');
const closeForm = document.getElementById('close-form');
const cancelBtn = document.getElementById('cancel-btn');
const generateBtn = document.getElementById('generate-btn');
const premiumBtn = document.getElementById('premium-btn');
const musicContainer = document.getElementById('music-container');

let currentlyPlayingAudio = null;
let currentlyPlayingBtn = null;

/* ===============================
   🧠 CHAMADA À FUNÇÃO SERVERLESS
================================*/
async function gerarMusicaComIA(letra, estilo) {
  try {
    const resposta = await fetch("/.netlify/functions/gerar-musica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letra, estilo }),
    });

    const dados = await resposta.json();
    console.log("🎵 Resposta da API:", dados);

    if (dados.audio_url) {
      return dados.audio_url;
    } else {
      alert("Não foi possível gerar a música. Tente novamente.");
      return null;
    }
  } catch (erro) {
    console.error("Erro ao gerar música:", erro);
    alert("Erro ao gerar música. Veja o console para detalhes.");
    return null;
  }
}

/* ===============================
   ⚙️ Lógica da interface
================================*/

// hide loading after load
window.addEventListener('load', () => {
  setTimeout(()=> loadingScreen.style.display = 'none', 900);
});

// premium alert
premiumBtn.addEventListener('click', () => {
  alert('✨ Versão Premium chegando em breve! ✨');
});

// open/close form behavior
addBtn.addEventListener('click', () => {
  formPopup.classList.remove('hidden');
  formPopup.setAttribute('aria-hidden','false');
  addBtn.style.opacity = '0';
  addBtn.style.pointerEvents = 'none';
});

function closeFormFn(){
  formPopup.classList.add('hidden');
  formPopup.setAttribute('aria-hidden','true');
  setTimeout(()=> {
    addBtn.style.opacity = '1';
    addBtn.style.pointerEvents = 'auto';
  }, 180);
}

closeForm.addEventListener('click', closeFormFn);
cancelBtn.addEventListener('click', closeFormFn);

// criar card de música
function createMusicCard({title, style, lyrics, src}){
  const card = document.createElement('article');
  card.className = 'music-card';
  card.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <div class="meta"><strong>Estilo:</strong> ${escapeHtml(style)}</div>
    <div class="player">
      <button class="play-btn" aria-label="Play">▶</button>
      <div class="progress">
        <input type="range" min="0" max="100" value="0">
        <div class="time">0:00</div>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn-download">Baixar</button>
      <button class="btn-delete">Apagar</button>
    </div>
  `;

  const audio = document.createElement('audio');
  audio.src = src || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  audio.preload = 'metadata';
  audio.style.display = 'none';
  card.appendChild(audio);

  const playBtn = card.querySelector('.play-btn');
  const range = card.querySelector('input[type="range"]');
  const timeBox = card.querySelector('.time');
  const downloadBtn = card.querySelector('.btn-download');
  const deleteBtn = card.querySelector('.btn-delete');

  playBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
      currentlyPlayingAudio.pause();
      if (currentlyPlayingBtn) {
        currentlyPlayingBtn.classList.remove('playing');
        currentlyPlayingBtn.textContent = '▶';
      }
    }

    if (audio.paused) {
      try { await audio.play(); } catch (err) {}
      playBtn.classList.add('playing');
      playBtn.textContent = '⏹️';
      currentlyPlayingAudio = audio;
      currentlyPlayingBtn = playBtn;
    } else {
      audio.pause();
      playBtn.classList.remove('playing');
      playBtn.textContent = '▶';
      currentlyPlayingAudio = null;
      currentlyPlayingBtn = null;
    }
  });

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / Math.max(audio.duration,1)) * 100;
    range.value = Math.floor(pct);
    timeBox.textContent = formatTime(audio.currentTime) + ' / ' + (isNaN(audio.duration) ? '0:00' : formatTime(audio.duration));
  });

  range.addEventListener('input', () => {
    if (!audio.duration) return;
    const pct = range.value / 100;
    audio.currentTime = pct * audio.duration;
  });

  audio.addEventListener('ended', () => {
    playBtn.classList.remove('playing');
    playBtn.textContent = '▶';
    currentlyPlayingAudio = null;
    currentlyPlayingBtn = null;
  });

  downloadBtn.addEventListener('click', async () => {
    try {
      downloadBtn.disabled = true;
      downloadBtn.textContent = 'Baixando...';
      const resp = await fetch(audio.src);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (title || 'chino-music').replace(/[^a-z0-9_\-]/gi, '_').toLowerCase() + '.mp3';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Falha ao baixar. Tente novamente.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Baixar';
    }
  });

  deleteBtn.addEventListener('click', () => {
    if (currentlyPlayingAudio === audio) {
      audio.pause();
      currentlyPlayingAudio = null; 
      if (currentlyPlayingBtn) { currentlyPlayingBtn.classList.remove('playing'); currentlyPlayingBtn.textContent='▶'; }
    }
    card.remove();
  });

  return card;
}

function formatTime(s){
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s/60);
  const sec = Math.floor(s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}

function escapeHtml(str){
  return (str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* GERAR MÚSICA (com IA agora 🎵) */
generateBtn.addEventListener('click', async () => {
  const title = document.getElementById('music-title').value.trim();
  const style = document.getElementById('music-style').value.trim();
  const lyrics = document.getElementById('music-lyrics').value.trim();

  if (title.length < 3) { alert('O título precisa ter pelo menos 3 caracteres.'); return; }
  if (lyrics.length < 10) { alert('A letra precisa ter pelo menos 10 caracteres.'); return; }
  if (!style) { alert('Escolha um estilo de música.'); return; }

  formPopup.classList.add('hidden');
  loadingScreen.style.display = 'flex';

  const audioUrl = await gerarMusicaComIA(lyrics, style);
  loadingScreen.style.display = 'none';

  if (!audioUrl) return;

  const card = createMusicCard({ title, style, lyrics, src: audioUrl });
  musicContainer.prepend(card);

  document.getElementById('music-title').value = '';
  document.getElementById('music-style').value = '';
  document.getElementById('music-lyrics').value = '';

  setTimeout(()=> {
    addBtn.style.opacity = '1';
    addBtn.style.pointerEvents = 'auto';
  }, 150);
});

formPopup.addEventListener('click', (e) => {
  if (e.target === formPopup) closeFormFn();
});
