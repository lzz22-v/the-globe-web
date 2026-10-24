import { supabase } from '../../config/supabase.js';

// ==========================================
// 1. MAPEAMENTO DE ELEMENTOS DO DOM
// ==========================================
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const sidebarAvatar = document.getElementById('sidebar-avatar');

const roomsGrid = document.getElementById('rooms-grid') || document.getElementById('rooms-list');
const btnCreateRoom = document.getElementById('btn-create-room');
const btnLogout = document.getElementById('btn-logout');

let currentUser = null;

// ==========================================
// 2. INICIALIZAÇÃO DA SESSÃO
// ==========================================
async function initDashboard() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        window.location.replace('index.html');
        return;
    }

    currentUser = session.user;
    const metadata = currentUser.user_metadata;

    if (sidebarName) sidebarName.textContent = metadata?.full_name || metadata?.name || 'Usuário';
    if (sidebarEmail) sidebarEmail.textContent = currentUser.email || '';
    if (sidebarAvatar) sidebarAvatar.src = metadata?.avatar_url || 'https://i.pravatar.cc/150?img=32';

    await loadRooms();
    setupEventListeners();
}

// ==========================================
// 3. BUSCAR E RENDERIZAR SALAS
// ==========================================
async function loadRooms() {
    if (!roomsGrid) return;

    const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar salas:', error);
        return;
    }

    renderRooms(rooms || []);
}

function renderRooms(rooms) {
    roomsGrid.innerHTML = '';

    if (rooms.length === 0) {
        roomsGrid.innerHTML = '<p class="empty-state">Nenhuma sala criada ainda. Crie a primeira sala!</p>';
        return;
    }

    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="room-info">
                <h3>${room.title}</h3>
            </div>
            <button class="btn-enter-room" data-id="${room.id}">Entrar na Sala</button>
        `;

        card.addEventListener('click', () => {
            window.location.href = `chat.html?id=${room.id}`;
        });

        roomsGrid.appendChild(card);
    });
}

// ==========================================
// 4. CRIAR SALA E LOGOUT
// ==========================================
async function handleCreateRoom() {
    const title = prompt('Digite o nome da nova sala:');
    if (!title || !title.trim()) return;

    const { data, error } = await supabase
        .from('rooms')
        .insert({
            title: title.trim(),
            created_by: currentUser.id
        })
        .select()
        .single();

    if (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar a sala. Tente novamente.');
        return;
    }

    window.location.href = `chat.html?id=${data.id}`;
}

function setupEventListeners() {
    if (btnCreateRoom) {
        btnCreateRoom.addEventListener('click', handleCreateRoom);
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.replace('index.html');
        });
    }
}

initDashboard();