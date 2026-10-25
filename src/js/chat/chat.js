import { supabase } from '../config/supabase.js';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// ==========================================
// 1. ÍCONES VETORIAIS (SVG)
// ==========================================
const ICONS = {
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
    unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    hand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"></path><path d="M14 10V4a2 2 0 0 0-4 0v6"></path><path d="M10 10.5V6a2 2 0 0 0-4 0v8"></path><path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
};

// ==========================================
// 2. ESTADO DA SESSÃO E PERSONAGENS
// ==========================================
const chatState = {
    roomId: null,
    currentUser: {
        id: '',
        name: 'Usuário',
        email: '',
        avatar: DEFAULT_AVATAR
    },
    roomCharacters: [],
    activeCharacterId: null,
    isEncenacaoEnabled: true,
    messageSubscription: null,
    pendingMessageEvents: [],
    messagesLoaded: false,
    latestMessageTimestamp: 0,
    messageSyncTimer: null,
    messageRealtimeConnected: false,
    typingUsers: new Map(),
    typingStopTimer: null,
    typingCleanupTimer: null,
    lastTypingBroadcastAt: 0,
    pendingMessageBroadcasts: [],
    replyTarget: null,
    messagesById: new Map(),
    presenceChannel: null,
    hostUserId: null,
    isHost: false,
    mediaChannel: null,
    mediaRealtimeConnected: false,
    mediaRealtimeError: false,
    mediaAssets: [],
    activeMedia: null,
    mediaSyncTimer: null,
    mediaSequence: 0,
    lastMediaSequence: -1,
    remoteMediaState: null,
    mediaMutedForAutoplay: false,
    roomUsers: new Map(),
    onlineUsers: new Map() // Rastreador de usuários conectados na sala
};

let userWalletCharacters = [];
let userWalletFolders = [];
let activeWalletFolderId = null;
const selectedWalletCharIds = new Set();
const UNFILED_WALLET_FOLDER = '__unfiled__';

// ==========================================
// 3. ELEMENTOS DO DOM
// ==========================================
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const sidebarAvatar = document.getElementById('sidebar-avatar');

const roomTitle = document.getElementById('room-title') || document.querySelector('.room-title');
const roomSubtitle = document.getElementById('room-members-count') || document.querySelector('.room-subtitle');
const roomMembersAvatars = document.getElementById('room-members-avatars') || document.querySelector('.room-avatars') || document.querySelector('.header-avatars');

const roomInviteCode = document.getElementById('room-invite-code');
const btnCopyInvite = document.getElementById('btn-copy-invite');

const chatBackgroundArea = document.getElementById('chat-background') || document.querySelector('.chat-area') || document.querySelector('.main-content');
const chatMessagesContainer = document.getElementById('chat-messages') || document.querySelector('.messages-container') || document.querySelector('.chat-messages');
let characterProfileModal = null;

const toggleEncenacao = document.getElementById('toggle-encenacao');
const characterBar = document.getElementById('character-bar');
const characterList = document.getElementById('character-list');
const hostMediaControls = document.getElementById('host-media-controls');
const mediaFileInput = document.getElementById('media-file-input');
const btnAddMedia = document.getElementById('btn-add-media');
const mediaLibrary = document.getElementById('media-library');
const btnBroadcastMedia = document.getElementById('btn-broadcast-media');
const btnDeleteMedia = document.getElementById('btn-delete-media');
const mediaChannelStatus = document.getElementById('media-channel-status');
const mediaBroadcast = document.getElementById('media-broadcast');
const mediaBroadcastVideo = document.getElementById('media-broadcast-video');
const mediaBroadcastTitle = document.getElementById('media-broadcast-title');
const btnStopMedia = document.getElementById('btn-stop-media');
const btnEnableMediaAudio = document.getElementById('btn-enable-media-audio');
const mediaAutoplayNotice = document.getElementById('media-autoplay-notice');

const inputAvatar = document.getElementById('input-avatar');
const inputRoleLabel = document.getElementById('input-role-label');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const typingIndicator = document.getElementById('typing-indicator');
const replyComposer = document.getElementById('reply-composer');
const replyComposerName = document.getElementById('reply-composer-name');
const replyComposerText = document.getElementById('reply-composer-text');
const replyComposerCancel = document.getElementById('reply-composer-cancel');

const modalAddRoomChar = document.getElementById('modal-add-room-char');
const btnCloseRoomCharModal = document.getElementById('btn-close-room-char-modal');
const roomCharacterSelectGrid = document.getElementById('room-character-select-grid');
const btnConfirmRoomChars = document.getElementById('btn-confirm-room-chars');

// ==========================================
// 4. INICIALIZAÇÃO DA SESSÃO
// ==========================================
async function initChat() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        window.location.replace('index.html');
        return;
    }

    const metadata = session.user.user_metadata;
    chatState.currentUser.id = session.user.id;
    chatState.currentUser.name = metadata?.full_name || metadata?.name || 'Usuário';
    chatState.currentUser.email = session.user.email || '';
    chatState.currentUser.avatar = metadata?.avatar_url || DEFAULT_AVATAR;

    if (sidebarName) sidebarName.textContent = chatState.currentUser.name;
    if (sidebarEmail) sidebarEmail.textContent = chatState.currentUser.email;
    if (sidebarAvatar) {
        sidebarAvatar.src = chatState.currentUser.avatar;
        sidebarAvatar.classList.remove('hidden');
    }

    const urlParams = new URLSearchParams(window.location.search);
    chatState.roomId = urlParams.get('id');

    if (chatState.roomId) {
        localStorage.setItem('lastRoomId', chatState.roomId);
        
        await loadRoomDetails();
        setupPresence(); 
        setupMediaBroadcast();
        await loadRoomUserProfiles();
        await fetchRoomCharacters();
        await fetchUserWalletCharacters();

        const firstMyChar = chatState.roomCharacters.find(c => c.ownerId === chatState.currentUser.id);
        if (firstMyChar) {
            chatState.activeCharacterId = firstMyChar.id;
        }

        subscribeToMessages();
        await fetchMessages();
        startMessageSyncLoop();
    } else if (roomTitle) {
        roomTitle.textContent = "Sala Desconhecida (Acesse pelo Dashboard)";
    }

    renderDeck();
    updateInputUI();

    document.addEventListener('click', removeContextMenu);

    // ==========================================
    // REMOVE SPLASH SCREEN & LIBERA INPUTS
    // ==========================================
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.classList.add('hidden');
    }
    
    if (chatInput) {
        chatInput.removeAttribute('disabled');
        chatInput.placeholder = "Digite sua mensagem...";
    }
    if (btnSend) {
        btnSend.removeAttribute('disabled');
    }
    if (inputAvatar) {
        inputAvatar.classList.remove('hidden');
    }
}

// ==========================================
// 4.1. SISTEMA DE PRESENÇA EM TEMPO REAL
// ==========================================
function setupPresence() {
    if (!chatState.roomId) return;

    chatState.presenceChannel = supabase.channel(`room_${chatState.roomId}_presence`);

    chatState.presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = chatState.presenceChannel.presenceState();
            const uniqueUsers = new Map();

            for (const id in state) {
                state[id].forEach(client => {
                    uniqueUsers.set(client.id, client);
                });
            }

            chatState.onlineUsers = uniqueUsers;
            updatePresenceUI();
            updateMessageAvatars();
            updateMessageSenderNames();
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await chatState.presenceChannel.track({
                    id: chatState.currentUser.id,
                    name: chatState.currentUser.name,
                    avatar: chatState.currentUser.avatar
                });
            }
        });
}

