import { supabase } from '../config/supabase.js';

// ==========================================
// 1. MAPEAMENTO DE ELEMENTOS
// ==========================================
// Sidebar
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const sidebarAvatar = document.getElementById('sidebar-avatar');

// Grid de Salas
const roomsGrid = document.getElementById('rooms-grid');
const roomsCount = document.getElementById('rooms-count');
const loadingOverlay = document.getElementById('loading-overlay');

// Modal Nova Sala
const btnNewRoom = document.getElementById('btn-new-room');
const modalNewRoom = document.getElementById('new-room-modal');
const btnCloseNewRoom = document.getElementById('btn-close-new-room');
const btnCancelNewRoom = document.getElementById('btn-cancel-new-room');
const formNewRoom = document.getElementById('form-new-room');
const roomNameInput = document.getElementById('room-name');
const toggleRoleplay = document.getElementById('toggle-roleplay');
const toggleDisplay = document.getElementById('toggle-display');
const dropzoneCover = document.getElementById('dropzone-cover');
const inputCover = document.getElementById('input-cover');
const dropzoneWallpaper = document.getElementById('dropzone-wallpaper');
const inputWallpaper = document.getElementById('input-wallpaper');

// Modal Editar Sala
const modalEditRoom = document.getElementById('edit-room-modal');
const formEditRoom = document.getElementById('form-edit-room');
const editRoomId = document.getElementById('edit-room-id');
const editRoomNameInput = document.getElementById('edit-room-name');
const editDropzoneCover = document.getElementById('edit-dropzone-cover');
const editInputCover = document.getElementById('edit-input-cover');
const editDropzoneWallpaper = document.getElementById('edit-dropzone-wallpaper');
const editInputWallpaper = document.getElementById('edit-input-wallpaper');
const btnCloseEditRoom = document.getElementById('btn-close-edit-room');
const btnCancelEditRoom = document.getElementById('btn-cancel-edit-room');
const btnDeleteRoom = document.getElementById('btn-delete-room');

// Elementos - Sistema de Convite
const inviteCodeInput = document.getElementById('invite-code-input');
const btnJoinRoom = document.getElementById('btn-join-room');
const notificationsTab = document.getElementById('notifications-tab');
const notificationCount = document.getElementById('notification-count');
const notificationsPanel = document.getElementById('notifications-panel');
const notificationsList = document.getElementById('notifications-list');

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// Estado global para guardar o usuário atual, sala em edição e pedidos
let currentUser = null;
let currentEditingRoom = null;
let requestSubscription = null;
let ownedRoomTitles = new Map();
const pendingJoinRequests = new Map();

// ==========================================
// 2. LÓGICA DOS MODAIS (UI / Eventos)
// ==========================================

// --- NOVA SALA ---
btnNewRoom.addEventListener('click', () => {
    modalNewRoom.classList.remove('hidden');
});

function closeNewRoomModal() {
    modalNewRoom.classList.add('hidden');
    formNewRoom.reset();
    dropzoneCover.querySelector('.upload-title').textContent = 'Clique ou arraste';
    dropzoneWallpaper.querySelector('.upload-title').textContent = 'Clique ou arraste';
}

btnCloseNewRoom.addEventListener('click', closeNewRoomModal);
btnCancelNewRoom.addEventListener('click', closeNewRoomModal);

dropzoneCover.addEventListener('click', () => inputCover.click());
dropzoneWallpaper.addEventListener('click', () => inputWallpaper.click());

inputCover.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        dropzoneCover.querySelector('.upload-title').textContent = e.target.files[0].name;
    }
});

inputWallpaper.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        dropzoneWallpaper.querySelector('.upload-title').textContent = e.target.files[0].name;
    }
});


// --- EDITAR SALA ---
function openEditModal(room) {
    currentEditingRoom = room;
    editRoomId.value = room.id;
    editRoomNameInput.value = room.title;
    
    // Reseta textos dos inputs de arquivo para edição
    editDropzoneCover.querySelector('.upload-title').textContent = 'Alterar capa';
    editDropzoneWallpaper.querySelector('.upload-title').textContent = 'Alterar wallpaper';
    formEditRoom.reset(); 
    editRoomNameInput.value = room.title;

    // Lógica para mostrar/esconder botão de exclusão
    if (currentUser && room.created_by === currentUser.id) {
        btnDeleteRoom.classList.remove('hidden');
    } else {
        btnDeleteRoom.classList.add('hidden');
    }

    modalEditRoom.classList.remove('hidden');
}

