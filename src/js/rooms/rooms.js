import { supabase } from '../config/supabase.js';
import { openImageCropper } from '../utils/image-cropper.js';

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
const APP_NOTIFICATION_LOGO = new URL('../theGlobe-logo-colorida.png', import.meta.url).href;

// Estado global para guardar o usuário atual, sala em edição e pedidos
let currentUser = null;
let currentEditingRoom = null;
let croppedNewCoverFile = null;
let croppedNewWallpaperFile = null;
let croppedEditCoverFile = null;
let croppedEditWallpaperFile = null;
let requestSubscription = null;
let unreadMessagesSubscription = null;
let roomBroadcastChannels = [];
let unreadPollTimer = null;
let isSyncingUnread = false;
let ownedRoomTitles = new Map();
let cachedRooms = [];
const pendingJoinRequests = new Map();
const countedUnreadMessageIds = new Set();

// ==========================================
// 1.0. SINAL SONORO ELEGANTE E NOTIFICAÇÃO EM SEGUNDO PLANO
// ==========================================
let notificationAudioCtx = null;
let lastNotificationSoundAt = 0;
let notificationPermissionRequested = false;

function getNotificationAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!notificationAudioCtx) {
        notificationAudioCtx = new AudioCtx();
    }
    return notificationAudioCtx;
}

function requestBrowserNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default' && !notificationPermissionRequested) {
        notificationPermissionRequested = true;
        Notification.requestPermission().catch(() => {});
    }
}

function handleFirstUserInteraction() {
    const ctx = getNotificationAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    requestBrowserNotificationPermission();
}

['pointerdown', 'keydown', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, handleFirstUserInteraction, { passive: true });
});

function isPageInBackground() {
    return document.hidden || document.visibilityState !== 'visible' || !document.hasFocus();
}

function showBackgroundBrowserNotification({ room, rawMessage, unreadDelta = 1 }) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!isPageInBackground()) return;

    const roomTitle = room?.title || 'theGlobe';
    const senderName =
        rawMessage?.sender_name ||
        rawMessage?.user_name ||
        rawMessage?.author_name ||
        rawMessage?.username ||
        '';
    const rawContent = typeof rawMessage?.content === 'string' ? rawMessage.content.trim() : '';

    let bodyText = '';
    if (rawContent) {
        const preview = rawContent.length > 110 ? `${rawContent.slice(0, 107)}...` : rawContent;
        bodyText = senderName ? `${senderName}: ${preview}` : preview;
    } else if (senderName) {
        bodyText = `${senderName} enviou uma nova mensagem.`;
    } else {
        bodyText = unreadDelta > 1
            ? `Você tem ${unreadDelta} novas mensagens nesta sala.`
            : 'Você recebeu uma nova mensagem nesta sala.';
    }

    try {
        const notification = new Notification(roomTitle, {
            body: bodyText,
            icon: APP_NOTIFICATION_LOGO,
            badge: APP_NOTIFICATION_LOGO,
            tag: room?.id ? `theglobe-room-${room.id}` : 'theglobe-new-message',
            renotify: true,
            silent: true // O áudio já é reproduzido pelo nosso sintetizador Web Audio
        });

        notification.onclick = () => {
            try {
                window.focus();
            } catch {}
            notification.close();

            if (room?.id) {
                const roomKey = String(room.id);
                const previousReadTs = Number(getRoomLastReadMap()[roomKey] || 0);
                if (Number(room.unread_count || 0) > 0 && previousReadTs > 0) {
                    sessionStorage.setItem(`chatUnreadSince_${roomKey}`, String(previousReadTs));
                }
                const now = Date.now();
                markRoomAsUsed(room.id, now);
                markRoomAsRead(room.id, now);
                window.location.href = `chat.html?id=${room.id}`;
            }
        };
    } catch (error) {
        console.warn('Não foi possível exibir a notificação do navegador:', error);
    }
}