function updatePresenceUI() {
    const count = chatState.onlineUsers.size;
    
    if (roomSubtitle) {
        roomSubtitle.textContent = `${count} membro${count !== 1 ? 's' : ''} online`;
    }

    if (roomMembersAvatars) {
        roomMembersAvatars.innerHTML = '';
        roomMembersAvatars.style.display = 'flex';
        roomMembersAvatars.style.alignItems = 'center';
        
        const usersArray = Array.from(chatState.onlineUsers.values());
        const displayUsers = usersArray.slice(0, 4);
        const extraCount = usersArray.length - 4;

        displayUsers.forEach((user, index) => {
            const avatarEl = document.createElement('div');
            
            avatarEl.style.width = '32px';
            avatarEl.style.height = '32px';
            avatarEl.style.borderRadius = '50%';
            avatarEl.style.border = '2px solid #13141a';
            avatarEl.style.marginLeft = index > 0 ? '-10px' : '0';
            avatarEl.style.display = 'inline-flex';
            avatarEl.style.alignItems = 'center';
            avatarEl.style.justifyContent = 'center';
            avatarEl.style.backgroundColor = '#9333ea';
            avatarEl.style.color = '#fff';
            avatarEl.style.fontSize = '12px';
            avatarEl.style.fontWeight = 'bold';
            avatarEl.style.overflow = 'hidden';
            avatarEl.style.zIndex = 10 - index;
            avatarEl.title = user.name;

            if (user.avatar) {
                avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width:100%; height:100%; object-fit:cover;">`;
            } else {
                avatarEl.innerHTML = ICONS.user;
            }

            roomMembersAvatars.appendChild(avatarEl);
        });

        if (extraCount > 0) {
            const extraEl = document.createElement('div');
            extraEl.style.width = '32px';
            extraEl.style.height = '32px';
            extraEl.style.borderRadius = '50%';
            extraEl.style.border = '2px solid #13141a';
            extraEl.style.marginLeft = '-10px';
            extraEl.style.display = 'inline-flex';
            extraEl.style.alignItems = 'center';
            extraEl.style.justifyContent = 'center';
            extraEl.style.backgroundColor = '#2f334d';
            extraEl.style.color = 'white';
            extraEl.style.fontSize = '11px';
            extraEl.style.fontWeight = 'bold';
            extraEl.style.zIndex = 0;
            extraEl.textContent = `+${extraCount}`;
            roomMembersAvatars.appendChild(extraEl);
        }
    }
}

// ==========================================
// 4.2 DETALHES E SALA
// ==========================================
async function loadRoomDetails() {
    const { data: room, error } = await supabase
        .from('rooms')
        .select('title, wallpaper_url, invite_code, created_by') // Busca o código de convite também
        .eq('id', chatState.roomId)
        .single();

    if (room && !error) {
        chatState.hostUserId = room.created_by;
        chatState.isHost = room.created_by === chatState.currentUser.id;
        if (hostMediaControls) hostMediaControls.classList.toggle('hidden', !chatState.isHost);
        if (chatState.isHost) loadMediaLibrary();
        if (roomTitle) roomTitle.textContent = room.title;
        
        // Exibe o código de convite na UI se existir
        if (roomInviteCode) {
            roomInviteCode.textContent = room.invite_code || '------';
        }

        // Adiciona evento de copiar
        if (btnCopyInvite && room.invite_code) {
            btnCopyInvite.addEventListener('click', () => {
                navigator.clipboard.writeText(room.invite_code).then(() => {
                    const originalIcon = btnCopyInvite.innerHTML;
                    btnCopyInvite.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                        btnCopyInvite.innerHTML = originalIcon;
                    }, 2000);
                });
            });
        }
        
        if (room.wallpaper_url && chatMessagesContainer) {
            chatMessagesContainer.style.backgroundImage = `linear-gradient(rgba(19, 20, 26, 0.75), rgba(19, 20, 26, 0.75)), url('${room.wallpaper_url}')`;
            chatMessagesContainer.style.backgroundSize = 'cover';
            chatMessagesContainer.style.backgroundPosition = 'center';
            chatMessagesContainer.style.backgroundRepeat = 'no-repeat';
        }
    }
}

// O anfitrião controla uma única fonte de verdade; os demais clientes recebem
// posição, pausa e velocidade pelo Broadcast e carregam o mesmo arquivo do Storage.
async function loadRoomUserProfiles() {
    if (!chatState.roomId) return;
    const { data, error } = await supabase.rpc('get_room_user_profiles', { p_room_id: chatState.roomId });
    if (error) {
        console.error('Não foi possível carregar os nomes dos integrantes da sala. Verifique se a migração de perfis foi aplicada.', error);
        return;
    }
    (data || []).forEach(profile => chatState.roomUsers.set(profile.user_id, {
        id: profile.user_id,
        name: profile.display_name || 'Usuário',
        avatar: profile.avatar_url || null
    }));
    chatState.roomUsers.set(chatState.currentUser.id, {
        id: chatState.currentUser.id,
        name: chatState.currentUser.name,
        avatar: chatState.currentUser.avatar
    });
    updateMessageAvatars();
    updateMessageSenderNames();
}

function setupMediaBroadcast() {
    if (!chatState.roomId) return;
    chatState.mediaChannel = supabase.channel(`room_${chatState.roomId}_media`, {
        config: { private: true, broadcast: { ack: true, self: false } }
    });
    chatState.mediaChannel
        .on('broadcast', { event: 'media_state' }, ({ payload }) => {
            if (!payload || payload.host_id !== chatState.hostUserId || chatState.isHost) return;
            if (Number.isFinite(payload.sequence) && payload.sequence <= chatState.lastMediaSequence) return;
            if (Number.isFinite(payload.sequence)) chatState.lastMediaSequence = payload.sequence;
            applyRemoteMediaState({ ...payload, received_at: performance.now() });
        })
        .subscribe((status, error) => {
            if (status === 'SUBSCRIBED') {
                chatState.mediaRealtimeConnected = true;
                chatState.mediaRealtimeError = false;
                console.info('Canal de vídeo conectado:', chatState.roomId);
                updateMediaButtons();
                if (chatState.isHost && chatState.activeMedia) broadcastMediaState();
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                chatState.mediaRealtimeConnected = false;
                chatState.mediaRealtimeError = true;
                updateMediaButtons();
                console.error('Canal de transmissão indisponível. Aplique as políticas RLS de transmissão no Supabase.', status, error);
                if (chatState.isHost && hostMediaControls) hostMediaControls.title = 'Transmissão indisponível: aplique as políticas RLS do Realtime no Supabase';
            }
        });
}

