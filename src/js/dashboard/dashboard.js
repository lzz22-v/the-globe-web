import { supabase } from '../../config/supabase.js';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

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
    if (sidebarAvatar) sidebarAvatar.src = metadata?.avatar_url || DEFAULT_AVATAR;

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