function closeEditModal() {
    modalEditRoom.classList.add('hidden');
    formEditRoom.reset();
    currentEditingRoom = null;
}

btnCloseEditRoom.addEventListener('click', closeEditModal);
btnCancelEditRoom.addEventListener('click', closeEditModal);

editDropzoneCover.addEventListener('click', () => editInputCover.click());
editDropzoneWallpaper.addEventListener('click', () => editInputWallpaper.click());

editInputCover.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        editDropzoneCover.querySelector('.upload-title').textContent = e.target.files[0].name;
    }
});

editInputWallpaper.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        editDropzoneWallpaper.querySelector('.upload-title').textContent = e.target.files[0].name;
    }
});

// ==========================================
// 3. FUNÇÕES DE RENDERIZAÇÃO
// ==========================================
function renderRooms(rooms) {
    roomsGrid.innerHTML = '';
    
    if (!rooms || rooms.length === 0) {
        roomsCount.textContent = '0 salas ativas';
        roomsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-panel); border: 1px dashed var(--border-color); border-radius: 12px;">
                <h3 style="color: var(--text-light); margin-bottom: 0.5rem; font-weight: 600;">Nenhuma sala encontrada</h3>
                <p>Você ainda não participa de nenhuma sala. Crie um novo universo para começar!</p>
            </div>
        `;
        return;
    }

    roomsCount.textContent = `${rooms.length} sala${rooms.length !== 1 ? 's' : ''} ativa${rooms.length !== 1 ? 's' : ''}`;

    rooms.forEach(room => {
        const tags = room.tags || [];
        const tagsHTML = tags.map(tag => 
            `<span class="tag tag-${tag.color || 'purple'}">• ${tag.name}</span>`
        ).join('');

        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="room-image-wrapper">
                <a href="chat.html?id=${room.id}">
                    <img src="${room.image_url || 'https://placehold.co/800x450/1a1c23/9d4edd?text=Sem+Capa'}" alt="${room.title}" class="room-image">
                </a>
                <div class="room-host-label"></div>
                <div class="room-tags">${tagsHTML}</div>
            </div>
            <div class="room-info">
                <div class="room-text">
                    <a href="chat.html?id=${room.id}" style="text-decoration: none; color: inherit;">
                        <h3>${room.title}</h3>
                    </a>
                    <p>${room.members_count || 0} membros</p>
                </div>
                <button class="btn-edit-room" title="Editar Sala">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
            </div>
        `;

        const hostName = room.created_by_name || room.creator_name || room.host_name ||
            (room.created_by === currentUser.id
                ? (currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'Você')
                : 'Anfitrião');
        card.querySelector('.room-host-label').textContent = `Criada por ${hostName}`;
        
        const editBtn = card.querySelector('.btn-edit-room');
        editBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            openEditModal(room);
        });

        roomsGrid.appendChild(card);
    });
}

// ==========================================
// 4. BANCO DE DADOS (BUSCAR, CRIAR, EDITAR, DELETAR)
// ==========================================
async function initRooms() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        window.location.replace('index.html');
        return;
    }

    currentUser = session.user;
    const metadata = currentUser.user_metadata;

    sidebarName.textContent = metadata?.full_name || metadata?.name || 'Usuário theGlobe';
    sidebarEmail.textContent = currentUser.email;
    sidebarAvatar.src = metadata?.avatar_url || DEFAULT_AVATAR;

    fetchRooms();
}