async function loadMediaLibrary() {
    if (!chatState.isHost || !mediaLibrary) return;
    const { data, error } = await supabase.storage.from('rooms').list(`media/${chatState.roomId}`, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
    if (error) { console.error('Erro ao carregar vídeos da sala:', error); return; }
    const files = (data || []).filter(file => file.name && file.name !== '.emptyFolderPlaceholder');
    chatState.mediaAssets = files.map(file => {
        const path = `media/${chatState.roomId}/${file.name}`;
        return { path, name: file.name.replace(/^[0-9a-f-]+-/i, ''), url: supabase.storage.from('rooms').getPublicUrl(path).data.publicUrl };
    });
    const previous = mediaLibrary.value;
    mediaLibrary.replaceChildren(new Option(chatState.mediaAssets.length ? 'Selecione um vídeo' : 'Nenhum vídeo adicionado', ''));
    chatState.mediaAssets.forEach(asset => mediaLibrary.add(new Option(asset.name, asset.path)));
    mediaLibrary.value = chatState.mediaAssets.some(asset => asset.path === previous) ? previous : '';
    mediaLibrary.disabled = !chatState.mediaAssets.length;
    updateMediaButtons();
}

function updateMediaButtons() {
    const selected = chatState.mediaAssets.some(asset => asset.path === mediaLibrary?.value);
    if (btnBroadcastMedia) btnBroadcastMedia.disabled = !chatState.isHost || !selected || !chatState.mediaRealtimeConnected;
    if (btnDeleteMedia) btnDeleteMedia.disabled = !chatState.isHost || !selected;
    if (mediaChannelStatus) {
        mediaChannelStatus.textContent = chatState.mediaRealtimeError
            ? 'Canal bloqueado: aplique a migração no Supabase'
            : '';
        mediaChannelStatus.classList.toggle('hidden', !chatState.mediaRealtimeError);
        mediaChannelStatus.classList.toggle('media-channel-status-error', chatState.mediaRealtimeError);
    }
}

async function uploadRoomMedia(files) {
    if (!chatState.isHost || !files?.length) return;
    for (const file of files) {
        if (!file.type.startsWith('video/')) continue;
        const safeName = file.name.replace(/[^\w.-]/g, '_');
        const path = `media/${chatState.roomId}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from('rooms').upload(path, file, { contentType: file.type, upsert: false });
        if (error) { console.error('Erro ao enviar vídeo:', error); alert(`Não foi possível enviar ${file.name}. Confira o limite e as políticas do Storage.`); }
    }
    await loadMediaLibrary();
}

function buildMediaState() {
    const video = mediaBroadcastVideo;
    return {
        host_id: chatState.currentUser.id,
        active: !!chatState.activeMedia,
        path: chatState.activeMedia?.path || null,
        url: chatState.activeMedia?.url || null,
        title: chatState.activeMedia?.name || '',
        position: video?.currentTime || 0,
        paused: video?.paused ?? true,
        playback_rate: video?.playbackRate || 1,
        sequence: ++chatState.mediaSequence,
        sent_at: Date.now()
    };
}

async function broadcastMediaState() {
    if (!chatState.isHost || !chatState.mediaChannel || !chatState.activeMedia) return;
    const result = await chatState.mediaChannel.send({ type: 'broadcast', event: 'media_state', payload: buildMediaState() });
    if (result?.status !== 'ok') console.error('Falha ao sincronizar a transmissão:', result?.error || result);
}

function showAutoplayFallback() {
    chatState.mediaMutedForAutoplay = true;
    if (mediaBroadcastVideo) mediaBroadcastVideo.muted = true;
    btnEnableMediaAudio?.classList.remove('hidden');
    mediaAutoplayNotice?.classList.remove('hidden');
    mediaBroadcastVideo?.play().catch(() => {});
}

async function applyRemoteMediaState(payload) {
    chatState.remoteMediaState = payload;
    if (!payload.active) { closeMediaBroadcast(false); return; }
    if (!mediaBroadcast || !mediaBroadcastVideo) return;
    mediaBroadcast.classList.remove('hidden');
    mediaBroadcastTitle.textContent = payload.title || 'Transmissão da sala';
    btnStopMedia?.classList.add('hidden');
    btnEnableMediaAudio?.classList.toggle('hidden', !chatState.mediaMutedForAutoplay);
    mediaAutoplayNotice?.classList.toggle('hidden', !chatState.mediaMutedForAutoplay);
    const desiredUrl = payload.url;
    if (desiredUrl && mediaBroadcastVideo.src !== desiredUrl) {
        mediaBroadcastVideo.src = desiredUrl;
        mediaBroadcastVideo.load();
    }
    if (mediaBroadcastVideo.readyState < 1) return;
    const elapsed = payload.paused ? 0 : Math.max(0, performance.now() - (payload.received_at || performance.now())) / 1000 * (payload.playback_rate || 1);
    const desiredPosition = Math.max(0, payload.position + elapsed);
    if (Math.abs(mediaBroadcastVideo.currentTime - desiredPosition) > 0.25) {
        try { mediaBroadcastVideo.currentTime = desiredPosition; } catch (_) { return; }
    }
    mediaBroadcastVideo.playbackRate = payload.playback_rate || 1;
    if (payload.paused) mediaBroadcastVideo.pause();
    else {
        try { await mediaBroadcastVideo.play(); }
        catch (_) { showAutoplayFallback(); }
    }
}

async function startMediaBroadcast() {
    if (!chatState.isHost) return;
    if (!chatState.mediaRealtimeConnected) {
        alert('A transmissão não pode iniciar porque o canal Realtime da sala não está autorizado. Aplique a migração de transmissão no Supabase e tente novamente.');
        return;
    }
    const asset = chatState.mediaAssets.find(item => item.path === mediaLibrary?.value);
    if (!asset) return;
    chatState.activeMedia = asset;
    mediaBroadcastVideo.src = asset.url;
    mediaBroadcastVideo.controls = true;
    mediaBroadcastVideo.muted = false;
    mediaBroadcastTitle.textContent = asset.name;
    mediaBroadcast.classList.remove('hidden');
    btnStopMedia?.classList.remove('hidden');
    btnEnableMediaAudio?.classList.add('hidden');
    mediaAutoplayNotice?.classList.add('hidden');
    try { await mediaBroadcastVideo.play(); } catch (error) { console.error('Não foi possível iniciar o vídeo:', error); }
    await broadcastMediaState();
    clearInterval(chatState.mediaSyncTimer);
    chatState.mediaSyncTimer = setInterval(broadcastMediaState, 300);
    if (mediaBroadcast.requestFullscreen) mediaBroadcast.requestFullscreen().catch(() => {});
}

async function closeMediaBroadcast(notify = false) {
    // Desliga o heartbeat antes do evento de parada para impedir que um estado
    // ativo atrasado reabra a transmissão nos demais clientes.
    clearInterval(chatState.mediaSyncTimer);
    chatState.mediaSyncTimer = null;
    chatState.activeMedia = null;
    if (notify && chatState.isHost && chatState.mediaChannel) {
        const stopPayload = { host_id: chatState.currentUser.id, active: false, sequence: ++chatState.mediaSequence, sent_at: Date.now() };
        let delivered = false;
        for (let attempt = 0; attempt < 3 && !delivered; attempt += 1) {
            const result = await chatState.mediaChannel.send({ type: 'broadcast', event: 'media_state', payload: stopPayload });
            delivered = result?.status === 'ok';
            if (!delivered && attempt < 2) await new Promise(resolve => setTimeout(resolve, 200));
        }
        if (!delivered) {
            console.error('O comando para interromper a transmissão não foi confirmado pelo Realtime.');
            chatState.mediaRealtimeError = true;
            updateMediaButtons();
        }
    }
    chatState.remoteMediaState = null;
    if (mediaBroadcastVideo) { mediaBroadcastVideo.pause(); mediaBroadcastVideo.removeAttribute('src'); mediaBroadcastVideo.load(); }
    mediaBroadcast?.classList.add('hidden');
    btnStopMedia?.classList.add('hidden');
    btnEnableMediaAudio?.classList.add('hidden');
    mediaAutoplayNotice?.classList.add('hidden');
    if (document.fullscreenElement === mediaBroadcast) document.exitFullscreen().catch(() => {});
}

if (btnAddMedia) btnAddMedia.addEventListener('click', () => chatState.isHost && mediaFileInput?.click());
if (mediaFileInput) mediaFileInput.addEventListener('change', async () => { await uploadRoomMedia(mediaFileInput.files); mediaFileInput.value = ''; });
if (mediaLibrary) mediaLibrary.addEventListener('change', updateMediaButtons);
if (btnBroadcastMedia) btnBroadcastMedia.addEventListener('click', startMediaBroadcast);
if (btnDeleteMedia) btnDeleteMedia.addEventListener('click', async () => {
    if (!chatState.isHost) return;
    const asset = chatState.mediaAssets.find(item => item.path === mediaLibrary.value);
    if (!asset || !confirm(`Excluir o vídeo "${asset.name}"?`)) return;
    if (chatState.activeMedia?.path === asset.path) await closeMediaBroadcast(true);
    const { error } = await supabase.storage.from('rooms').remove([asset.path]);
    if (error) { console.error('Erro ao excluir vídeo:', error); alert('Não foi possível excluir o vídeo.'); return; }
    await loadMediaLibrary();
});
if (btnStopMedia) btnStopMedia.addEventListener('click', () => chatState.isHost && closeMediaBroadcast(true));
if (btnEnableMediaAudio) btnEnableMediaAudio.addEventListener('click', async () => {
    chatState.mediaMutedForAutoplay = false;
    mediaBroadcastVideo.muted = false;
    btnEnableMediaAudio.classList.add('hidden');
    mediaAutoplayNotice?.classList.add('hidden');
    try { await mediaBroadcastVideo.play(); } catch (_) { showAutoplayFallback(); }
});
if (mediaBroadcastVideo) {
    mediaBroadcastVideo.addEventListener('loadedmetadata', () => { if (!chatState.isHost && chatState.remoteMediaState) applyRemoteMediaState(chatState.remoteMediaState); });
    ['play', 'pause', 'seeked', 'ratechange'].forEach(eventName => mediaBroadcastVideo.addEventListener(eventName, () => { if (chatState.isHost && chatState.activeMedia) broadcastMediaState(); }));
}

async function fetchRoomCharacters() {
    if (!chatState.roomId) return;

    const { data, error } = await supabase
        .from('room_characters')
        .select(`
            id,
            room_id,
            character_id,
            owner_id,
            last_used_at,
            characters:character_id (id, name, avatar_url, initials, color, description)
        `)
        .eq('room_id', chatState.roomId);

    if (error) {
        console.error("Erro ao buscar personagens da sala:", error);
        return;
    }

    chatState.roomCharacters = (data || []).map(rc => {
        const char = rc.characters || {};
        return {
            id: char.id || rc.character_id,
            roomCharId: rc.id,
            name: char.name || 'Sem nome',
            avatar: char.avatar_url || null,
            color: char.color || '#9333ea',
            initials: char.initials || (char.name ? char.name.substring(0,2).toUpperCase() : '??'),
            description: char.description || '',
            ownerId: rc.owner_id,
            ownerName: rc.owner_id === chatState.currentUser.id ? 'Você' : (rc.owner_id ? (chatState.roomUsers.get(rc.owner_id)?.name || chatState.onlineUsers.get(rc.owner_id)?.name || 'Usuário') : null),
            lastUsed: rc.last_used_at ? new Date(rc.last_used_at).getTime() : 0
        };
    });
}

async function broadcastRoomCharactersChanged() {
    if (!chatState.messageSubscription || !chatState.messageRealtimeConnected) {
        console.error('Não foi possível avisar os outros integrantes sobre a alteração dos personagens: canal da sala desconectado.');
        return;
    }
    const result = await chatState.messageSubscription.send({
        type: 'broadcast',
        event: 'room_characters_changed',
        payload: { changed_by: chatState.currentUser.id, sent_at: Date.now() }
    });
    if (result !== 'ok' && result?.status !== 'ok') {
        console.error('Falha ao sincronizar os personagens da sala:', result?.error || result);
    }
}

async function syncRoomCharacters() {
    const previousActiveId = chatState.activeCharacterId;
    await fetchRoomCharacters();
    const activeCharacter = chatState.roomCharacters.find(character =>
        character.id === previousActiveId && character.ownerId === chatState.currentUser.id
    );
    if (!activeCharacter) {
        chatState.activeCharacterId = chatState.roomCharacters.find(character =>
            character.ownerId === chatState.currentUser.id
        )?.id || null;
    }
    renderDeck();
    updateInputUI();
    if (modalAddRoomChar && !modalAddRoomChar.classList.contains('hidden')) renderModalCharacterGrid();
}

async function fetchUserWalletCharacters() {
    const [{ data: folderData, error: folderError }, { data, error }] = await Promise.all([
        supabase
            .from('character_folders')
            .select('id, name')
            .eq('user_id', chatState.currentUser.id)
            .order('created_at', { ascending: true }),
        supabase
        .from('characters')
        .select('*')
        .eq('user_id', chatState.currentUser.id)
    ]);

    if (folderError) {
        console.error('Erro ao carregar pastas da carteira:', folderError);
        userWalletFolders = [];
    } else {
        userWalletFolders = folderData || [];
    }
    if (error) return;

    userWalletCharacters = (data || []).map(c => ({
        id: c.id,
        folderId: c.folder_id || null,
        name: c.name,
        avatar: c.avatar_url,
        initials: c.initials || c.name.substring(0, 2).toUpperCase(),
        color: c.color || '#9333ea'
    }));
}

// ==========================================
// 5. CARREGAR E RENDERIZAR MENSAGENS
// ==========================================
const MESSAGE_BASE_SELECT = `
    id, content, created_at, user_id, is_encenacao,
    characters ( id, name, avatar_url, color, initials )
`;
const MESSAGE_FEATURE_SELECT = `
    id, content, created_at, user_id, is_encenacao, reply_to_id, deleted_at,
    characters ( id, name, avatar_url, color, initials )
`;

function isOptionalMessageSchemaError(error) {
    const details = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return /42703|pgrst200|pgrst204|reply_to_id|deleted_at|relationship.*messages|schema cache/.test(details);
}

async function queryRoomMessages(since = null) {
    const runQuery = async select => {
        let query = supabase
            .from('messages')
            .select(select)
            .eq('room_id', chatState.roomId);
        if (since) query = query.gte('created_at', since);
        return query.order('created_at', { ascending: true });
    };

    let result = await runQuery(MESSAGE_FEATURE_SELECT);
    if (result.error && isOptionalMessageSchemaError(result.error)) {
        console.warn('Campos de resposta/exclusão ainda não disponíveis; carregando mensagens sem esses recursos.');
        result = await runQuery(MESSAGE_BASE_SELECT);
    }
    return result;
}

async function hydrateMessageReplies(messages) {
    if (!messages?.length) return;

    const messageById = new Map(chatState.messagesById);
    messages.forEach(message => {
        if (message.id) messageById.set(String(message.id), message);
    });
    const missingReplyIds = [...new Set(messages
        .map(message => message.reply_to_id)
        .filter(id => id && !messageById.has(String(id))))];

    if (missingReplyIds.length) {
        const { data, error } = await supabase
            .from('messages')
            .select('id, content, user_id, deleted_at')
            .in('id', missingReplyIds);
        if (error) console.error('Não foi possível carregar as mensagens respondidas:', error);
        (data || []).forEach(message => messageById.set(String(message.id), message));
    }

    messages.forEach(message => {
        if (message.reply_to_id) message.reply = messageById.get(String(message.reply_to_id)) || null;
    });
}

async function fetchMessages() {
    if (!chatMessagesContainer) return;

    const { data, error } = await queryRoomMessages();

    if (error) {
        console.error("Erro ao buscar mensagens:", error);
        return;
    }

    await hydrateMessageReplies(data || []);
    renderAllMessages(data || []);
    (data || []).forEach(msg => rememberMessageTimestamp(msg.created_at));
    chatState.messagesLoaded = true;

    const pendingEvents = chatState.pendingMessageEvents.splice(0);
    pendingEvents.forEach(msg => appendMessageToUI(msg));
    scrollToLatestMessage();
}

function rememberMessageTimestamp(value) {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
        chatState.latestMessageTimestamp = Math.max(chatState.latestMessageTimestamp, timestamp);
    }
}

async function syncNewMessages() {
    if (!chatState.roomId || !chatState.messagesLoaded) return;

    // Consulta uma pequena janela anterior para cobrir eventos atrasados; IDs evitam duplicatas.
    const since = new Date(Math.max(0, chatState.latestMessageTimestamp - 5000)).toISOString();
    const { data, error } = await queryRoomMessages(since);

    if (error) {
        console.error('Erro ao sincronizar mensagens recentes:', error);
        return;
    }

    await hydrateMessageReplies(data || []);
    (data || []).forEach(appendMessageToUI);
}

function startMessageSyncLoop() {
    if (chatState.messageSyncTimer) clearInterval(chatState.messageSyncTimer);
    chatState.messageSyncTimer = setInterval(() => {
        syncNewMessages();
        syncRoomCharacters();
    }, 2500);
}

function renderAllMessages(messages) {
    if (!chatMessagesContainer) return;
    
    chatMessagesContainer.innerHTML = '';
    messages.forEach(msg => appendMessageToUI(msg));
    scrollToLatestMessage();
}

function scrollToLatestMessage() {
    if (!chatMessagesContainer) return;
    requestAnimationFrame(() => {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        requestAnimationFrame(() => {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        });
    });
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function appendMessageToUI(msg) {
    if (!chatMessagesContainer) return;
    if (msg.id) chatState.messagesById.set(String(msg.id), msg);
    if (msg.id && Array.from(chatMessagesContainer.children).some(element => element.dataset.messageId === String(msg.id))) return;
    rememberMessageTimestamp(msg.created_at);

    const isMine = msg.user_id === chatState.currentUser.id;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const char = msg.characters;
    const isDeleted = Boolean(msg.deleted_at);
    const messageText = isDeleted ? 'Esta mensagem foi apagada' : escapeHtml(msg.content);

    const msgElement = document.createElement('div');
    if (msg.id) msgElement.dataset.messageId = String(msg.id);
    msgElement.dataset.createdAt = String(Date.parse(msg.created_at) || 0);
    msgElement.style.display = 'flex';
    msgElement.style.flexDirection = 'column';
    msgElement.style.marginBottom = '16px';
    msgElement.style.alignItems = isMine ? 'flex-end' : 'flex-start';
    msgElement.style.width = '100%';

    const onlineSender = chatState.onlineUsers.get(msg.user_id);
    const senderProfile = chatState.roomUsers.get(msg.user_id) || onlineSender;
    const senderName = isMine ? chatState.currentUser.name : (senderProfile?.name || 'Usuário');
    const isCharacterMessage = Boolean(msg.is_encenacao && char);
    const senderAvatar = isCharacterMessage
        ? char.avatar_url
        : (isMine ? chatState.currentUser.avatar : senderProfile?.avatar);
    const senderInitials = msg.is_encenacao && char
        ? (char.initials || char.name.substring(0, 2).toUpperCase())
        : senderName.substring(0, 2).toUpperCase();
    const avatarAlt = isCharacterMessage ? `Foto de ${char.name}` : `Foto de ${senderName}`;
    const avatarContent = senderAvatar
        ? `<img class="message-avatar${isCharacterMessage ? '' : ' message-user-avatar'}" src="${senderAvatar}" alt="${avatarAlt}" ${isCharacterMessage ? '' : `data-user-id="${msg.user_id}"`} loading="lazy" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">`
        : `<div class="message-avatar message-avatar-fallback${isCharacterMessage ? '' : ' message-user-avatar'}" ${isCharacterMessage ? 'aria-hidden="true"' : `data-user-id="${msg.user_id}"`} style="width:36px; height:36px; border-radius:50%; background:#282436; color:${char?.color || '#c084fc'}; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">${isCharacterMessage ? senderInitials : ICONS.user}</div>`;
    const avatarHTML = isCharacterMessage
        ? `<button type="button" class="message-avatar-button" data-character-id="${char.id}" aria-label="Abrir perfil de ${char.name}" title="Ver perfil de ${char.name}" style="background:none; border:none; cursor:pointer; padding:0; outline:none;">${avatarContent}</button>`
        : avatarContent;
    let headerHTML = '';
    let bubbleStyle = isCharacterMessage
        ? `background-color: ${char.color}; color: #fff;`
        : (isMine ? `background-color: #9B30FF; color: #fff;` : `background-color: #1a1b26; color: #d4d4d8; border: 1px solid #2f334d;`);

    if (msg.is_encenacao && char) {
        if (!isMine) {
            headerHTML = `
                <div style="font-size: 12px; color: #a1a1aa; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${char.color};"></span>
                    <strong style="color: #ffffff;">${char.name}</strong> · <span class="message-sender-name" data-user-id="${msg.user_id}">${escapeHtml(senderName)}</span>
                </div>
            `;
        } else {
            headerHTML = `
                <div style="font-size: 12px; color: #a1a1aa; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; justify-content: flex-end;">
                    Você · <strong style="color: #ffffff;">${char.name}</strong>
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${char.color};"></span>
                </div>
            `;
        }
    } else {
        headerHTML = `<div style="font-size: 12px; color: #a1a1aa; margin-bottom: 6px;">${isMine ? 'Você' : `<span class="message-sender-name" data-user-id="${msg.user_id}">${escapeHtml(senderName)}</span>`}</div>`;
    }

    msgElement.innerHTML = `
        <div style="display: flex; flex-direction: ${isMine ? 'row-reverse' : 'row'}; align-items: flex-start; gap: 12px; max-width: 80%;">
            ${avatarHTML}
            <div style="display: flex; flex-direction: column; align-items: ${isMine ? 'flex-end' : 'flex-start'};">
                ${headerHTML}
                ${msg.reply ? `<button type="button" class="message-reply-reference" data-reply-id="${escapeHtml(msg.reply.id)}"><strong>${msg.reply.user_id === chatState.currentUser.id ? 'Você' : escapeHtml(chatState.roomUsers.get(msg.reply.user_id)?.name || chatState.onlineUsers.get(msg.reply.user_id)?.name || 'Integrante')}</strong><span>${msg.reply.deleted_at ? 'Esta mensagem foi apagada' : escapeHtml(msg.reply.content || '')}</span></button>` : ''}
                <div class="message-bubble${isDeleted ? ' is-deleted' : ''}" style="padding: 12px 16px; border-radius: 8px; font-size: 14px; line-height: 1.5; ${bubbleStyle}">
                    ${messageText}
                </div>
                <span style="font-size: 11px; color: #52525b; margin-top: 6px;">${time}</span>
            </div>
        </div>
    `;

    const timestamp = Number(msgElement.dataset.createdAt);
    const nextMessage = Array.from(chatMessagesContainer.children).find(element =>
        Number(element.dataset.createdAt || 0) > timestamp
    );
    chatMessagesContainer.insertBefore(msgElement, nextMessage || null);
    scrollToLatestMessage();
}

function updateMessageAvatars() {
    if (!chatMessagesContainer) return;

    chatMessagesContainer.querySelectorAll('.message-user-avatar[data-user-id]').forEach(avatar => {
        const user = chatState.roomUsers.get(avatar.dataset.userId) || chatState.onlineUsers.get(avatar.dataset.userId);
        if (!user?.avatar) return;

        if (avatar.tagName === 'IMG') {
            if (avatar.src !== user.avatar) avatar.src = user.avatar;
            avatar.alt = `Foto de ${user.name || 'usuário'}`;
            return;
        }

        const image = document.createElement('img');
        image.className = 'message-avatar message-user-avatar';
        image.dataset.userId = avatar.dataset.userId;
        image.src = user.avatar;
        image.alt = `Foto de ${user.name || 'usuário'}`;
        image.loading = 'lazy';
        avatar.replaceWith(image);
    });
}

function updateMessageSenderNames() {
    if (!chatMessagesContainer) return;
    chatMessagesContainer.querySelectorAll('.message-sender-name[data-user-id]').forEach(label => {
        const user = chatState.roomUsers.get(label.dataset.userId) || chatState.onlineUsers.get(label.dataset.userId);
        if (user?.name) label.textContent = user.name;
    });
}

function showCharacterProfile(characterId) {
    const character = chatState.roomCharacters.find(item => item.id === characterId);
    if (!character) return;

    if (!characterProfileModal) {
        characterProfileModal = document.createElement('div');
        characterProfileModal.className = 'modal-overlay character-profile-overlay';
        characterProfileModal.innerHTML = `
            <section class="modal-card character-profile-card" role="dialog" aria-modal="true" aria-labelledby="character-profile-name">
                <button type="button" class="character-profile-close" aria-label="Fechar perfil">×</button>
                <div class="character-profile-avatar"></div>
                <h2 id="character-profile-name"></h2>
                <p class="character-profile-description"></p>
            </section>`;
        characterProfileModal.addEventListener('click', event => {
            if (event.target === characterProfileModal || event.target.closest('.character-profile-close')) {
                characterProfileModal.classList.add('hidden');
            }
        });
        document.body.appendChild(characterProfileModal);
    }

    const avatar = characterProfileModal.querySelector('.character-profile-avatar');
    avatar.innerHTML = character.avatar
        ? `<img src="${character.avatar}" alt="Foto de ${character.name}">`
        : `<span style="color:${character.color}">${character.initials}</span>`;
    avatar.style.setProperty('--character-color', character.color || '#9d4edd');
    characterProfileModal.querySelector('#character-profile-name').textContent = character.name;
    characterProfileModal.querySelector('.character-profile-description').textContent = character.description || 'Este personagem ainda não possui uma descrição.';
    characterProfileModal.classList.remove('hidden');
}

if (chatMessagesContainer) {
    chatMessagesContainer.addEventListener('click', event => {
        const avatarButton = event.target.closest('.message-avatar-button');
        if (avatarButton) showCharacterProfile(avatarButton.dataset.characterId);

        const replyReference = event.target.closest('.message-reply-reference');
        if (replyReference) {
            const target = Array.from(chatMessagesContainer.children).find(
                item => item.dataset.messageId === replyReference.dataset.replyId
            );
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target?.classList.add('message-reply-highlight');
            setTimeout(() => target?.classList.remove('message-reply-highlight'), 1200);
        }
    });

    chatMessagesContainer.addEventListener('contextmenu', event => {
        const bubble = event.target.closest('.message-bubble');
        const messageElement = bubble?.closest('[data-message-id]');
        if (!bubble || !messageElement) return;
        event.preventDefault();
        openMessageActionMenu(messageElement, event.clientX, event.clientY);
    });
}

function closeMessageActionMenu() {
    document.getElementById('message-action-menu')?.remove();
}

function openMessageActionMenu(messageElement, x, y) {
    closeMessageActionMenu();
    const message = chatState.messagesById.get(messageElement.dataset.messageId);
    if (!message || message.deleted_at) return;

    const menu = document.createElement('div');
    menu.className = 'context-menu message-context-menu';
    menu.id = 'message-action-menu';
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - 190))}px`;
    menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - 100))}px`;
    menu.innerHTML = `<button type="button" class="context-menu-item" data-action="reply">Responder</button>${message.user_id === chatState.currentUser.id ? '<button type="button" class="context-menu-item danger" data-action="delete">Excluir mensagem</button>' : ''}`;
    document.body.appendChild(menu);
    menu.addEventListener('click', async event => {
        const action = event.target.closest('[data-action]')?.dataset.action;
        closeMessageActionMenu();
        if (action === 'reply') setReplyTarget(message);
        if (action === 'delete') await deleteOwnMessage(message);
    });
}