async function playNewMessageChime() {
    const nowMs = Date.now();
    if (nowMs - lastNotificationSoundAt < 450) return;

    const ctx = getNotificationAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch {
            return;
        }
    }

    lastNotificationSoundAt = nowMs;
    const start = ctx.currentTime + 0.015;

    // Arpejo harmônico cristalino (A5 -> C#6 -> E6) com brilho suave e cauda ressonante
    const notes = [
        { freq: 880.0, offset: 0.00, duration: 0.65, peak: 0.075, type: 'sine' },
        { freq: 1108.73, offset: 0.075, duration: 0.72, peak: 0.065, type: 'sine' },
        { freq: 1318.51, offset: 0.15, duration: 0.95, peak: 0.08, type: 'sine' },
        { freq: 2637.02, offset: 0.15, duration: 0.55, peak: 0.018, type: 'triangle' }
    ];

    notes.forEach(({ freq, offset, duration, peak, type }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = start + offset;
        const tEnd = t0 + duration;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t0);
        osc.stop(tEnd + 0.02);
    });
}

// ==========================================
// 1.1. CONTROLE DE ÚLTIMO USO E MENSAGENS NÃO LIDAS
// ==========================================
function getRoomUsageStorageKey() {
    return currentUser?.id ? `roomLastUsed_${currentUser.id}` : 'roomLastUsed';
}

function getRoomLastReadStorageKey() {
    return currentUser?.id ? `roomLastRead_${currentUser.id}` : 'roomLastRead';
}

function getStorageMap(key) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function getRoomLastUsedMap() {
    return getStorageMap(getRoomUsageStorageKey());
}

function getRoomLastReadMap() {
    return getStorageMap(getRoomLastReadStorageKey());
}

function markRoomAsUsed(roomId, timestamp = Date.now()) {
    if (!roomId) return;
    try {
        const map = getRoomLastUsedMap();
        map[String(roomId)] = Math.max(Number(map[String(roomId)] || 0), timestamp);
        localStorage.setItem(getRoomUsageStorageKey(), JSON.stringify(map));
    } catch (error) {
        console.warn('Não foi possível salvar o último acesso da sala:', error);
    }
}

function markRoomAsRead(roomId, timestamp = Date.now()) {
    if (!roomId) return;
    try {
        const map = getRoomLastReadMap();
        map[String(roomId)] = Math.max(Number(map[String(roomId)] || 0), timestamp);
        localStorage.setItem(getRoomLastReadStorageKey(), JSON.stringify(map));
    } catch (error) {
        console.warn('Não foi possível salvar a leitura da sala:', error);
    }
}

function sortRoomsByLastUsed(rooms) {
    const usageMap = getRoomLastUsedMap();
    const lastActiveRoomId = localStorage.getItem('lastRoomId');

    return [...rooms].sort((a, b) => {
        const aLastUsed = Number(usageMap[String(a.id)] || a.last_activity_at || 0);
        const bLastUsed = Number(usageMap[String(b.id)] || b.last_activity_at || 0);

        const aEffective = aLastUsed || (String(a.id) === String(lastActiveRoomId) ? 1 : 0);
        const bEffective = bLastUsed || (String(b.id) === String(lastActiveRoomId) ? 1 : 0);

        if (bEffective !== aEffective) {
            return bEffective - aEffective;
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });
}

function handleIncomingUnreadMessage(rawMessage) {
    if (!rawMessage || !currentUser) return;
    if (rawMessage.user_id === currentUser.id) return;

    const roomKey = String(rawMessage.room_id);
    const room = cachedRooms.find(r => String(r.id) === roomKey);
    if (!room) return;

    if (rawMessage.id) {
        const msgKey = `${roomKey}:${rawMessage.id}`;
        if (countedUnreadMessageIds.has(msgKey)) return;
        countedUnreadMessageIds.add(msgKey);
    }

    const readTs = Number(getRoomLastReadMap()[roomKey] || 0);
    const msgTs = Date.parse(rawMessage.created_at) || Date.now();
    if (msgTs <= readTs) return;

    room.unread_count = Number(room.unread_count || 0) + 1;
    room.last_activity_at = Math.max(Number(room.last_activity_at || 0), msgTs);
    markRoomAsUsed(room.id, msgTs);

    cachedRooms = sortRoomsByLastUsed(cachedRooms);
    renderRooms(cachedRooms);
    playNewMessageChime();
    showBackgroundBrowserNotification({ room, rawMessage, unreadDelta: 1 });
}

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
    croppedNewCoverFile = null;
    croppedNewWallpaperFile = null;
    dropzoneCover.querySelector('.upload-title').textContent = 'Clique ou arraste';
    dropzoneWallpaper.querySelector('.upload-title').textContent = 'Clique ou arraste';
}