async function fetchRooms() {
    try {
        // 1. Busca as salas que o usuário logado CRIOU
        const { data: myRooms, error: err1 } = await supabase
            .from('rooms')
            .select('*')
            .eq('created_by', currentUser.id);

        if (err1) throw err1;

        // 2. Busca as salas em que o usuário FOI ACEITO (Membro)
        const { data: memberRoomsData, error: err2 } = await supabase
            .from('room_members')
            .select('rooms(*)')
            .eq('user_id', currentUser.id);

        if (err2) throw err2;

        // Extrai os dados das salas da tabela de membros
        const joinedRooms = memberRoomsData
            .map(mr => mr.rooms)
            .filter(r => r !== null);

        // 3. Junta as salas criadas e as salas membro em uma única lista
        const allRooms = [...myRooms, ...joinedRooms];
        
        // Remove duplicatas (caso ele seja criador e tenha sido inserido como membro por engano)
        const uniqueRooms = Array.from(new Map(allRooms.map(r => [r.id, r])).values());

        // Ordena da mais nova para a mais antiga
        uniqueRooms.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // O cliente Auth conhece o próprio nome, mas não pode ler os metadados
        // privados dos outros usuários. A RPC retorna somente perfis da sala.
        await Promise.all(uniqueRooms.map(async room => {
            if (room.created_by === currentUser.id) {
                room.created_by_name = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'Você';
                return;
            }
            const { data: profiles, error: profileError } = await supabase.rpc('get_room_user_profiles', { p_room_id: room.id });
            const hostProfile = (profiles || []).find(profile => profile.user_id === room.created_by);
            if (hostProfile?.display_name) room.created_by_name = hostProfile.display_name;
            if (profileError) console.error(`Não foi possível carregar o nome do anfitrião da sala ${room.id}.`, profileError);
        }));

        // Renderiza na tela
        renderRooms(uniqueRooms);

        // Prepara a escuta de pedidos para as salas que ELE criou
        const myOwnedRoomIds = myRooms.map(r => r.id);
        ownedRoomTitles = new Map(myRooms.map(room => [room.id, room.title]));
        setupHostListener(myOwnedRoomIds);
        await loadPendingJoinRequests(myOwnedRoomIds);

    } catch (error) {
        console.error("Erro ao carregar salas:", error);
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

// --- SISTEMA DE PEDIDOS DE ENTRADA ---
async function loadPendingJoinRequests(roomIds) {
    if (!roomIds.length) {
        renderJoinRequests();
        return;
    }

    const { data, error } = await supabase
        .from('room_requests')
        .select('*')
        .in('room_id', roomIds)
        .eq('status', 'pending');
    if (error) {
        console.error('Erro ao carregar solicitações pendentes:', error);
        return;
    }
    (data || []).forEach(request => pendingJoinRequests.set(request.id, request));
    renderJoinRequests();
}

function renderJoinRequests() {
    if (!notificationsList) return;
    const requests = [...pendingJoinRequests.values()];
    notificationCount.textContent = String(requests.length);
    notificationCount.classList.toggle('has-notifications', requests.length > 0);
    notificationsList.innerHTML = '';

    if (!requests.length) {
        const empty = document.createElement('p');
        empty.className = 'notifications-empty';
        empty.textContent = 'Você não tem solicitações pendentes.';
        notificationsList.appendChild(empty);
        return;
    }

    requests.forEach(request => {
        const item = document.createElement('article');
        item.className = 'notification-request';
        const details = document.createElement('div');
        details.className = 'notification-request-details';
        const name = document.createElement('strong');
        name.textContent = request.user_name || 'Um usuário';
        const room = document.createElement('span');
        room.textContent = `Solicitou entrada em “${ownedRoomTitles.get(request.room_id) || 'sua sala'}”.`;
        details.append(name, room);

        const actions = document.createElement('div');
        actions.className = 'notification-request-actions';
        [['Rejeitar', 'rejected', 'notification-reject'], ['Aceitar', 'accepted', 'notification-accept']].forEach(([label, status, className]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.textContent = label;
            button.dataset.requestAction = status;
            button.dataset.requestId = request.id;
            actions.appendChild(button);
        });
        item.append(details, actions);
        notificationsList.appendChild(item);
    });
}

async function resolveJoinRequest(requestId, status, button) {
    const request = pendingJoinRequests.get(requestId);
    if (!request) return;
    button.disabled = true;

    try {
        if (status === 'accepted') {
            const { error: memberError } = await supabase.from('room_members').insert([{
                room_id: request.room_id,
                user_id: request.user_id
            }]);
            if (memberError && memberError.code !== '23505') throw memberError;
        }

        const { error } = await supabase.from('room_requests')
            .update({ status }).eq('id', request.id).eq('status', 'pending');
        if (error) throw error;
        pendingJoinRequests.delete(request.id);
        renderJoinRequests();
    } catch (error) {
        console.error('Erro ao responder à solicitação:', error);
        alert('Não foi possível atualizar a solicitação. Tente novamente.');
        button.disabled = false;
    }
}

notificationsTab.addEventListener('click', () => {
    const isOpen = notificationsTab.getAttribute('aria-expanded') === 'true';
    notificationsTab.setAttribute('aria-expanded', String(!isOpen));
    notificationsPanel.classList.toggle('hidden', isOpen);
});

notificationsList.addEventListener('click', event => {
    const button = event.target.closest('[data-request-action]');
    if (button) resolveJoinRequest(button.dataset.requestId, button.dataset.requestAction, button);
});

if (btnJoinRoom) {
    btnJoinRoom.addEventListener('click', async () => {
        const code = inviteCodeInput.value.trim().toUpperCase();
        if (code.length !== 6) {
            alert("O código deve ter exatos 6 caracteres.");
            return;
        }

        try {
            loadingOverlay.querySelector('#loading-message').textContent = "Verificando código...";
            loadingOverlay.classList.remove('hidden');

            // 1. Busca a sala pelo código
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .select('id, title')
                .eq('invite_code', code)
                .single();

            if (roomError || !room) {
                throw new Error("Sala não encontrada. Verifique o código e tente novamente.");
            }

            const metadata = currentUser.user_metadata;
            const userName = metadata?.full_name || metadata?.name || 'Usuário theGlobe';

            // 2. Cria o pedido na tabela room_requests
            const { error: reqError } = await supabase
                .from('room_requests')
                .insert([{
                    room_id: room.id,
                    user_id: currentUser.id,
                    user_name: userName,
                    status: 'pending'
                }]);

            if (reqError) throw reqError;

            alert(`Pedido enviado para a sala "${room.title}"! Aguarde o anfitrião aceitar.`);
            inviteCodeInput.value = '';

        } catch (error) {
            console.error(error);
            alert(error.message || "Erro ao solicitar entrada na sala.");
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });
}

function setupHostListener(myRoomIds) {
    if (!myRoomIds || myRoomIds.length === 0) return;
    if (requestSubscription) supabase.removeChannel(requestSubscription);

    requestSubscription = supabase
        .channel('host_requests_channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'room_requests'
        }, payload => {
            const newReq = payload.new;
            if (newReq.status === 'pending' && myRoomIds.includes(newReq.room_id)) {
                pendingJoinRequests.set(newReq.id, newReq);
                renderJoinRequests();
            }
        })
        .subscribe((status, error) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Falha ao receber solicitações em tempo real:', status, error);
            }
        });
}