function setReplyTarget(message) {
    chatState.replyTarget = message;
    const sender = message.user_id === chatState.currentUser.id
        ? 'Você'
        : (chatState.roomUsers.get(message.user_id)?.name || chatState.onlineUsers.get(message.user_id)?.name || 'Integrante');
    replyComposerName.textContent = sender;
    replyComposerText.textContent = message.content;
    replyComposer.classList.remove('hidden');
    chatInput?.focus();
}

function clearReplyTarget() {
    chatState.replyTarget = null;
    replyComposer?.classList.add('hidden');
    if (replyComposerName) replyComposerName.textContent = '';
    if (replyComposerText) replyComposerText.textContent = '';
}

if (replyComposerCancel) replyComposerCancel.addEventListener('click', clearReplyTarget);
document.addEventListener('click', event => {
    if (!event.target.closest('#message-action-menu')) closeMessageActionMenu();
});

async function deleteOwnMessage(message) {
    const { data, error } = await supabase.rpc('delete_own_room_message', { p_message_id: message.id });
    if (error) {
        console.error('Falha ao excluir mensagem:', error);
        alert('Não foi possível apagar a mensagem. Verifique se a migration de mensagens foi aplicada no Supabase.');
        return;
    }
    const updated = Array.isArray(data) ? data[0] : data;
    if (updated) applyMessageUpdate(updated);
}