btnCloseNewRoom.addEventListener('click', closeNewRoomModal);
btnCancelNewRoom.addEventListener('click', closeNewRoomModal);

dropzoneCover.addEventListener('click', () => inputCover.click());
dropzoneWallpaper.addEventListener('click', () => inputWallpaper.click());

inputCover.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cropped = await openImageCropper(file, {
        title: 'Cortar capa da sala',
        aspectRatio: 16 / 9,
        outputWidth: 800,
        outputHeight: 450
    });
    if (cropped) {
        croppedNewCoverFile = cropped.file;
        dropzoneCover.querySelector('.upload-title').textContent = cropped.file.name;
    } else if (!croppedNewCoverFile) {
        inputCover.value = '';
    }
});

inputWallpaper.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cropped = await openImageCropper(file, {
        title: 'Cortar wallpaper da sala',
        aspectRatio: 16 / 9,
        outputWidth: 1280,
        outputHeight: 720
    });
    if (cropped) {
        croppedNewWallpaperFile = cropped.file;
        dropzoneWallpaper.querySelector('.upload-title').textContent = cropped.file.name;
    } else if (!croppedNewWallpaperFile) {
        inputWallpaper.value = '';
    }
});


// --- EDITAR SALA ---
function openEditModal(room) {
    currentEditingRoom = room;
    croppedEditCoverFile = null;
    croppedEditWallpaperFile = null;
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
    croppedEditCoverFile = null;
    croppedEditWallpaperFile = null;
    currentEditingRoom = null;
}

btnCloseEditRoom.addEventListener('click', closeEditModal);
btnCancelEditRoom.addEventListener('click', closeEditModal);

editDropzoneCover.addEventListener('click', () => editInputCover.click());
editDropzoneWallpaper.addEventListener('click', () => editInputWallpaper.click());

editInputCover.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cropped = await openImageCropper(file, {
        title: 'Cortar nova capa da sala',
        aspectRatio: 16 / 9,
        outputWidth: 800,
        outputHeight: 450
    });
    if (cropped) {
        croppedEditCoverFile = cropped.file;
        editDropzoneCover.querySelector('.upload-title').textContent = cropped.file.name;
    } else if (!croppedEditCoverFile) {
        editInputCover.value = '';
    }
});