// CRIAR SALA
formNewRoom.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    loadingOverlay.querySelector('#loading-message').textContent = "Criando sala...";
    loadingOverlay.classList.remove('hidden');

    try {
        const title = roomNameInput.value;
        const tags = [];
        
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        if (toggleRoleplay.checked) tags.push({ name: "Encenação", color: "purple" });
        if (toggleDisplay.checked) tags.push({ name: "Exibição", color: "blue" });

        let coverUrl = 'https://placehold.co/800x450/1a1c23/9d4edd?text=Sem+Capa'; 
        
        if (inputCover.files.length > 0) {
            const file = inputCover.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('rooms').upload(filePath, file);
            if (uploadError) throw new Error("Falha ao enviar a imagem de capa.");
            
            const { data: publicUrlData } = supabase.storage.from('rooms').getPublicUrl(filePath);
            coverUrl = publicUrlData.publicUrl;
        }

        let wallpaperUrl = null;
        
        if (inputWallpaper.files.length > 0) {
            const fileWall = inputWallpaper.files[0];
            const fileExtWall = fileWall.name.split('.').pop();
            const fileNameWall = `wallpaper-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtWall}`;
            const filePathWall = `wallpapers/${fileNameWall}`;

            const { error: uploadErrorWall } = await supabase.storage.from('rooms').upload(filePathWall, fileWall);
            if (uploadErrorWall) throw new Error("Falha ao enviar a imagem de wallpaper.");
            
            const { data: publicUrlDataWall } = supabase.storage.from('rooms').getPublicUrl(filePathWall);
            wallpaperUrl = publicUrlDataWall.publicUrl;
        }

        const { data, error } = await supabase
            .from('rooms')
            .insert([{ 
                title: title, 
                tags: tags,
                members_count: 1, 
                image_url: coverUrl,
                wallpaper_url: wallpaperUrl,
                invite_code: inviteCode,
                created_by: currentUser.id
            }]);

        if (error) throw error;
        console.log("✅ Sala criada!");

        closeNewRoomModal();
        await fetchRooms();
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        alert("Não foi possível criar a sala.");
        loadingOverlay.classList.add('hidden');
    }
});