function applyMessageUpdate(updated) {
    if (!updated?.id) return;
    const id = String(updated.id);
    const message = { ...(chatState.messagesById.get(id) || {}), ...updated };
    chatState.messagesById.set(id, message);

    const element = Array.from(chatMessagesContainer?.children || []).find(item => item.dataset.messageId === id);
    if (element && message.deleted_at) {
        const bubble = element.querySelector('.message-bubble');
        if (bubble) {
            bubble.textContent = 'Esta mensagem foi apagada';
            bubble.classList.add('is-deleted');
        }
        element.dataset.deleted = 'true';
    }

    chatMessagesContainer?.querySelectorAll('.message-reply-reference').forEach(reference => {
        if (reference.dataset.replyId === id && message.deleted_at) {
            const preview = reference.querySelector('span');
            if (preview) preview.textContent = 'Esta mensagem foi apagada';
        }
    });
}
async function processIncomingMessage(newMsg) {
    if (newMsg.character_id && !newMsg.characters) {
        const { data: charData } = await supabase
            .from('characters')
            .select('id, name, avatar_url, color, initials, description')
            .eq('id', newMsg.character_id)
            .single();
        newMsg.characters = charData;
    }
    if (newMsg.reply_to_id && !newMsg.reply) {
        const { data: reply } = await supabase
            .from('messages')
            .select('id, content, user_id, deleted_at')
            .eq('id', newMsg.reply_to_id)
            .maybeSingle();
        newMsg.reply = reply;
    }
    const charData = newMsg.characters;
    if (charData && !chatState.roomCharacters.some(character => character.id === charData.id)) {
        chatState.roomCharacters.push({
            id: charData.id,
            name: charData.name,
            avatar: charData.avatar_url,
            initials: charData.initials || charData.name.substring(0, 2).toUpperCase(),
            color: charData.color || '#9333ea',
            description: charData.description || ''
        });
    }

    if (chatState.messagesLoaded) {
        appendMessageToUI(newMsg);
    } else {
        chatState.pendingMessageEvents.push(newMsg);
    }
}