editInputWallpaper.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cropped = await openImageCropper(file, {
        title: 'Cortar novo wallpaper da sala',
        aspectRatio: 16 / 9,
        outputWidth: 1280,
        outputHeight: 720
    });
    if (cropped) {
        croppedEditWallpaperFile = cropped.file;
        editDropzoneWallpaper.querySelector('.upload-title').textContent = cropped.file.name;
    } else if (!croppedEditWallpaperFile) {
        editInputWallpaper.value = '';
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

    const fragment = document.createDocumentFragment();

    rooms.forEach(room => {
        const tags = room.tags || [];
        const tagsHTML = tags.map(tag => 
            `<span class="tag tag-${tag.color || 'purple'}">• ${tag.name}</span>`
        ).join('');

        const unreadCount = Number(room.unread_count || 0);
        const unreadBadgeHTML = unreadCount > 0
            ? `<span class="room-unread-badge" title="${unreadCount} mensage${unreadCount === 1 ? 'm' : 'ns'} não lida${unreadCount === 1 ? '' : 's'}">${unreadCount > 99 ? '99+' : unreadCount}</span>`
            : '';

        const card = document.createElement('div');
        card.className = `room-card${unreadCount > 0 ? ' has-unread' : ''}`;
        card.dataset.roomId = String(room.id);
        card.innerHTML = `
            <div class="room-image-wrapper">
                ${unreadBadgeHTML}
                <a href="chat.html?id=${room.id}" class="room-enter-link">
                    <img src="${room.image_url || 'https://placehold.co/800x450/1a1c23/9d4edd?text=Sem+Capa'}" alt="${room.title}" class="room-image" loading="lazy">
                </a>
                <div class="room-host-label"></div>
                <div class="room-tags">${tagsHTML}</div>
            </div>
            <div class="room-info">
                <div class="room-text">
                    <a href="chat.html?id=${room.id}" class="room-enter-link" style="text-decoration: none; color: inherit;">
                        <h3>${room.title}</h3>
                    </a>
                    <p>${room.members_count || 0} membros</p>
                </div>
                <button class="btn-edit-room" title="Editar Sala">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
            </div>
        `;

        const hostName = room.created_by_name || 'Anfitrião';
        card.querySelector('.room-host-label').textContent = `Criada por ${hostName}`;

        card.querySelectorAll('.room-enter-link').forEach(link => {
            link.addEventListener('click', () => {
                const roomKey = String(room.id);
                const previousReadTs = Number(getRoomLastReadMap()[roomKey] || 0);
                if (Number(room.unread_count || 0) > 0 && previousReadTs > 0) {
                    sessionStorage.setItem(`chatUnreadSince_${roomKey}`, String(previousReadTs));
                } else {
                    sessionStorage.removeItem(`chatUnreadSince_${roomKey}`);
                }

                const now = Date.now();
                markRoomAsUsed(room.id, now);
                markRoomAsRead(room.id, now);
                room.unread_count = 0;
            });
        });
        
        const editBtn = card.querySelector('.btn-edit-room');
        editBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            openEditModal(room);
        });

        fragment.appendChild(card);
    });
    
    roomsGrid.appendChild(fragment);
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

    sidebarName.textContent = metadata?.custom_name || metadata?.full_name || metadata?.name || 'Usuário theGlobe';
    sidebarEmail.textContent = currentUser.email;
    sidebarAvatar.src = metadata?.custom_avatar_url || metadata?.avatar_url || DEFAULT_AVATAR;

    fetchRooms();
}

async function hydrateLastActivityAndUnread(rooms, { notifyOnIncrease = false } = {}) {
    if (!rooms.length) return false;
    const usageMap = getRoomLastUsedMap();
    const readMap = getRoomLastReadMap();
    let hasChanges = false;
    const increasedRooms = [];

    await Promise.all(rooms.map(async room => {
        const roomKey = String(room.id);
        const localUsedTs = Number(usageMap[roomKey] || 0);
        const localReadTs = Number(readMap[roomKey] || 0);

        // Baseline de leitura: se o usuário nunca abriu a sala nesta máquina, usa o momento atual para não marcar histórico antigo como não lido
        let effectiveReadTs = localReadTs || localUsedTs;
        if (!effectiveReadTs) {
            effectiveReadTs = Date.now();
            markRoomAsRead(room.id, effectiveReadTs);
        }

        const sinceIso = new Date(effectiveReadTs).toISOString();

        const [{ data: latestMsg }, { data: unreadRows, error: unreadError }] = await Promise.all([
            supabase
                .from('messages')
                .select('created_at')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase
                .from('messages')
                .select('id, created_at')
                .eq('room_id', room.id)
                .neq('user_id', currentUser.id)
                .gt('created_at', sinceIso)
                .limit(100)
        ]);

        const lastMsgTs = latestMsg?.created_at ? Date.parse(latestMsg.created_at) : 0;
        const newLastActivity = Math.max(localUsedTs, Number.isFinite(lastMsgTs) ? lastMsgTs : 0);
        if (newLastActivity !== Number(room.last_activity_at || 0)) {
            room.last_activity_at = newLastActivity;
            hasChanges = true;
        }
        if (room.last_activity_at > localUsedTs) {
            markRoomAsUsed(room.id, room.last_activity_at);
        }

        const previousUnread = Number(room.unread_count || 0);
        const rows = unreadError ? [] : (unreadRows || []);
        rows.forEach(row => {
            if (row.id) countedUnreadMessageIds.add(`${roomKey}:${row.id}`);
        });

        const nextUnread = unreadError ? previousUnread : rows.length;
        if (nextUnread !== previousUnread) {
            if (nextUnread > previousUnread) {
                increasedRooms.push({ room, delta: nextUnread - previousUnread });
            }
            room.unread_count = nextUnread;
            hasChanges = true;
        }
    }));

    if (notifyOnIncrease && increasedRooms.length > 0) {
        playNewMessageChime();
        increasedRooms.forEach(({ room, delta }) => {
            showBackgroundBrowserNotification({ room, unreadDelta: delta });
        });
    }

    return hasChanges;
}