// ATUALIZAR SALA
formEditRoom.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    loadingOverlay.querySelector('#loading-message').textContent = "Salvando alterações...";
    loadingOverlay.classList.remove('hidden');

    try {
        const roomId = editRoomId.value;
        const newTitle = editRoomNameInput.value;
        
        let finalCoverUrl = currentEditingRoom.image_url;
        let finalWallpaperUrl = currentEditingRoom.wallpaper_url;

        if (editInputCover.files.length > 0) {
            const file = editInputCover.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `edit-cover-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('rooms').upload(filePath, file);
            if (uploadError) throw new Error("Falha ao enviar a nova imagem de capa.");
            
            const { data: publicUrlData } = supabase.storage.from('rooms').getPublicUrl(filePath);
            finalCoverUrl = publicUrlData.publicUrl;
        }

        if (editInputWallpaper.files.length > 0) {
            const fileWall = editInputWallpaper.files[0];
            const fileExtWall = fileWall.name.split('.').pop();
            const fileNameWall = `edit-wallpaper-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtWall}`;
            const filePathWall = `wallpapers/${fileNameWall}`;

            const { error: uploadErrorWall } = await supabase.storage.from('rooms').upload(filePathWall, fileWall);
            if (uploadErrorWall) throw new Error("Falha ao enviar o novo wallpaper.");
            
            const { data: publicUrlDataWall } = supabase.storage.from('rooms').getPublicUrl(filePathWall);
            finalWallpaperUrl = publicUrlDataWall.publicUrl;
        }

        const { error: updateError } = await supabase
            .from('rooms')
            .update({ 
                title: newTitle,
                image_url: finalCoverUrl,
                wallpaper_url: finalWallpaperUrl
            })
            .eq('id', roomId);

        if (updateError) throw updateError;
        
        console.log("✅ Sala atualizada!");
        closeEditModal();
        await fetchRooms();

    } catch (error) {
        console.error("Erro ao atualizar sala:", error);
        alert("Não foi possível salvar as alterações.");
        loadingOverlay.classList.add('hidden');
    }
});

// EXCLUIR SALA
btnDeleteRoom.addEventListener('click', async () => {
    if (!currentEditingRoom) return;

    if (currentEditingRoom.created_by !== currentUser.id) {
        alert("Você não tem permissão para excluir esta sala.");
        return;
    }

    const confirmed = confirm(`Tem certeza que deseja excluir a sala "${currentEditingRoom.title}"?\nEsta ação apagará a sala para todos os membros e não pode ser desfeita.`);
    
    if (confirmed) {
        loadingOverlay.querySelector('#loading-message').textContent = "Excluindo sala...";
        loadingOverlay.classList.remove('hidden');

        try {
            const { error: deleteError } = await supabase
                .from('rooms')
                .delete()
                .eq('id', currentEditingRoom.id);

            if (deleteError) throw deleteError;

            console.log("✅ Sala excluída com sucesso.");
            closeEditModal();
            await fetchRooms();

        } catch (error) {
            console.error("Erro ao excluir sala:", error);
            alert("Erro ao excluir a sala. Verifique sua conexão e tente novamente.");
            loadingOverlay.classList.add('hidden');
        }
    }
});

// Inicia o processo
initRooms();