function handleTypingEvent(payload) {
    if (!payload || payload.user_id === chatState.currentUser.id) return;

    if (payload.typing) {
        chatState.typingUsers.set(payload.user_id, {
            name: payload.user_name || 'Alguém',
            expiresAt: Date.now() + 2800
        });
    } else {
        chatState.typingUsers.delete(payload.user_id);
    }
    clearTimeout(chatState.typingCleanupTimer);
    chatState.typingCleanupTimer = setTimeout(renderTypingIndicator, 2900);
    renderTypingIndicator();
}

function renderTypingIndicator() {
    if (!typingIndicator) return;
    const now = Date.now();
    for (const [userId, user] of chatState.typingUsers) {
        if (user.expiresAt <= now) chatState.typingUsers.delete(userId);
    }

    const names = [...chatState.typingUsers.values()].map(user => user.name);
    if (!names.length) {
        typingIndicator.classList.add('hidden');
        typingIndicator.textContent = '';
        return;
    }

    typingIndicator.textContent = names.length === 1
        ? `${names[0]} está digitando…`
        : `${names.slice(0, 2).join(' e ')} estão digitando…`;
    typingIndicator.classList.remove('hidden');
}

async function sendTypingEvent(isTyping) {
    if (!chatState.messageSubscription || !chatState.messageRealtimeConnected) return;
    try {
        const result = await chatState.messageSubscription.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
                user_id: chatState.currentUser.id,
                user_name: chatState.currentUser.name,
                typing: isTyping
            }
        });
        const status = typeof result === 'string' ? result : result?.status;
        if (status !== 'ok') console.error('Falha ao enviar indicador de digitação:', result?.error || result);
    } catch (error) {
        console.error('Falha ao enviar indicador de digitação:', error);
    }
}

function updateTypingState() {
    if (!chatInput?.value.trim()) {
        clearTimeout(chatState.typingStopTimer);
        sendTypingEvent(false);
        return;
    }

    const now = Date.now();
    if (now - chatState.lastTypingBroadcastAt >= 700) {
        chatState.lastTypingBroadcastAt = now;
        sendTypingEvent(true);
    }

    clearTimeout(chatState.typingStopTimer);
    chatState.typingStopTimer = setTimeout(() => sendTypingEvent(false), 1600);
}

async function broadcastMessage(message) {
    if (!chatState.messageRealtimeConnected || !chatState.messageSubscription) {
        chatState.pendingMessageBroadcasts.push(message);
        return;
    }

    const result = await chatState.messageSubscription.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { message }
    });
    const status = typeof result === 'string' ? result : result?.status;
    if (status !== 'ok') {
        chatState.pendingMessageBroadcasts.unshift(message);
        console.error('Falha no broadcast da mensagem:', result?.error || result);
        return false;
    }
    return true;
}

async function flushPendingMessageBroadcasts() {
    while (chatState.messageRealtimeConnected && chatState.pendingMessageBroadcasts.length) {
        const message = chatState.pendingMessageBroadcasts.shift();
        const sent = await broadcastMessage(message);
        if (!sent) break;
    }
}

function subscribeToMessages() {
    if (chatState.messageSubscription) return;

    chatState.messageSubscription = supabase
        .channel(`room_${chatState.roomId}_messages`, {
            config: { broadcast: { ack: true, self: false } }
        })
        .on('broadcast', { event: 'new_message' }, ({ payload }) => {
            if (payload?.message) processIncomingMessage(payload.message);
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => handleTypingEvent(payload))
        .on('broadcast', { event: 'room_characters_changed' }, () => syncRoomCharacters())
        .on('postgres_changes', {
            event: '*', schema: 'public', table: 'room_characters',
            filter: `room_id=eq.${chatState.roomId}`
        }, () => syncRoomCharacters())
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `room_id=eq.${chatState.roomId}`
        }, payload => {
            processIncomingMessage(payload.new);
        })
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'messages',
            filter: `room_id=eq.${chatState.roomId}`
        }, payload => applyMessageUpdate(payload.new))
        .subscribe((status, error) => {
            chatState.messageRealtimeConnected = status === 'SUBSCRIBED';
            if (status === 'SUBSCRIBED') {
                flushPendingMessageBroadcasts();
                if (chatState.messagesLoaded) syncNewMessages();
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Falha na assinatura de mensagens em tempo real:', status, error);
                syncNewMessages();
            }
        });
}

// ==========================================
// 6. ORDENAÇÃO E RENDERIZAÇÃO DO DECK
// ==========================================
function getSortedCharacters() {
    return [...chatState.roomCharacters].sort((a, b) => {
        const aIsMyChar = a.ownerId === chatState.currentUser.id;
        const bIsMyChar = b.ownerId === chatState.currentUser.id;

        if (aIsMyChar && !bIsMyChar) return -1;
        if (!aIsMyChar && bIsMyChar) return 1;

        if (aIsMyChar && bIsMyChar) {
            const aIsActive = a.id === chatState.activeCharacterId;
            const bIsActive = b.id === chatState.activeCharacterId;

            if (aIsActive) return -1;
            if (bIsActive) return 1;

            return (b.lastUsed || 0) - (a.lastUsed || 0);
        }
        return 0;
    });
}