function setupUnreadMessagesListener(roomIds) {
    if (!roomIds || roomIds.length === 0) return;
    if (unreadMessagesSubscription) supabase.removeChannel(unreadMessagesSubscription);

    roomBroadcastChannels.forEach(channel => supabase.removeChannel(channel));
    roomBroadcastChannels = [];

    const roomIdSet = new Set(roomIds.map(String));

    // 1. Escuta alterações no banco (Postgres Changes)
    unreadMessagesSubscription = supabase
        .channel(`rooms_unread_${currentUser.id}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, payload => {
            const newMsg = payload.new;
            if (!newMsg || !roomIdSet.has(String(newMsg.room_id))) return;
            handleIncomingUnreadMessage(newMsg);
        })
        .subscribe();

    // 2. Escuta também o broadcast em tempo real enviado pelo chat.js de cada sala
    roomIds.forEach(roomId => {
        const channel = supabase
            .channel(`room_${roomId}_messages`, {
                config: { broadcast: { ack: false, self: false } }
            })
            .on('broadcast', { event: 'new_message' }, ({ payload }) => {
                if (payload?.message) {
                    handleIncomingUnreadMessage({
                        ...payload.message,
                        room_id: payload.message.room_id || roomId
                    });
                }
            })
            .subscribe();

        roomBroadcastChannels.push(channel);
    });

    // 3. Sincronização automática periódica de segurança (inclusive em segundo plano)
    if (unreadPollTimer) clearInterval(unreadPollTimer);
    unreadPollTimer = setInterval(async () => {
        if (isSyncingUnread || !cachedRooms.length) return;
        isSyncingUnread = true;
        try {
            const changed = await hydrateLastActivityAndUnread(cachedRooms, { notifyOnIncrease: true });
            if (changed) {
                cachedRooms = sortRoomsByLastUsed(cachedRooms);
                renderRooms(cachedRooms);
            }
        } finally {
            isSyncingUnread = false;
        }
    }, 4000);
}

async function fetchRooms() {
    try {
        // OTIMIZAÇÃO: Definindo apenas as colunas vitais para a tela de listagem/edição
        const roomFields = 'id, title, tags, members_count, image_url, wallpaper_url, created_by, created_at';

        // 1. Busca as salas que o usuário logado CRIOU
        const { data: myRooms, error: err1 } = await supabase
            .from('rooms')
            .select(roomFields)
            .eq('created_by', currentUser.id);

        if (err1) throw err1;

        // 2. Busca as salas em que o usuário FOI ACEITO (Membro)
        const { data: memberRoomsData, error: err2 } = await supabase
            .from('room_members')
            .select(`rooms(${roomFields})`)
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

        // Considera a última atividade registrada e contabiliza mensagens não lidas
        await hydrateLastActivityAndUnread(uniqueRooms);

        // Ordena da última sala usada para a mais antiga
        const sortedRooms = sortRoomsByLastUsed(uniqueRooms);

        // OTIMIZAÇÃO: Cache em memória para evitar o Problema N+1 (múltiplas queries para o mesmo usuário)
        const hostNameCache = new Map();
        const currentUserMetadata = currentUser.user_metadata;
        hostNameCache.set(currentUser.id, currentUserMetadata?.custom_name || currentUserMetadata?.full_name || currentUserMetadata?.name || 'Você');

        await Promise.all(sortedRooms.map(async room => {
            // Se o nome do anfitrião já estiver no cache, usa ele e aborta a query repetida
            if (hostNameCache.has(room.created_by)) {
                room.created_by_name = hostNameCache.get(room.created_by);
                return;
            }

            // Se não estiver no cache, faz a query e salva no cache para as próximas salas dele
            const { data: profiles, error: profileError } = await supabase.rpc('get_room_user_profiles', { p_room_id: room.id });
            const hostProfile = (profiles || []).find(profile => profile.user_id === room.created_by);
            const resolvedName = hostProfile?.display_name || 'Anfitrião';
            
            hostNameCache.set(room.created_by, resolvedName);
            room.created_by_name = resolvedName;
            
            if (profileError) console.error(`Não foi possível carregar o nome do anfitrião da sala ${room.id}.`, profileError);
        }));

        cachedRooms = sortedRooms;

        // Renderiza na tela
        renderRooms(cachedRooms);

        // Escuta novas mensagens em tempo real para atualizar as bolinhas
        setupUnreadMessagesListener(cachedRooms.map(r => r.id));

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

// Quando o usuário volta para a seção de salas (ex: saindo do chat ou alternando aba), sincroniza as bolinhas
window.addEventListener('pageshow', () => {
    if (cachedRooms.length > 0 && currentUser) {
        fetchRooms();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && cachedRooms.length > 0 && currentUser) {
        fetchRooms();
    }
});

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
            const userName = metadata?.custom_name || metadata?.full_name || metadata?.name || 'Usuário theGlobe';

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
        
        const coverFile = croppedNewCoverFile || inputCover.files[0];
        if (coverFile) {
            const fileExt = coverFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('rooms').upload(filePath, coverFile);
            if (uploadError) throw new Error("Falha ao enviar a imagem de capa.");
            
            const { data: publicUrlData } = supabase.storage.from('rooms').getPublicUrl(filePath);
            coverUrl = publicUrlData.publicUrl;
        }

        let wallpaperUrl = null;
        
        const wallpaperFile = croppedNewWallpaperFile || inputWallpaper.files[0];
        if (wallpaperFile) {
            const fileExtWall = wallpaperFile.name.split('.').pop();
            const fileNameWall = `wallpaper-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtWall}`;
            const filePathWall = `wallpapers/${fileNameWall}`;

            const { error: uploadErrorWall } = await supabase.storage.from('rooms').upload(filePathWall, wallpaperFile);
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
            }])
            .select('id')
            .single();

        if (error) throw error;
        if (data?.id) {
            const now = Date.now();
            markRoomAsUsed(data.id, now);
            markRoomAsRead(data.id, now);
        }
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

        const editCoverFile = croppedEditCoverFile || editInputCover.files[0];
        if (editCoverFile) {
            const fileExt = editCoverFile.name.split('.').pop();
            const fileName = `edit-cover-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('rooms').upload(filePath, editCoverFile);
            if (uploadError) throw new Error("Falha ao enviar a nova imagem de capa.");
            
            const { data: publicUrlData } = supabase.storage.from('rooms').getPublicUrl(filePath);
            finalCoverUrl = publicUrlData.publicUrl;
        }

        const editWallpaperFile = croppedEditWallpaperFile || editInputWallpaper.files[0];
        if (editWallpaperFile) {
            const fileExtWall = editWallpaperFile.name.split('.').pop();
            const fileNameWall = `edit-wallpaper-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtWall}`;
            const filePathWall = `wallpapers/${fileNameWall}`;

            const { error: uploadErrorWall } = await supabase.storage.from('rooms').upload(filePathWall, editWallpaperFile);
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
            const { data: deletedRoom, error: deleteError } = await supabase
                .from('rooms')
                .delete()
                .eq('id', currentEditingRoom.id)
                .eq('created_by', currentUser.id)
                .select('id')
                .maybeSingle();

            if (deleteError) throw deleteError;
            if (!deletedRoom) {
                throw new Error('A sala não foi excluída. Verifique a política de exclusão da tabela rooms no Supabase.');
            }

            console.log("✅ Sala excluída com sucesso.");
            closeEditModal();
            await fetchRooms();

        } catch (error) {
            console.error("Erro ao excluir sala:", error);
            alert(error.message || "Erro ao excluir a sala. Verifique sua conexão e tente novamente.");
            loadingOverlay.classList.add('hidden');
        }
    }
});

// Inicia o processo
initRooms();