function renderDeck() {
    if (!characterList) return;

    characterList.innerHTML = '';
    const sortedCharacters = getSortedCharacters();

    sortedCharacters.forEach(char => {
        const isMyChar = char.ownerId === chatState.currentUser.id;
        const isActive = isMyChar && char.id === chatState.activeCharacterId;
        const isStandby = isMyChar && !isActive;
        const isSolto = char.ownerId === null;
        const isTaken = char.ownerId && !isMyChar;

        const charItem = document.createElement('div');

        let stateClass = 'free';
        let badgeHTML = `<span class="status-badge free-icon">${ICONS.unlock}</span>`;
        let tooltipText = 'Personagem Solto - Clique para assumir';

        if (isActive) {
            stateClass = 'active';
            badgeHTML = `<span class="status-badge active-check">${ICONS.check}</span>`;
            tooltipText = 'Personagem Ativo (Sua fala)';
        } else if (isStandby) {
            stateClass = 'standby';
            badgeHTML = `<span class="status-badge standby-icon">${ICONS.pause}</span>`;
            tooltipText = 'Em Standby - Clique para mudar para Ativo';
        } else if (isTaken) {
            stateClass = 'taken';
            badgeHTML = `<span class="status-badge taken-icon">${ICONS.lock}</span>`;
            tooltipText = `Possuído por ${char.ownerName || 'outro usuário'}`;
        }

        charItem.className = `char-item ${stateClass}`;
        charItem.setAttribute('data-id', char.id);

        let avatarImgOrInitials = char.avatar 
            ? `<img src="${char.avatar}" alt="${char.name}">` 
            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1a1b26; color: ${char.color}; font-weight: bold;">${char.initials}</div>`;

        charItem.innerHTML = `
            <div class="char-avatar-wrapper" title="${tooltipText}" style="${!char.avatar ? 'border-color: ' + char.color : ''}">
                ${avatarImgOrInitials}
                ${badgeHTML}
            </div>
            <span>${char.name.split(' ')[0]}</span>
        `;

        charItem.addEventListener('click', () => {
            if (isSolto) {
                assumirPersonagem(char.id);
            } else if (isStandby) {
                setActiveCharacter(char.id);
            } else if (isTaken) {
                alert(`Este personagem é de ${char.ownerName || 'outro usuário'}.`);
            }
        });

        charItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e, char);
        });

        characterList.appendChild(charItem);
    });

    const addCard = document.createElement('div');
    addCard.className = 'char-item';
    addCard.innerHTML = `
        <div class="char-avatar-wrapper placeholder add" title="Adicionar personagem à sala">+</div>
        <span>Novo</span>
    `;
    addCard.addEventListener('click', openAddCharacterModal);
    characterList.appendChild(addCard);
}

async function setActiveCharacter(charId) {
    const char = chatState.roomCharacters.find(c => c.id === charId);
    if (char) {
        char.lastUsed = Date.now();
        await supabase
            .from('room_characters')
            .update({ last_used_at: new Date().toISOString() })
            .eq('room_id', chatState.roomId)
            .eq('character_id', charId);
    }
    chatState.activeCharacterId = charId;
    renderDeck();
    updateInputUI();
}

// ==========================================
// 7. MODAL DE SELEÇÃO E CONFIRMAÇÃO
// ==========================================
async function openAddCharacterModal() {
    if (!chatState.roomId) {
        alert("Nenhuma sala ativa encontrada. Volte ao Dashboard e acesse uma sala válida.");
        return;
    }

    if (!modalAddRoomChar) return;

    await fetchUserWalletCharacters();
    activeWalletFolderId = null;

    selectedWalletCharIds.clear();
    chatState.roomCharacters.forEach(rc => {
        selectedWalletCharIds.add(rc.id);
    });

    renderModalCharacterGrid();
    modalAddRoomChar.classList.remove('hidden');
}

function closeAddCharacterModal() {
    if (!modalAddRoomChar) return;
    modalAddRoomChar.classList.add('hidden');
}

function renderModalCharacterGrid() {
    if (!roomCharacterSelectGrid) return;

    roomCharacterSelectGrid.style.display = 'grid';
    roomCharacterSelectGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
    roomCharacterSelectGrid.style.gap = '16px';
    roomCharacterSelectGrid.innerHTML = '';

    const addFolderCard = (folderId, name, count, isUnfiled = false) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'room-wallet-folder-card';
        card.innerHTML = `<span class="room-wallet-folder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></span><strong></strong><small>${count} personagem${count !== 1 ? 's' : ''}</small>`;
        card.querySelector('strong').textContent = name;
        card.addEventListener('click', () => {
            activeWalletFolderId = folderId;
            renderModalCharacterGrid();
        });
        roomCharacterSelectGrid.appendChild(card);
    };

    if (activeWalletFolderId === null) {
        const heading = document.createElement('p');
        heading.className = 'room-wallet-folder-heading';
        heading.textContent = 'Escolha uma pasta para ver os personagens';
        roomCharacterSelectGrid.appendChild(heading);

        userWalletFolders.forEach(folder => {
            const count = userWalletCharacters.filter(char => char.folderId === folder.id).length;
            addFolderCard(folder.id, folder.name, count);
        });
        const unfiledCount = userWalletCharacters.filter(char => !char.folderId).length;
        if (unfiledCount) addFolderCard(UNFILED_WALLET_FOLDER, 'Sem pasta', unfiledCount, true);

        if (!userWalletFolders.length && !unfiledCount) {
            const empty = document.createElement('p');
            empty.className = 'room-wallet-empty';
            empty.textContent = 'Sua carteira está vazia. Crie pastas e personagens na Carteira de personagens.';
            roomCharacterSelectGrid.appendChild(empty);
        }
        return;
    }

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'room-wallet-back-button';
    backButton.textContent = '← Voltar às pastas';
    backButton.addEventListener('click', () => {
        activeWalletFolderId = null;
        renderModalCharacterGrid();
    });
    roomCharacterSelectGrid.appendChild(backButton);

    const folderName = activeWalletFolderId === UNFILED_WALLET_FOLDER
        ? 'Sem pasta'
        : userWalletFolders.find(folder => folder.id === activeWalletFolderId)?.name || 'Pasta';
    const heading = document.createElement('p');
    heading.className = 'room-wallet-folder-heading';
    heading.textContent = folderName;
    roomCharacterSelectGrid.appendChild(heading);

    const folderCharacters = userWalletCharacters.filter(char => activeWalletFolderId === UNFILED_WALLET_FOLDER
        ? !char.folderId
        : char.folderId === activeWalletFolderId);

    if (!folderCharacters.length) {
        const empty = document.createElement('p');
        empty.className = 'room-wallet-empty';
        empty.textContent = 'Esta pasta ainda não tem personagens.';
        roomCharacterSelectGrid.appendChild(empty);
        return;
    }

    folderCharacters.forEach(char => {
        const isSelected = selectedWalletCharIds.has(char.id);
        const card = document.createElement('div');
        card.className = `modal-char-card ${isSelected ? 'selected' : ''}`;
        card.style.background = isSelected ? '#191328' : '#161422';
        card.style.border = isSelected ? '1px solid #9333ea' : '1px solid #282436';
        card.style.borderRadius = '12px';
        card.style.padding = '18px 12px 14px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.cursor = 'pointer';

        const avatarHTML = char.avatar
            ? `<img src="${char.avatar}" alt="${char.name}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;">`
            : `<div style="width:52px;height:52px;border-radius:10px;border:2px dashed ${char.color};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;">${char.initials}</div>`;
        card.innerHTML = `<div style="margin-bottom:10px;">${avatarHTML}</div><span class="room-wallet-character-name"></span><button type="button" class="room-wallet-character-toggle">${isSelected ? '✓ Adicionado' : '+ Adicionar'}</button>`;
        card.querySelector('.room-wallet-character-name').textContent = char.name;
        card.querySelector('.room-wallet-character-toggle').classList.toggle('selected', isSelected);
        card.addEventListener('click', () => {
            if (selectedWalletCharIds.has(char.id)) selectedWalletCharIds.delete(char.id);
            else selectedWalletCharIds.add(char.id);
            renderModalCharacterGrid();
        });
        roomCharacterSelectGrid.appendChild(card);
    });
}
async function confirmAddCharacters() {
    if (!chatState.roomId) return;

    const currentInRoom = new Set(chatState.roomCharacters.map(rc => rc.id));
    const toAdd = [...selectedWalletCharIds].filter(id => !currentInRoom.has(id));
    const toRemove = chatState.roomCharacters.filter(rc => !selectedWalletCharIds.has(rc.id)).map(rc => rc.id);

    let changed = false;
    if (toAdd.length > 0) {
        const records = toAdd.map(charId => ({
            room_id: chatState.roomId,
            character_id: charId,
            owner_id: chatState.currentUser.id,
            last_used_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('room_characters').insert(records);
        if (error) {
            console.error('Falha ao adicionar personagens à sala:', error);
            if (changed) { await syncRoomCharacters(); await broadcastRoomCharactersChanged(); }
            alert('Não foi possível adicionar os personagens à sala.');
            return;
        }
        changed = true;
    }

    if (toRemove.length > 0) {
        const { error } = await supabase
            .from('room_characters')
            .delete()
            .eq('room_id', chatState.roomId)
            .in('character_id', toRemove);
        if (error) {
            console.error('Falha ao remover personagens da sala:', error);
            if (changed) { await syncRoomCharacters(); await broadcastRoomCharactersChanged(); }
            alert('Não foi possível remover os personagens da sala.');
            return;
        }
        changed = true;
    }

    await fetchRoomCharacters();
    
    if (!chatState.activeCharacterId && chatState.roomCharacters.length > 0) {
        const myChar = chatState.roomCharacters.find(c => c.ownerId === chatState.currentUser.id);
        if (myChar) chatState.activeCharacterId = myChar.id;
    }

    closeAddCharacterModal();
    renderDeck();
    updateInputUI();
    if (changed) await broadcastRoomCharactersChanged();
}

// ==========================================
// 8. CONTEXT MENU & AÇÕES INDIVIDUAIS
// ==========================================
function showContextMenu(event, character) {
    removeContextMenu();

    const isMyChar = character.ownerId === chatState.currentUser.id;
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.id = 'char-context-menu';
    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${event.clientX}px`;

    if (isMyChar) {
        menu.innerHTML = `
            <div class="context-menu-item" data-action="soltar">${ICONS.unlock} Soltar</div>
            <div class="context-menu-item danger" data-action="excluir">${ICONS.trash} Remover da sala</div>
        `;
    } else if (character.ownerId === null) {
        menu.innerHTML = `
            <div class="context-menu-item" data-action="assumir">${ICONS.hand} Assumir</div>
            <div class="context-menu-item danger" data-action="excluir">${ICONS.trash} Remover da sala</div>
        `;
    } else {
        menu.innerHTML = `<div class="context-menu-item" style="opacity: 0.6;">${ICONS.user} ${character.ownerName || 'Outro jogador'}</div>`;
    }

    document.body.appendChild(menu);

    menu.addEventListener('click', (e) => {
        const action = e.target.closest('.context-menu-item')?.getAttribute('data-action');
        if (action === 'assumir') assumirPersonagem(character.id);
        if (action === 'soltar') soltarPersonagem(character.id);
        if (action === 'excluir') excluirPersonagem(character.id);
        removeContextMenu();
    });
}

function removeContextMenu() {
    const existing = document.getElementById('char-context-menu');
    if (existing) existing.remove();
}

async function assumirPersonagem(charId) {
    const { error } = await supabase
        .from('room_characters')
        .update({ owner_id: chatState.currentUser.id, last_used_at: new Date().toISOString() })
        .eq('room_id', chatState.roomId)
        .eq('character_id', charId)
        .is('owner_id', null);

    if (!error) {
        await fetchRoomCharacters();
        if (chatState.roomCharacters.some(character => character.id === charId && character.ownerId === chatState.currentUser.id)) {
            chatState.activeCharacterId = charId;
            await broadcastRoomCharactersChanged();
        } else {
            alert('Outro integrante assumiu esse personagem primeiro. A lista foi atualizada.');
        }
        renderDeck();
        updateInputUI();
    } else {
        console.error('Falha ao assumir personagem:', error);
        await syncRoomCharacters();
    }
}

async function soltarPersonagem(charId) {
    const { data, error } = await supabase
        .from('room_characters')
        .update({ owner_id: null, last_used_at: null })
        .eq('room_id', chatState.roomId)
        .eq('character_id', charId)
        .eq('owner_id', chatState.currentUser.id)
        .select('id');

    if (!error) {
        await fetchRoomCharacters();
        if (chatState.activeCharacterId === charId) chatState.activeCharacterId = null;
        renderDeck();
        updateInputUI();
        if (data?.length) await broadcastRoomCharactersChanged();
    } else {
        console.error('Falha ao soltar personagem:', error);
        await syncRoomCharacters();
    }
}

async function excluirPersonagem(charId) {
    if (!confirm("Remover este personagem da sala?")) return;

    const { data, error } = await supabase
        .from('room_characters')
        .delete()
        .eq('room_id', chatState.roomId)
        .eq('character_id', charId)
        .or(`owner_id.eq.${chatState.currentUser.id},owner_id.is.null`)
        .select('id');

    if (!error) {
        await fetchRoomCharacters();
        if (chatState.activeCharacterId === charId) chatState.activeCharacterId = null;
        renderDeck();
        updateInputUI();
        if (data?.length) await broadcastRoomCharactersChanged();
    } else {
        console.error('Falha ao remover personagem da sala:', error);
        await syncRoomCharacters();
    }
}

// ==========================================
// 9. INTERFACE DO INPUT E ENVIO MENSAGENS
// ==========================================
function updateInputUI() {
    const activeChar = chatState.roomCharacters.find(
        c => c.id === chatState.activeCharacterId && c.ownerId === chatState.currentUser.id
    );
    if (chatState.isEncenacaoEnabled && activeChar) {
        if (inputAvatar && activeChar.avatar) inputAvatar.src = activeChar.avatar;
        if (inputRoleLabel) {
            inputRoleLabel.textContent = `Falando como ${activeChar.name}`;
            inputRoleLabel.classList.remove('hidden');
        }
        if (chatInput && !chatInput.disabled) chatInput.placeholder = `${activeChar.name} diz...`;
    } else {
        if (inputAvatar) inputAvatar.src = chatState.currentUser.avatar;
        if (inputRoleLabel) inputRoleLabel.classList.add('hidden');
        if (chatInput && !chatInput.disabled) chatInput.placeholder = "Digite sua mensagem base...";
    }
}

if (toggleEncenacao) {
    toggleEncenacao.addEventListener('change', (e) => {
        chatState.isEncenacaoEnabled = e.target.checked;
        if (characterBar) characterBar.classList.toggle('hidden', !chatState.isEncenacaoEnabled);
        renderDeck();
        updateInputUI();
    });
}

// Função unificada para envio de mensagens
async function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || !chatState.roomId) return;

    const activeChar = chatState.roomCharacters.find(
        c => c.id === chatState.activeCharacterId && c.ownerId === chatState.currentUser.id
    );
    const replyTarget = chatState.replyTarget;

    chatInput.value = '';
    clearTimeout(chatState.typingStopTimer);
    sendTypingEvent(false);

    const messageRecord = {
        room_id: chatState.roomId,
        user_id: chatState.currentUser.id,
        character_id: chatState.isEncenacaoEnabled && activeChar ? activeChar.id : null,
        content,
        is_encenacao: chatState.isEncenacaoEnabled && !!activeChar
    };
    let insertRequest = supabase
        .from('messages')
        .insert(replyTarget ? { ...messageRecord, reply_to_id: replyTarget.id } : messageRecord)
        .select(replyTarget
            ? 'id, room_id, user_id, character_id, content, created_at, is_encenacao, reply_to_id, deleted_at'
            : 'id, room_id, user_id, character_id, content, created_at, is_encenacao')
        .single();

    let { data: insertedMessage, error } = await insertRequest;
    if (error && replyTarget && isOptionalMessageSchemaError(error)) {
        chatInput.value = content;
        alert('Para responder mensagens, aplique a migration de respostas no Supabase e tente novamente.');
        return;
    }

    if (error) {
        console.error("Erro ao enviar mensagem:", error);
        chatInput.value = content; 
        return;
    }

    // A atualização visual não depende da publicação do evento Realtime.
    const character = chatState.isEncenacaoEnabled && activeChar
        ? {
            id: activeChar.id,
            name: activeChar.name,
            avatar_url: activeChar.avatar,
            color: activeChar.color,
            initials: activeChar.initials,
            description: activeChar.description
        }
        : null;
    const message = { ...insertedMessage, characters: character };
    if (replyTarget) message.reply = {
        id: replyTarget.id,
        content: replyTarget.content,
        user_id: replyTarget.user_id,
        deleted_at: replyTarget.deleted_at
    };
    clearReplyTarget();
    appendMessageToUI(message);
    await broadcastMessage(message);
}

if (chatInput) {
    chatInput.addEventListener('input', updateTypingState);
    chatInput.addEventListener('blur', () => {
        clearTimeout(chatState.typingStopTimer);
        sendTypingEvent(false);
    });
    chatInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    });
}

if (btnSend) {
    btnSend.addEventListener('click', async (e) => {
        e.preventDefault();
        await sendMessage();
    });
}

// ==========================================
// 10. LISTENERS DOS MODAIS E BOOT
// ==========================================

if (btnCloseRoomCharModal) btnCloseRoomCharModal.addEventListener('click', closeAddCharacterModal);
if (btnConfirmRoomChars) btnConfirmRoomChars.addEventListener('click', confirmAddCharacters);

if (modalAddRoomChar) {
    modalAddRoomChar.addEventListener('click', (e) => {
        if (e.target === modalAddRoomChar) closeAddCharacterModal();
    });
}

initChat();
