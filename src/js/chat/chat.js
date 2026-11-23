import { supabase } from '../config/supabase.js';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
const MESSAGES_PAGE_SIZE = 10;
const RTC_ICE_CONFIG = {
    iceCandidatePoolSize: 10,
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

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
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    spinner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-opacity="0.25"></circle><path d="M21 12a9 9 0 0 0-9-9"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.75s" repeatCount="indefinite"/></path></svg>`,
    playerPlay: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>`,
    playerPause: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`,
    playerPlayLarge: `<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><polygon points="7 4 21 12 7 20 7 4"></polygon></svg>`,
    playerPauseLarge: `<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`,
    volumeHigh: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
    volumeMuted: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
    fullscreenEnter: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    fullscreenExit: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`
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
    oldestMessageCursor: null,
    hasMoreOlderMessages: false,
    isLoadingOlderMessages: false,
    isResettingRoomState: false,
    wasHiddenOrLeft: false,
    unreadSinceTimestamp: null,
    unreadDividerInserted: false,
    renderedMessageIds: new Set(),
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
    mediaBroadcasterId: null,
    isMediaBroadcaster: false,
    mediaChannel: null,
    mediaRealtimeConnected: false,
    mediaRealtimeError: false,
    mediaAssets: [], // Vídeos pré-carregados completamente em memória local (Blob URL)
    isPreloadingMedia: false,
    activeMedia: null,
    localMediaStream: null,
    canvasCaptureCleanup: null,
    hostPeerConnections: new Map(), // peerId -> RTCPeerConnection
    viewerPeerConnection: null,
    pendingViewerIceCandidates: [],
    pendingHostIceCandidates: new Map(), // peerId -> RTCIceCandidateInit[]
    mediaMutedForAutoplay: false,
    playerHudTimer: null,
    isScrubbingTimeline: false,
    roomUsers: new Map(),
    onlineUsers: new Map(),
    loadedAvatarUrls: new Set(),
    unlockedCharacterPages: new Set([0]),
    characterDescriptionsCache: new Map(),
    mentionMenuOpen: false,
    mentionTriggerStart: -1,
    mentionQuery: '',
    mentionFilteredCharacters: [],
    mentionSelectedIndex: 0,
    mentionHighlightTimer: null
};

let userWalletCharacters = [];
let userWalletFolders = [];
let activeWalletFolderId = null;
const selectedWalletCharIds = new Set();
const UNFILED_WALLET_FOLDER = '__unfiled__';

// ==========================================
// 2.1. MARCAÇÃO DE LEITURA E ATIVIDADE DA SALA
// ==========================================
function captureInitialUnreadBaseline() {
    if (!chatState.roomId || !chatState.currentUser.id) return;
    const roomKey = String(chatState.roomId);

    const sessionKey = `chatUnreadSince_${roomKey}`;
    const fromSession = Number(sessionStorage.getItem(sessionKey) || 0);
    if (fromSession > 0) {
        sessionStorage.removeItem(sessionKey);
        chatState.unreadSinceTimestamp = fromSession;
        return;
    }

    try {
        const readKey = `roomLastRead_${chatState.currentUser.id}`;
        const readMap = JSON.parse(localStorage.getItem(readKey) || '{}');
        const lastRead = Number(readMap[roomKey] || 0);
        chatState.unreadSinceTimestamp = lastRead > 0 ? lastRead : null;
    } catch {
        chatState.unreadSinceTimestamp = null;
    }
}

function removeUnreadDivider() {
    document.getElementById('chat-unread-divider')?.remove();
    chatState.unreadDividerInserted = false;
    chatState.unreadSinceTimestamp = null;
}

function createUnreadDividerElement() {
    const divider = document.createElement('div');
    divider.id = 'chat-unread-divider';
    divider.className = 'chat-unread-divider';
    divider.setAttribute('role', 'separator');
    divider.setAttribute('aria-label', 'Não lida');
    divider.innerHTML = '<span>Não lida</span>';
    return divider;
}

function markCurrentRoomAsViewed(timestamp = Date.now()) {
    if (!chatState.roomId || !chatState.currentUser.id) return;
    if (document.visibilityState === 'hidden') return;

    const roomKey = String(chatState.roomId);
    const readKey = `roomLastRead_${chatState.currentUser.id}`;
    const usedKey = `roomLastUsed_${chatState.currentUser.id}`;

    try {
        const readMap = JSON.parse(localStorage.getItem(readKey) || '{}');
        readMap[roomKey] = Math.max(Number(readMap[roomKey] || 0), timestamp);
        localStorage.setItem(readKey, JSON.stringify(readMap));

        const usedMap = JSON.parse(localStorage.getItem(usedKey) || '{}');
        usedMap[roomKey] = Math.max(Number(usedMap[roomKey] || 0), timestamp);
        localStorage.setItem(usedKey, JSON.stringify(usedMap));
    } catch (error) {
        console.warn('Não foi possível atualizar o status de visualização da sala:', error);
    }
}

// ==========================================
// 3. ELEMENTOS DO DOM
// ==========================================
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const sidebarAvatar = document.getElementById('sidebar-avatar');

const roomTitle = document.getElementById('room-title') || document.querySelector('.room-title');
const roomSubtitle = document.getElementById('room-members-count') || document.querySelector('.room-subtitle');
const roomMembersAvatars = document.getElementById('members-stack') || document.getElementById('room-members-avatars') || document.querySelector('.room-avatars') || document.querySelector('.header-avatars');

const roomInviteCode = document.getElementById('room-invite-code');
const btnCopyInvite = document.getElementById('btn-copy-invite');
const inviteCopyIcon = document.getElementById('invite-copy-icon');
const inviteCopyFeedback = document.getElementById('invite-copy-feedback');

const chatBackgroundArea = document.getElementById('chat-background') || document.querySelector('.chat-area') || document.querySelector('.main-content');
const chatMessagesContainer = document.getElementById('chat-messages') || document.querySelector('.messages-container') || document.querySelector('.chat-messages');
let characterProfileModal = null;
let activeCharacterPage = 0;
let characterSwipeStartX = null;
let characterAvatarObserver = null;
const CHARACTER_AVATAR_BATCH_SIZE = 10;

const toggleEncenacao = document.getElementById('toggle-encenacao');
const characterBar = document.getElementById('character-bar');
const characterList = document.getElementById('character-list');
const characterListViewport = document.getElementById('character-list-viewport');
const characterPageIndicators = document.getElementById('character-page-indicators');
const btnAddCharacterMobile = document.getElementById('btn-add-personagem-mobile');
const hostMediaControls = document.getElementById('host-media-controls');
const mediaControlsToggle = document.getElementById('media-controls-toggle');
const chatHeader = document.querySelector('.chat-header');
const mediaFileInput = document.getElementById('media-file-input');
const btnAddMedia = document.getElementById('btn-add-media');
const mediaPreloadProgress = document.getElementById('media-preload-progress');
const mediaPreloadFill = document.getElementById('media-preload-fill');
const mediaPreloadLabel = document.getElementById('media-preload-label');
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

// Elementos do Player Customizado theGlobe
const globePlayerCenterTrigger = document.getElementById('globe-player-center-trigger');
const globePlayerCenterIcon = document.getElementById('globe-player-center-icon');
const globeBtnPlayPause = document.getElementById('globe-btn-play-pause');
const globeBtnRewind = document.getElementById('globe-btn-rewind');
const globeBtnForward = document.getElementById('globe-btn-forward');
const globeBtnMute = document.getElementById('globe-btn-mute');
const globeVolumeSlider = document.getElementById('globe-volume-slider');
const globeBtnFullscreen = document.getElementById('globe-btn-fullscreen');
const globePlayerScrubber = document.getElementById('globe-player-scrubber');
const globePlayerFill = document.getElementById('globe-player-fill');
const globePlayerBuffer = document.getElementById('globe-player-buffer');
const globePlayerCurrentTime = document.getElementById('globe-player-current-time');
const globePlayerDuration = document.getElementById('globe-player-duration');

const mentionDropdown = document.getElementById('mention-dropdown');
const inputAvatar = document.getElementById('input-avatar');
const inputRoleLabel = document.getElementById('input-role-label');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const typingIndicator = document.getElementById('typing-indicator');
const replyComposer = document.getElementById('reply-composer');
const replyComposerName = document.getElementById('reply-composer-name');
const replyComposerText = document.getElementById('reply-composer-text');

// ==========================================
// VIEWPORT MOBILE / TECLADO VIRTUAL
// ==========================================
let baselineViewportHeight = window.innerHeight;

function syncMobileViewport() {
    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;

    if (height > baselineViewportHeight) baselineViewportHeight = height;

    document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);

    const keyboardOpen = baselineViewportHeight - height > 150;
    document.body.classList.toggle('keyboard-open', keyboardOpen);

    window.scrollTo(0, 0);

    if (keyboardOpen) scrollToLatestMessage();
}

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        baselineViewportHeight = window.visualViewport?.height || window.innerHeight;
        syncMobileViewport();
    }, 300);
});

syncMobileViewport();
window.visualViewport?.addEventListener('resize', syncMobileViewport);
window.visualViewport?.addEventListener('scroll', syncMobileViewport);
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
    chatState.currentUser.name = metadata?.custom_name || metadata?.full_name || metadata?.name || 'Usuário';
    chatState.currentUser.email = session.user.email || '';
    chatState.currentUser.avatar = metadata?.custom_avatar_url || metadata?.avatar_url || DEFAULT_AVATAR;

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
        captureInitialUnreadBaseline();
        markCurrentRoomAsViewed();
        
        await loadRoomDetails();
        setupPresence(); 
        setupMediaBroadcast();
        subscribeToMessages();
        setupMessageHistoryScroll();

        await Promise.all([
            loadRoomUserProfiles(),
            fetchRoomCharacters(),
            fetchMessages()
        ]);

        chatState.roomCharacters.forEach(char => {
            if (char.ownerId && char.ownerId !== chatState.currentUser.id) {
                char.ownerName = chatState.roomUsers.get(char.ownerId)?.name || chatState.onlineUsers.get(char.ownerId)?.name || char.ownerName || 'Usuário';
            }
        });

        refreshMessageMentionsInDOM();
        chatState.activeCharacterId = null;

        startMessageSyncLoop();
    } else if (roomTitle) {
        roomTitle.textContent = "Sala Desconhecida (Acesse pelo Dashboard)";
    }

    renderDeck();
    updateInputUI();

    document.addEventListener('click', removeContextMenu);

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

            if (chatState.isMediaBroadcaster) {
                for (const peerId of chatState.hostPeerConnections.keys()) {
                    if (!uniqueUsers.has(peerId)) {
                        closeHostPeerConnection(peerId);
                    }
                }
            }

            chatState.onlineUsers = uniqueUsers;
            if (chatState.isMediaBroadcaster && chatState.activeMedia) {
                for (const peerId of uniqueUsers.keys()) {
                    if (peerId !== chatState.currentUser.id) createOfferForViewer(peerId);
                }
            }
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
            
            avatarEl.style.width = '28px';
            avatarEl.style.height = '28px';
            avatarEl.style.borderRadius = '50%';
            avatarEl.style.border = '2px solid #13141a';
            avatarEl.style.marginLeft = index > 0 ? '-8px' : '0';
            avatarEl.style.display = 'inline-flex';
            avatarEl.style.alignItems = 'center';
            avatarEl.style.justifyContent = 'center';
            avatarEl.style.backgroundColor = '#9333ea';
            avatarEl.style.color = '#fff';
            avatarEl.style.fontSize = '11px';
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
            extraEl.style.width = '28px';
            extraEl.style.height = '28px';
            extraEl.style.borderRadius = '50%';
            extraEl.style.border = '2px solid #13141a';
            extraEl.style.marginLeft = '-8px';
            extraEl.style.display = 'inline-flex';
            extraEl.style.alignItems = 'center';
            extraEl.style.justifyContent = 'center';
            extraEl.style.backgroundColor = '#2f334d';
            extraEl.style.color = 'white';
            extraEl.style.fontSize = '10px';
            extraEl.style.fontWeight = 'bold';
            extraEl.style.zIndex = 0;
            extraEl.textContent = `+${extraCount}`;
            roomMembersAvatars.appendChild(extraEl);
        }
    }
}

// ==========================================
// 4.2 DETALHES DA SALA
// ==========================================
async function loadRoomDetails() {
    const { data: room, error } = await supabase
        .from('rooms')
        .select('title, wallpaper_url, invite_code, created_by')
        .eq('id', chatState.roomId)
        .single();

    if (room && !error) {
        chatState.hostUserId = room.created_by;
        chatState.isHost = room.created_by === chatState.currentUser.id;
        if (hostMediaControls) hostMediaControls.classList.remove('hidden');
        if (mediaControlsToggle) mediaControlsToggle.classList.remove('hidden');
        renderLocalMediaLibrary();
        if (roomTitle) roomTitle.textContent = room.title;
        
        if (roomInviteCode) {
            roomInviteCode.textContent = room.invite_code || '------';
        }

        if (btnCopyInvite && room.invite_code) {
            btnCopyInvite.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(room.invite_code);
                    if (inviteCopyIcon) inviteCopyIcon.classList.add('hidden');
                    if (inviteCopyFeedback) inviteCopyFeedback.classList.remove('hidden');
                    setTimeout(() => {
                        if (inviteCopyFeedback) inviteCopyFeedback.classList.add('hidden');
                        if (inviteCopyIcon) inviteCopyIcon.classList.remove('hidden');
                    }, 1800);
                } catch {}
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

// ==========================================
// 4.3 TRANSMISSÃO TEMPORÁRIA DE VÍDEO LOCAL (PLAYER THEGLOBE + WEBRTC P2P)
// ==========================================
function formatMediaTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function revealGlobePlayerHud() {
    if (!mediaBroadcast || mediaBroadcast.classList.contains('hidden')) return;
    mediaBroadcast.classList.add('hud-visible');
    clearTimeout(chatState.playerHudTimer);
    if (mediaBroadcastVideo && !mediaBroadcastVideo.paused) {
        chatState.playerHudTimer = setTimeout(() => {
            mediaBroadcast.classList.remove('hud-visible');
        }, 2800);
    }
}

function syncGlobePlayerControlsUI() {
    if (!mediaBroadcastVideo || !mediaBroadcast) return;

    const isPaused = mediaBroadcastVideo.paused;
    mediaBroadcast.classList.toggle('is-paused', isPaused);
    mediaBroadcast.classList.toggle('is-viewer', !chatState.isMediaBroadcaster);

    if (globeBtnPlayPause) {
        globeBtnPlayPause.innerHTML = isPaused ? ICONS.playerPlay : ICONS.playerPause;
        globeBtnPlayPause.setAttribute('aria-label', isPaused ? 'Reproduzir' : 'Pausar');
    }
    if (globePlayerCenterIcon) {
        globePlayerCenterIcon.innerHTML = isPaused ? ICONS.playerPlayLarge : ICONS.playerPauseLarge;
    }

    const isMuted = mediaBroadcastVideo.muted || mediaBroadcastVideo.volume === 0;
    if (globeBtnMute) {
        globeBtnMute.innerHTML = isMuted ? ICONS.volumeMuted : ICONS.volumeHigh;
    }
    if (globeVolumeSlider) {
        globeVolumeSlider.value = isMuted ? '0' : String(mediaBroadcastVideo.volume);
    }

    const duration = mediaBroadcastVideo.duration;
    const current = mediaBroadcastVideo.currentTime || 0;
    if (globePlayerCurrentTime) globePlayerCurrentTime.textContent = formatMediaTime(current);
    if (globePlayerDuration) {
        globePlayerDuration.textContent = Number.isFinite(duration) && duration > 0 ? formatMediaTime(duration) : 'AO VIVO';
    }

    if (!chatState.isScrubbingTimeline && globePlayerFill) {
        const pct = Number.isFinite(duration) && duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 100;
        globePlayerFill.style.width = `${pct}%`;
        globePlayerScrubber?.setAttribute('aria-valuenow', String(Math.round(pct)));
    }

    if (globePlayerBuffer && Number.isFinite(duration) && duration > 0 && mediaBroadcastVideo.buffered?.length) {
        const bufferedEnd = mediaBroadcastVideo.buffered.end(mediaBroadcastVideo.buffered.length - 1);
        const bufPct = Math.min(100, Math.max(0, (bufferedEnd / duration) * 100));
        globePlayerBuffer.style.width = `${bufPct}%`;
    }

    if (globeBtnFullscreen) {
        const isFs = document.fullscreenElement === mediaBroadcast;
        globeBtnFullscreen.innerHTML = isFs ? ICONS.fullscreenExit : ICONS.fullscreenEnter;
    }

    if (isPaused) {
        mediaBroadcast.classList.add('hud-visible');
        clearTimeout(chatState.playerHudTimer);
    }
}

function scrubGlobePlayerToClientX(clientX) {
    if (!chatState.isMediaBroadcaster || !globePlayerScrubber || !mediaBroadcastVideo) return;
    const duration = mediaBroadcastVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const rect = globePlayerScrubber.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    mediaBroadcastVideo.currentTime = ratio * duration;
    if (globePlayerFill) globePlayerFill.style.width = `${ratio * 100}%`;
    syncGlobePlayerControlsUI();
}

function setupGlobePlayerInteractions() {
    if (!mediaBroadcast || !mediaBroadcastVideo) return;

    mediaBroadcastVideo.controls = false;
    mediaBroadcastVideo.disablePictureInPicture = true;

    ['mousemove', 'pointerdown', 'touchstart'].forEach(evt => {
        mediaBroadcast.addEventListener(evt, revealGlobePlayerHud, { passive: true });
    });

    const toggleHostPlayPause = () => {
        if (!chatState.isMediaBroadcaster) {
            revealGlobePlayerHud();
            return;
        }
        if (mediaBroadcastVideo.paused) {
            mediaBroadcastVideo.play().catch(() => {});
        } else {
            mediaBroadcastVideo.pause();
        }
        syncGlobePlayerControlsUI();
        revealGlobePlayerHud();
    };

    globePlayerCenterTrigger?.addEventListener('click', toggleHostPlayPause);
    globeBtnPlayPause?.addEventListener('click', toggleHostPlayPause);

    globeBtnRewind?.addEventListener('click', () => {
        if (!chatState.isMediaBroadcaster) return;
        mediaBroadcastVideo.currentTime = Math.max(0, (mediaBroadcastVideo.currentTime || 0) - 10);
        syncGlobePlayerControlsUI();
        revealGlobePlayerHud();
    });

    globeBtnForward?.addEventListener('click', () => {
        if (!chatState.isMediaBroadcaster) return;
        const maxTime = Number.isFinite(mediaBroadcastVideo.duration) ? mediaBroadcastVideo.duration : Infinity;
        mediaBroadcastVideo.currentTime = Math.min(maxTime, (mediaBroadcastVideo.currentTime || 0) + 10);
        syncGlobePlayerControlsUI();
        revealGlobePlayerHud();
    });

    globeBtnMute?.addEventListener('click', () => {
        mediaBroadcastVideo.muted = !mediaBroadcastVideo.muted;
        if (!mediaBroadcastVideo.muted && mediaBroadcastVideo.volume === 0) {
            mediaBroadcastVideo.volume = 0.8;
        }
        syncGlobePlayerControlsUI();
        revealGlobePlayerHud();
    });

    globeVolumeSlider?.addEventListener('input', () => {
        const val = Number(globeVolumeSlider.value);
        mediaBroadcastVideo.volume = val;
        mediaBroadcastVideo.muted = val === 0;
        syncGlobePlayerControlsUI();
        revealGlobePlayerHud();
    });

    globeBtnFullscreen?.addEventListener('click', () => {
        if (document.fullscreenElement === mediaBroadcast) {
            document.exitFullscreen().catch(() => {});
        } else if (mediaBroadcast.requestFullscreen) {
            mediaBroadcast.requestFullscreen().catch(() => {});
        }
        revealGlobePlayerHud();
    });

    document.addEventListener('fullscreenchange', syncGlobePlayerControlsUI);

    if (globePlayerScrubber) {
        globePlayerScrubber.addEventListener('pointerdown', (e) => {
            if (!chatState.isMediaBroadcaster) return;
            chatState.isScrubbingTimeline = true;
            globePlayerScrubber.setPointerCapture?.(e.pointerId);
            scrubGlobePlayerToClientX(e.clientX);
        });

        globePlayerScrubber.addEventListener('pointermove', (e) => {
            if (!chatState.isScrubbingTimeline) return;
            scrubGlobePlayerToClientX(e.clientX);
        });

        const stopScrubbing = () => {
            if (!chatState.isScrubbingTimeline) return;
            chatState.isScrubbingTimeline = false;
            syncGlobePlayerControlsUI();
        };

        globePlayerScrubber.addEventListener('pointerup', stopScrubbing);
        globePlayerScrubber.addEventListener('pointercancel', stopScrubbing);
    }

    ['play', 'pause', 'timeupdate', 'durationchange', 'progress', 'volumechange'].forEach(evt => {
        mediaBroadcastVideo.addEventListener(evt, syncGlobePlayerControlsUI);
    });
}

function setMediaPreloadProgressUI({ visible, percent = 0, label = '' }) {
    if (!mediaPreloadProgress) return;
    mediaPreloadProgress.classList.toggle('hidden', !visible);
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    mediaPreloadProgress.setAttribute('aria-valuenow', String(clamped));
    if (mediaPreloadFill) {
        mediaPreloadFill.style.width = `${clamped}%`;
    }
    if (mediaPreloadLabel && label) {
        mediaPreloadLabel.textContent = label;
    }
}

function renderLocalMediaLibrary() {
    if (!mediaLibrary) return;
    const previous = mediaLibrary.value;
    mediaLibrary.replaceChildren(
        new Option(chatState.mediaAssets.length ? 'Selecione um vídeo' : 'Nenhum vídeo adicionado', '')
    );
    chatState.mediaAssets.forEach(asset => {
        const label = asset.ready ? asset.name : `${asset.name} (carregando...)`;
        mediaLibrary.add(new Option(label, asset.id));
    });
    mediaLibrary.value = chatState.mediaAssets.some(asset => asset.id === previous)
        ? previous
        : (chatState.mediaAssets[0]?.id || '');
    mediaLibrary.disabled = !chatState.mediaAssets.length || chatState.isPreloadingMedia;
    updateMediaButtons();
}

function updateMediaButtons() {
    const selectedAsset = chatState.mediaAssets.find(asset => asset.id === mediaLibrary?.value);
    const isReady = Boolean(selectedAsset && selectedAsset.ready);
    if (btnAddMedia) btnAddMedia.disabled = chatState.isPreloadingMedia;
    if (btnBroadcastMedia) {
        btnBroadcastMedia.disabled = !isReady || chatState.isPreloadingMedia || !chatState.mediaRealtimeConnected;
    }
    if (btnDeleteMedia) {
        btnDeleteMedia.disabled = !selectedAsset || chatState.isPreloadingMedia;
    }
    if (mediaChannelStatus) {
        mediaChannelStatus.textContent = chatState.mediaRealtimeError
            ? 'Canal de sinalização indisponível'
            : '';
        mediaChannelStatus.classList.toggle('hidden', !chatState.mediaRealtimeError);
        mediaChannelStatus.classList.toggle('media-channel-status-error', chatState.mediaRealtimeError);
    }
}

function preloadFileIntoMemoryBlob(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onprogress = (event) => {
            if (event.lengthComputable && typeof onProgress === 'function') {
                onProgress((event.loaded / event.total) * 100);
            }
        };

        reader.onload = () => {
            try {
                const buffer = reader.result;
                const memoryBlob = new Blob([buffer], { type: file.type || 'video/mp4' });
                const blobUrl = URL.createObjectURL(memoryBlob);
                resolve(blobUrl);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => {
            reject(reader.error || new Error('Falha ao carregar o arquivo de vídeo em memória.'));
        };

        reader.readAsArrayBuffer(file);
    });
}

function warmupVideoMetadataAndFirstFrame(blobUrl) {
    return new Promise((resolve, reject) => {
        const probeVideo = document.createElement('video');
        probeVideo.preload = 'auto';
        probeVideo.muted = true;
        probeVideo.playsInline = true;
        probeVideo.src = blobUrl;

        let settled = false;
        const cleanup = () => {
            probeVideo.removeEventListener('loadeddata', onReady);
            probeVideo.removeEventListener('canplaythrough', onReady);
            probeVideo.removeEventListener('error', onError);
            probeVideo.pause();
            probeVideo.removeAttribute('src');
            probeVideo.load();
        };

        const onReady = () => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve();
        };

        const onError = () => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error('O navegador não conseguiu decodificar este vídeo.'));
        };

        probeVideo.addEventListener('loadeddata', onReady, { once: true });
        probeVideo.addEventListener('canplaythrough', onReady, { once: true });
        probeVideo.addEventListener('error', onError, { once: true });
        probeVideo.load();
    });
}

async function addLocalMediaFiles(files) {
    if (!files?.length || chatState.isPreloadingMedia) return;

    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
    if (!videoFiles.length) return;

    chatState.isPreloadingMedia = true;
    renderLocalMediaLibrary();
    updateMediaButtons();

    let addedLastId = null;

    try {
        for (let i = 0; i < videoFiles.length; i += 1) {
            const file = videoFiles[i];
            const prefix = videoFiles.length > 1 ? `(${i + 1}/${videoFiles.length}) ` : '';

            setMediaPreloadProgressUI({
                visible: true,
                percent: 0,
                label: `${prefix}Carregando vídeo... 0%`
            });

            const objectUrl = await preloadFileIntoMemoryBlob(file, (pct) => {
                const scaledPct = Math.round(pct * 0.9);
                setMediaPreloadProgressUI({
                    visible: true,
                    percent: scaledPct,
                    label: `${prefix}Carregando vídeo... ${scaledPct}%`
                });
            });

            setMediaPreloadProgressUI({
                visible: true,
                percent: 95,
                label: `${prefix}Preparando vídeo... 95%`
            });

            try {
                await warmupVideoMetadataAndFirstFrame(objectUrl);
            } catch (decodeError) {
                URL.revokeObjectURL(objectUrl);
                throw decodeError;
            }

            const id = crypto.randomUUID();
            chatState.mediaAssets.push({
                id,
                name: file.name,
                file,
                url: objectUrl,
                ready: true
            });
            addedLastId = id;

            setMediaPreloadProgressUI({
                visible: true,
                percent: 100,
                label: `${prefix}Vídeo pronto (100%)`
            });
        }
    } catch (error) {
        console.error('Erro ao pré-carregar vídeo:', error);
        alert(error?.message || 'Não foi possível carregar este vídeo.');
        setMediaPreloadProgressUI({ visible: false });
    } finally {
        chatState.isPreloadingMedia = false;
        renderLocalMediaLibrary();
        if (addedLastId && mediaLibrary) {
            mediaLibrary.value = addedLastId;
        }
        updateMediaButtons();

        if (addedLastId) {
            setTimeout(() => {
                if (!chatState.isPreloadingMedia) {
                    setMediaPreloadProgressUI({ visible: false });
                }
            }, 1800);
        }
    }
}

function clearLocalMediaAssets() {
    chatState.mediaAssets.forEach(asset => {
        if (asset.url) URL.revokeObjectURL(asset.url);
    });
    chatState.mediaAssets = [];
    chatState.isPreloadingMedia = false;
    setMediaPreloadProgressUI({ visible: false });
    if (mediaLibrary) {
        mediaLibrary.replaceChildren(new Option('Nenhum vídeo adicionado', ''));
        mediaLibrary.value = '';
        mediaLibrary.disabled = true;
    }
    updateMediaButtons();
}

async function sendMediaSignal(event, payload) {
    if (!chatState.mediaChannel) return false;
    const result = await chatState.mediaChannel.send({
        type: 'broadcast',
        event,
        payload: {
            ...payload,
            from_id: chatState.currentUser.id,
            sent_at: Date.now()
        }
    });
    const status = typeof result === 'string' ? result : result?.status;
    return status === 'ok';
}

function closeHostPeerConnection(peerId) {
    const pc = chatState.hostPeerConnections.get(peerId);
    if (pc) {
        try { pc.close(); } catch (_) {}
        chatState.hostPeerConnections.delete(peerId);
    }
    chatState.pendingHostIceCandidates.delete(peerId);
}

function closeAllHostPeerConnections() {
    for (const peerId of [...chatState.hostPeerConnections.keys()]) {
        closeHostPeerConnection(peerId);
    }
}

function closeViewerPeerConnection() {
    if (chatState.viewerPeerConnection) {
        try { chatState.viewerPeerConnection.close(); } catch (_) {}
        chatState.viewerPeerConnection = null;
    }
    chatState.pendingViewerIceCandidates = [];
}

function waitForRenderedVideoFrame(videoEl, timeoutMs = 4000) {
    if (!videoEl) return Promise.resolve();
    return new Promise(resolve => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve();
        };
        const timer = setTimeout(finish, timeoutMs);

        if (typeof videoEl.requestVideoFrameCallback === 'function') {
            videoEl.requestVideoFrameCallback(() => finish());
            return;
        }

        const checkFrame = () => {
            if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.currentTime > 0) {
                finish();
            } else if (!settled) {
                requestAnimationFrame(checkFrame);
            }
        };
        requestAnimationFrame(checkFrame);
    });
}

function buildReliableLocalStream(videoEl) {
    if (!videoEl) return null;

    if (typeof chatState.canvasCaptureCleanup === 'function') {
        chatState.canvasCaptureCleanup();
        chatState.canvasCaptureCleanup = null;
    }

    let rawStream = null;
    if (typeof videoEl.captureStream === 'function') {
        rawStream = videoEl.captureStream(30);
    } else if (typeof videoEl.mozCaptureStream === 'function') {
        rawStream = videoEl.mozCaptureStream(30);
    }

    const rawVideoTracks = rawStream ? rawStream.getVideoTracks() : [];
    const rawAudioTracks = rawStream ? rawStream.getAudioTracks() : [];
    const hasLiveUnmutedVideo = rawVideoTracks.some(
        t => t.readyState === 'live' && !t.muted
    );

    if (rawStream && hasLiveUnmutedVideo) {
        return rawStream;
    }

    const width = videoEl.videoWidth || 1280;
    const height = videoEl.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });

    let stopped = false;
    const drawFrame = () => {
        if (stopped) return;
        if (videoEl.readyState >= 2 && !videoEl.paused && !videoEl.ended) {
            if (canvas.width !== videoEl.videoWidth && videoEl.videoWidth > 0) {
                canvas.width = videoEl.videoWidth;
                canvas.height = videoEl.videoHeight;
            }
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        }
        if (typeof videoEl.requestVideoFrameCallback === 'function') {
            videoEl.requestVideoFrameCallback(drawFrame);
        } else {
            requestAnimationFrame(drawFrame);
        }
    };
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    drawFrame();

    const canvasStream = canvas.captureStream(30);
    rawAudioTracks.forEach(track => canvasStream.addTrack(track));

    chatState.canvasCaptureCleanup = () => {
        stopped = true;
        canvasStream.getTracks().forEach(t => t.stop());
    };

    return canvasStream;
}

function preferCompatibleVideoCodecs(pc) {
    if (!pc || typeof pc.getTransceivers !== 'function') return;
    const capabilities = RTCRtpReceiver.getCapabilities?.('video');
    if (!capabilities?.codecs?.length) return;

    const preferredOrder = ['video/VP8', 'video/H264', 'video/VP9'];
    const sortedCodecs = [...capabilities.codecs].sort((a, b) => {
        const idxA = preferredOrder.findIndex(m => m.toLowerCase() === a.mimeType.toLowerCase());
        const idxB = preferredOrder.findIndex(m => m.toLowerCase() === b.mimeType.toLowerCase());
        const rankA = idxA === -1 ? 99 : idxA;
        const rankB = idxB === -1 ? 99 : idxB;
        return rankA - rankB;
    });

    pc.getTransceivers().forEach(transceiver => {
        if (transceiver.sender?.track?.kind === 'video' && typeof transceiver.setCodecPreferences === 'function') {
            try {
                transceiver.setCodecPreferences(sortedCodecs);
            } catch (_) {}
        }
    });
}

async function createOfferForViewer(viewerId) {
    if (!chatState.isMediaBroadcaster || !chatState.activeMedia || !chatState.localMediaStream) return;
    if (!viewerId || viewerId === chatState.currentUser.id) return;

    const existingConnection = chatState.hostPeerConnections.get(viewerId);
    if (existingConnection && !['failed', 'closed'].includes(existingConnection.connectionState)) return;

    closeHostPeerConnection(viewerId);

    const pc = new RTCPeerConnection(RTC_ICE_CONFIG);
    chatState.hostPeerConnections.set(viewerId, pc);

    chatState.localMediaStream.getTracks().forEach(track => {
        pc.addTrack(track, chatState.localMediaStream);
    });
    preferCompatibleVideoCodecs(pc);

    pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
            sendMediaSignal('webrtc_ice', {
                to_id: viewerId,
                candidate: candidate.toJSON()
            });
        }
    };

    pc.onconnectionstatechange = () => {
        if (['failed', 'closed'].includes(pc.connectionState)) {
            closeHostPeerConnection(viewerId);
        }
    };

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendMediaSignal('webrtc_offer', {
            to_id: viewerId,
            title: chatState.activeMedia.name,
            sdp: pc.localDescription
        });
    } catch (error) {
        console.error('Erro ao criar oferta WebRTC para espectador:', error);
        closeHostPeerConnection(viewerId);
    }
}

async function handleViewerOffer(payload) {
    if (chatState.isMediaBroadcaster) return;
    if (!payload.from_id || payload.from_id === chatState.currentUser.id) return;
    if (payload.to_id && payload.to_id !== chatState.currentUser.id) return;
    if (!payload.sdp || !mediaBroadcast || !mediaBroadcastVideo) return;

    closeViewerPeerConnection();
    chatState.mediaBroadcasterId = payload.from_id;

    const pc = new RTCPeerConnection(RTC_ICE_CONFIG);
    chatState.viewerPeerConnection = pc;
    const inboundStream = new MediaStream();

    pc.ontrack = (event) => {
        if (event.track && !inboundStream.getTracks().some(t => t.id === event.track.id)) {
            inboundStream.addTrack(event.track);
        }
        const remoteStream = event.streams?.[0] || inboundStream;

        mediaBroadcast.classList.remove('hidden');
        mediaBroadcastTitle.textContent = payload.title || 'Transmissão da sala';
        btnStopMedia?.classList.add('hidden');
        mediaBroadcastVideo.controls = false;
        mediaBroadcastVideo.playsInline = true;
        mediaBroadcastVideo.setAttribute('playsinline', '');
        mediaBroadcastVideo.setAttribute('webkit-playsinline', '');

        if (mediaBroadcastVideo.srcObject !== remoteStream) {
            mediaBroadcastVideo.srcObject = remoteStream;
        }

        mediaBroadcastVideo.muted = false;
        chatState.mediaMutedForAutoplay = false;
        btnEnableMediaAudio?.classList.add('hidden');
        mediaAutoplayNotice?.classList.add('hidden');

        const tryPlayRemote = () => {
            syncGlobePlayerControlsUI();
            revealGlobePlayerHud();

            mediaBroadcastVideo.play().then(() => {
                syncGlobePlayerControlsUI();
                revealGlobePlayerHud();
            }).catch(() => {
                showAutoplayFallback();
            });
        };

        tryPlayRemote();
        event.track.onunmute = () => {
            tryPlayRemote();
        };
    };

    pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
            sendMediaSignal('webrtc_ice', {
                to_id: chatState.mediaBroadcasterId,
                candidate: candidate.toJSON()
            });
        }
    };

    pc.onconnectionstatechange = () => {
        if (['failed', 'closed'].includes(pc.connectionState)) {
            closeMediaBroadcast(false);
        }
    };

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        const queued = chatState.pendingViewerIceCandidates.splice(0);
        for (const candidate of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendMediaSignal('webrtc_answer', {
            to_id: chatState.mediaBroadcasterId,
            sdp: pc.localDescription
        });
    } catch (error) {
        console.error('Erro ao aceitar transmissão WebRTC:', error);
        closeMediaBroadcast(false);
    }
}

async function handleHostAnswer(payload) {
    if (!chatState.isMediaBroadcaster) return;
    if (payload.to_id && payload.to_id !== chatState.currentUser.id) return;
    const pc = chatState.hostPeerConnections.get(payload.from_id);
    if (!pc || !payload.sdp) return;

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const queued = chatState.pendingHostIceCandidates.get(payload.from_id) || [];
        chatState.pendingHostIceCandidates.delete(payload.from_id);
        for (const candidate of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
    } catch (error) {
        console.error('Erro ao aplicar resposta WebRTC:', error);
    }
}

async function handleIceCandidate(payload) {
    if (payload.to_id && payload.to_id !== chatState.currentUser.id) return;
    if (!payload.candidate) return;

    if (chatState.isMediaBroadcaster) {
        const pc = chatState.hostPeerConnections.get(payload.from_id);
        if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
        } else {
            const list = chatState.pendingHostIceCandidates.get(payload.from_id) || [];
            list.push(payload.candidate);
            chatState.pendingHostIceCandidates.set(payload.from_id, list);
        }
    } else if (payload.from_id === chatState.mediaBroadcasterId) {
        const pc = chatState.viewerPeerConnection;
        if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
        } else {
            chatState.pendingViewerIceCandidates.push(payload.candidate);
        }
    }
}

function setupMediaBroadcast() {
    if (!chatState.roomId) return;
    chatState.mediaChannel = supabase.channel(`room_${chatState.roomId}_media`, {
        config: { broadcast: { ack: false, self: false } }
    });

    chatState.mediaChannel
        .on('broadcast', { event: 'webrtc_join' }, ({ payload }) => {
            if (!payload || !chatState.isMediaBroadcaster || !chatState.activeMedia) return;
            if (payload.to_id === chatState.currentUser.id && payload.from_id && payload.from_id !== chatState.currentUser.id) {
                createOfferForViewer(payload.from_id);
            }
        })
        .on('broadcast', { event: 'webrtc_live' }, ({ payload }) => {
            if (!payload || payload.from_id === chatState.currentUser.id || chatState.isMediaBroadcaster) return;
            if (chatState.mediaBroadcasterId && chatState.mediaBroadcasterId !== payload.from_id) return;
            if (payload.from_id) {
                chatState.mediaBroadcasterId = payload.from_id;
                sendMediaSignal('webrtc_join', { to_id: payload.from_id });
            }
        })
        .on('broadcast', { event: 'webrtc_offer' }, ({ payload }) => {
            if (payload) handleViewerOffer(payload);
        })
        .on('broadcast', { event: 'webrtc_answer' }, ({ payload }) => {
            if (payload) handleHostAnswer(payload);
        })
        .on('broadcast', { event: 'webrtc_ice' }, ({ payload }) => {
            if (payload) handleIceCandidate(payload);
        })
        .on('broadcast', { event: 'webrtc_stop' }, ({ payload }) => {
            if (!payload || chatState.isMediaBroadcaster) return;
            if (payload.from_id === chatState.mediaBroadcasterId) {
                closeMediaBroadcast(false);
            }
        })
        .subscribe((status, error) => {
            if (status === 'SUBSCRIBED') {
                chatState.mediaRealtimeConnected = true;
                chatState.mediaRealtimeError = false;
                updateMediaButtons();

                if (chatState.isMediaBroadcaster && chatState.activeMedia) {
                    sendMediaSignal('webrtc_live', { title: chatState.activeMedia.name });
                } else if (!chatState.isMediaBroadcaster) {
                    sendMediaSignal('webrtc_join', { to_id: chatState.mediaBroadcasterId });
                }
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                chatState.mediaRealtimeConnected = false;
                chatState.mediaRealtimeError = true;
                updateMediaButtons();
                console.error('Canal de transmissão indisponível:', status, error);
            }
        });
}

function showAutoplayFallback() {
    chatState.mediaMutedForAutoplay = true;
    if (mediaBroadcastVideo) mediaBroadcastVideo.muted = true;
    btnEnableMediaAudio?.classList.remove('hidden');
    mediaAutoplayNotice?.classList.remove('hidden');
    syncGlobePlayerControlsUI();
    revealGlobePlayerHud();
    mediaBroadcastVideo?.play().catch(() => {});
}

async function startMediaBroadcast() {
    if (chatState.isPreloadingMedia) return;
    if (!chatState.mediaRealtimeConnected) {
        alert('Aguarde a conexão do canal da sala para iniciar a transmissão.');
        return;
    }

    const asset = chatState.mediaAssets.find(item => item.id === mediaLibrary?.value);
    if (!asset || !asset.ready) return;

    closeViewerPeerConnection();

    if (chatState.activeMedia) {
        closeAllHostPeerConnections();
        if (typeof chatState.canvasCaptureCleanup === 'function') {
            chatState.canvasCaptureCleanup();
            chatState.canvasCaptureCleanup = null;
        }
        if (chatState.localMediaStream) {
            chatState.localMediaStream.getTracks().forEach(track => track.stop());
            chatState.localMediaStream = null;
        }
    }

    chatState.activeMedia = asset;
    chatState.mediaBroadcasterId = chatState.currentUser.id;
    chatState.isMediaBroadcaster = true;
    mediaBroadcastVideo.srcObject = null;
    mediaBroadcastVideo.src = asset.url;
    mediaBroadcastVideo.controls = false;
    mediaBroadcastVideo.muted = false;
    mediaBroadcastVideo.playsInline = true;
    mediaBroadcastVideo.setAttribute('playsinline', '');
    mediaBroadcastTitle.textContent = asset.name;
    mediaBroadcast.classList.remove('hidden');
    btnStopMedia?.classList.remove('hidden');
    btnEnableMediaAudio?.classList.add('hidden');
    mediaAutoplayNotice?.classList.add('hidden');

    try {
        await mediaBroadcastVideo.play();
        await waitForRenderedVideoFrame(mediaBroadcastVideo);
    } catch (error) {
        console.error('Não foi possível reproduzir o vídeo local:', error);
        alert('Seu navegador não conseguiu reproduzir este formato de vídeo.');
        await closeMediaBroadcast(false);
        return;
    }

    syncGlobePlayerControlsUI();
    revealGlobePlayerHud();

    const stream = buildReliableLocalStream(mediaBroadcastVideo);
    if (!stream) {
        alert('Este navegador não suporta captura direta de stream de vídeo.');
        await closeMediaBroadcast(false);
        return;
    }

    chatState.localMediaStream = stream;

    await sendMediaSignal('webrtc_live', { title: asset.name });

    if (mediaBroadcast.requestFullscreen) {
        mediaBroadcast.requestFullscreen().catch(() => {});
    }
}

async function closeMediaBroadcast(notify = false) {
    if (notify && chatState.isMediaBroadcaster && chatState.mediaChannel && chatState.mediaRealtimeConnected) {
        await sendMediaSignal('webrtc_stop', {});
    }

    clearTimeout(chatState.playerHudTimer);
    chatState.activeMedia = null;
    chatState.isMediaBroadcaster = false;
    chatState.mediaBroadcasterId = null;
    closeAllHostPeerConnections();
    closeViewerPeerConnection();

    if (typeof chatState.canvasCaptureCleanup === 'function') {
        chatState.canvasCaptureCleanup();
        chatState.canvasCaptureCleanup = null;
    }

    if (chatState.localMediaStream) {
        chatState.localMediaStream.getTracks().forEach(track => track.stop());
        chatState.localMediaStream = null;
    }

    if (mediaBroadcastVideo) {
        mediaBroadcastVideo.pause();
        mediaBroadcastVideo.srcObject = null;
        mediaBroadcastVideo.removeAttribute('src');
        mediaBroadcastVideo.load();
    }

    mediaBroadcast?.classList.add('hidden');
    btnStopMedia?.classList.add('hidden');
    btnEnableMediaAudio?.classList.add('hidden');
    mediaAutoplayNotice?.classList.add('hidden');
    if (document.fullscreenElement === mediaBroadcast) {
        document.exitFullscreen().catch(() => {});
    }
}

setupGlobePlayerInteractions();

if (btnAddMedia) btnAddMedia.addEventListener('click', () => !chatState.isPreloadingMedia && mediaFileInput?.click());
if (mediaFileInput) mediaFileInput.addEventListener('change', async () => {
    const selectedFiles = mediaFileInput.files ? Array.from(mediaFileInput.files) : [];
    mediaFileInput.value = '';
    await addLocalMediaFiles(selectedFiles);
});
if (mediaLibrary) mediaLibrary.addEventListener('change', updateMediaButtons);
if (mediaControlsToggle) mediaControlsToggle.addEventListener('click', () => {
    const expanded = mediaControlsToggle.getAttribute('aria-expanded') !== 'true';
    mediaControlsToggle.setAttribute('aria-expanded', String(expanded));
    chatHeader?.classList.toggle('mobile-room-options-expanded', expanded);
    const label = mediaControlsToggle.querySelector('.media-controls-toggle-label');
    if (label) label.textContent = expanded ? 'Recolher opções' : 'Expandir opções';
    mediaControlsToggle.setAttribute('aria-label', expanded ? 'Recolher opções de mídia' : 'Mostrar opções de mídia');
    mediaControlsToggle.title = expanded ? 'Recolher opções de mídia' : 'Opções de mídia';
});
if (btnBroadcastMedia) btnBroadcastMedia.addEventListener('click', startMediaBroadcast);
if (btnDeleteMedia) btnDeleteMedia.addEventListener('click', async () => {
    if (chatState.isPreloadingMedia) return;
    const index = chatState.mediaAssets.findIndex(item => item.id === mediaLibrary.value);
    if (index === -1) return;
    const [removed] = chatState.mediaAssets.splice(index, 1);
    if (chatState.activeMedia?.id === removed.id) {
        await closeMediaBroadcast(true);
    }
    if (removed.url) URL.revokeObjectURL(removed.url);
    renderLocalMediaLibrary();
});
if (btnStopMedia) btnStopMedia.addEventListener('click', () => chatState.isMediaBroadcaster && closeMediaBroadcast(true));
if (btnEnableMediaAudio) btnEnableMediaAudio.addEventListener('click', async () => {
    chatState.mediaMutedForAutoplay = false;
    mediaBroadcastVideo.muted = false;
    btnEnableMediaAudio.classList.add('hidden');
    mediaAutoplayNotice?.classList.add('hidden');
    syncGlobePlayerControlsUI();
    try { await mediaBroadcastVideo.play(); } catch (_) { showAutoplayFallback(); }
});
if (mediaBroadcastVideo) {
    mediaBroadcastVideo.addEventListener('ended', () => {
        if (chatState.isMediaBroadcaster && chatState.activeMedia) {
            closeMediaBroadcast(true);
        }
    });
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
            characters:character_id (id, name, avatar_url, initials, color)
        `)
        .eq('room_id', chatState.roomId);

    if (error) {
        console.error("Erro ao buscar personagens da sala:", error);
        return;
    }

    chatState.roomCharacters = (data || []).map(rc => {
        const char = rc.characters || {};
        const charId = char.id || rc.character_id;
        return {
            id: charId,
            roomCharId: rc.id,
            name: char.name || 'Sem nome',
            avatar: char.avatar_url || null,
            color: char.color || '#9333ea',
            initials: char.initials || (char.name ? char.name.substring(0,2).toUpperCase() : '??'),
            description: chatState.characterDescriptionsCache.get(charId) || '',
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
    
    if (previousActiveId) {
        const activeCharacter = chatState.roomCharacters.find(character =>
            character.id === previousActiveId && character.ownerId === chatState.currentUser.id
        );
        if (!activeCharacter) {
            chatState.activeCharacterId = null;
        }
    } else {
        chatState.activeCharacterId = null;
    }

    renderDeck();
    updateInputUI();
    refreshMessageMentionsInDOM();
    if (chatState.mentionMenuOpen) updateMentionAutocomplete();
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
            .select('id, folder_id, name, avatar_url, initials, color')
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
// 5. CARREGAR E RENDERIZAR MENSAGENS (PAGINAÇÃO EM SLOTS DE 10)
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

async function queryRoomMessages({ since = null, before = null, limit = null, ascending = true } = {}) {
    const runQuery = async select => {
        let query = supabase
            .from('messages')
            .select(select)
            .eq('room_id', chatState.roomId);

        if (since) query = query.gte('created_at', since);
        if (before?.created_at && before?.id) {
            query = query.or(`created_at.lt."${before.created_at}",and(created_at.eq."${before.created_at}",id.lt."${before.id}")`);
        } else if (before?.created_at) {
            query = query.lt('created_at', before.created_at);
        }

        query = query
            .order('created_at', { ascending })
            .order('id', { ascending });

        if (limit) query = query.limit(limit);
        return query;
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

function updateOldestCursor(messages) {
    if (!messages?.length) return;
    const oldest = messages[0];
    if (!oldest?.created_at) return;

    if (!chatState.oldestMessageCursor) {
        chatState.oldestMessageCursor = { created_at: oldest.created_at, id: oldest.id };
        return;
    }

    const currentOldestTs = Date.parse(chatState.oldestMessageCursor.created_at);
    const candidateTs = Date.parse(oldest.created_at);
    if (candidateTs < currentOldestTs || (candidateTs === currentOldestTs && String(oldest.id) < String(chatState.oldestMessageCursor.id))) {
        chatState.oldestMessageCursor = { created_at: oldest.created_at, id: oldest.id };
    }
}

function showOlderMessagesLoader() {
    if (!chatMessagesContainer) return;
    let loader = document.getElementById('older-messages-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'older-messages-loader';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;margin:0 auto 12px;width:fit-content;border-radius:999px;background:rgba(24,25,36,0.92);border:1px solid #2f334d;color:#c084fc;font-size:12px;font-weight:500;';
        loader.innerHTML = `${ICONS.spinner}<span>Carregando mensagens anteriores...</span>`;
    }
    chatMessagesContainer.insertBefore(loader, chatMessagesContainer.firstChild);
}

function hideOlderMessagesLoader() {
    document.getElementById('older-messages-loader')?.remove();
}

function clearRoomTransientState() {
    chatState.renderedMessageIds.clear();
    chatState.messagesById.clear();
    chatState.pendingMessageEvents.length = 0;
    chatState.oldestMessageCursor = null;
    chatState.hasMoreOlderMessages = false;
    chatState.isLoadingOlderMessages = false;
    chatState.latestMessageTimestamp = 0;
    chatState.messagesLoaded = false;
    closeMentionDropdown();
    removeUnreadDivider();
    hideOlderMessagesLoader();
    if (chatMessagesContainer) {
        chatMessagesContainer.replaceChildren();
    }

    if (characterAvatarObserver) {
        characterAvatarObserver.disconnect();
        characterAvatarObserver = null;
    }

    chatState.roomCharacters = [];
    chatState.activeCharacterId = null;
    activeCharacterPage = 0;
    chatState.unlockedCharacterPages = new Set([0]);
    removeContextMenu();
    if (characterProfileModal) {
        characterProfileModal.classList.add('hidden');
    }
    if (characterList) {
        characterList.replaceChildren();
        characterList.style.transform = '';
    }
    if (characterPageIndicators) {
        characterPageIndicators.replaceChildren();
        characterPageIndicators.hidden = true;
    }
    updateInputUI();
}

async function resetRoomToInitialSnapshot() {
    if (!chatState.roomId || chatState.isResettingRoomState) return;
    chatState.isResettingRoomState = true;
    try {
        clearRoomTransientState();
        markCurrentRoomAsViewed();
        await Promise.all([
            fetchRoomCharacters(),
            fetchMessages()
        ]);

        chatState.roomCharacters.forEach(char => {
            if (char.ownerId && char.ownerId !== chatState.currentUser.id) {
                char.ownerName = chatState.roomUsers.get(char.ownerId)?.name || chatState.onlineUsers.get(char.ownerId)?.name || char.ownerName || 'Usuário';
            }
        });

        refreshMessageMentionsInDOM();
        chatState.activeCharacterId = null;

        renderDeck();
        updateInputUI();
    } finally {
        chatState.isResettingRoomState = false;
    }
}

function setupPageLifecycleReset() {
    window.addEventListener('pagehide', () => {
        markCurrentRoomAsViewed();
        closeMediaBroadcast(chatState.isMediaBroadcaster);
        clearLocalMediaAssets();
        chatState.wasHiddenOrLeft = true;
        clearRoomTransientState();
    });

    window.addEventListener('beforeunload', () => {
        markCurrentRoomAsViewed();
        closeMediaBroadcast(chatState.isMediaBroadcaster);
        clearLocalMediaAssets();
        chatState.wasHiddenOrLeft = true;
        clearRoomTransientState();
    });

    window.addEventListener('pageshow', event => {
        if (event.persisted || chatState.wasHiddenOrLeft) {
            chatState.wasHiddenOrLeft = false;
            resetRoomToInitialSnapshot();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            markCurrentRoomAsViewed();
            chatState.wasHiddenOrLeft = true;
            clearRoomTransientState();
        } else if (document.visibilityState === 'visible' && chatState.wasHiddenOrLeft) {
            chatState.wasHiddenOrLeft = false;
            resetRoomToInitialSnapshot();
        }
    });
}

async function fetchMessages() {
    if (!chatMessagesContainer) return;

    chatState.renderedMessageIds.clear();
    chatState.messagesById.clear();
    chatState.oldestMessageCursor = null;

    const { data, error } = await queryRoomMessages({
        limit: MESSAGES_PAGE_SIZE,
        ascending: false
    });

    if (error) {
        console.error("Erro ao buscar mensagens:", error);
        return;
    }

    const batch = (data || []).reverse();
    chatState.hasMoreOlderMessages = (data || []).length === MESSAGES_PAGE_SIZE;
    updateOldestCursor(batch);

    await hydrateMessageReplies(batch);
    renderAllMessages(batch);
    batch.forEach(msg => rememberMessageTimestamp(msg.created_at));
    chatState.messagesLoaded = true;
    markCurrentRoomAsViewed(Math.max(Date.now(), chatState.latestMessageTimestamp));

    const pendingEvents = chatState.pendingMessageEvents.splice(0);
    pendingEvents.forEach(msg => appendMessageToUI(msg));
    scrollToLatestMessage();
}

async function loadOlderMessages() {
    if (
        !chatMessagesContainer ||
        !chatState.roomId ||
        !chatState.messagesLoaded ||
        !chatState.hasMoreOlderMessages ||
        chatState.isLoadingOlderMessages ||
        !chatState.oldestMessageCursor
    ) {
        return;
    }

    chatState.isLoadingOlderMessages = true;
    const beforeLoaderScrollHeight = chatMessagesContainer.scrollHeight;
    const beforeLoaderScrollTop = chatMessagesContainer.scrollTop;
    showOlderMessagesLoader();
    chatMessagesContainer.scrollTop = beforeLoaderScrollTop + (chatMessagesContainer.scrollHeight - beforeLoaderScrollHeight);

    try {
        const { data, error } = await queryRoomMessages({
            before: chatState.oldestMessageCursor,
            limit: MESSAGES_PAGE_SIZE,
            ascending: false
        });

        if (error) {
            console.error('Erro ao carregar mensagens anteriores:', error);
            return;
        }

        const rawRows = data || [];
        chatState.hasMoreOlderMessages = rawRows.length === MESSAGES_PAGE_SIZE;

        const olderBatch = rawRows
            .reverse()
            .filter(msg => !msg.id || !chatState.renderedMessageIds.has(String(msg.id)));

        if (!olderBatch.length) return;

        updateOldestCursor(olderBatch);
        await hydrateMessageReplies(olderBatch);

        hideOlderMessagesLoader();
        const previousScrollHeight = chatMessagesContainer.scrollHeight;
        const previousScrollTop = chatMessagesContainer.scrollTop;

        const fragment = document.createDocumentFragment();
        olderBatch.forEach(msg => appendMessageToUI(msg, { container: fragment, skipScroll: true }));
        chatMessagesContainer.insertBefore(fragment, chatMessagesContainer.firstChild);

        const addedHeight = chatMessagesContainer.scrollHeight - previousScrollHeight;
        chatMessagesContainer.scrollTop = previousScrollTop + addedHeight;
    } finally {
        hideOlderMessagesLoader();
        chatState.isLoadingOlderMessages = false;
    }
}

function setupMessageHistoryScroll() {
    if (!chatMessagesContainer) return;

    let touchStartY = null;

    chatMessagesContainer.addEventListener('scroll', () => {
        if (!chatState.messagesLoaded || !chatState.hasMoreOlderMessages || chatState.isLoadingOlderMessages) return;
        if (chatMessagesContainer.scrollTop <= 80) {
            loadOlderMessages();
        }
    }, { passive: true });

    chatMessagesContainer.addEventListener('wheel', event => {
        if (event.deltaY < 0 && chatMessagesContainer.scrollTop <= 0) {
            loadOlderMessages();
        }
    }, { passive: true });

    chatMessagesContainer.addEventListener('touchstart', event => {
        touchStartY = event.touches?.[0]?.clientY ?? null;
    }, { passive: true });

    chatMessagesContainer.addEventListener('touchmove', event => {
        if (touchStartY === null) return;
        const currentY = event.touches?.[0]?.clientY ?? touchStartY;
        if (currentY - touchStartY > 36 && chatMessagesContainer.scrollTop <= 0) {
            touchStartY = null;
            loadOlderMessages();
        }
    }, { passive: true });
}

function rememberMessageTimestamp(value) {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
        chatState.latestMessageTimestamp = Math.max(chatState.latestMessageTimestamp, timestamp);
    }
}

async function syncNewMessages() {
    if (!chatState.roomId || !chatState.messagesLoaded) return;

    const since = new Date(Math.max(0, chatState.latestMessageTimestamp - 5000)).toISOString();
    const { data, error } = await queryRoomMessages({ since, ascending: true });

    if (error) {
        console.error('Erro ao sincronizar mensagens recentes:', error);
        return;
    }

    await hydrateMessageReplies(data || []);
    (data || []).forEach(msg => appendMessageToUI(msg));
}

function startMessageSyncLoop() {
    if (chatState.messageSyncTimer) clearInterval(chatState.messageSyncTimer);
    chatState.messageSyncTimer = setInterval(() => {
        syncNewMessages();
    }, 10000);
}

function renderAllMessages(messages) {
    if (!chatMessagesContainer) return;
    
    const fragment = document.createDocumentFragment();
    messages.forEach(msg => appendMessageToUI(msg, { container: fragment, skipScroll: true }));
    chatMessagesContainer.replaceChildren(fragment);
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

function normalizeMentionSearchText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function escapeRegExp(value) {
    return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatMessageContentWithMentions(rawContent) {
    const text = String(rawContent ?? '');
    if (!text) return '';

    const charactersWithNames = [...chatState.roomCharacters]
        .filter(char => char?.id && char?.name && char.name.trim())
        .sort((a, b) => b.name.trim().length - a.name.trim().length);

    if (!charactersWithNames.length) {
        return escapeHtml(text);
    }

    const nameLookup = new Map();
    const patterns = [];

    charactersWithNames.forEach(char => {
        const trimmedName = char.name.trim();
        const key = trimmedName.toLowerCase();
        if (!nameLookup.has(key)) {
            nameLookup.set(key, char);
            patterns.push(escapeRegExp(trimmedName));
        }
    });

    if (!patterns.length) return escapeHtml(text);

    const mentionRegex = new RegExp(`(^|[\\s([{"'“‘])@(${patterns.join('|')})(?=$|[\\s.,!?;:)\\]}"'”’])`, 'gi');
    let result = '';
    let lastIndex = 0;

    for (const match of text.matchAll(mentionRegex)) {
        const matchIndex = match.index ?? 0;
        const prefix = match[1] || '';
        const matchedName = match[2] || '';
        const matchedChar = nameLookup.get(matchedName.toLowerCase());

        result += escapeHtml(text.slice(lastIndex, matchIndex + prefix.length));

        if (matchedChar) {
            result += `<span class="character-mention" data-mention-character-id="${escapeHtml(matchedChar.id)}" role="button" tabindex="0" title="Localizar ${escapeHtml(matchedChar.name)} na lista da sala">@${escapeHtml(matchedName)}</span>`;
        } else {
            result += escapeHtml(`@${matchedName}`);
        }

        lastIndex = matchIndex + match[0].length;
    }

    result += escapeHtml(text.slice(lastIndex));
    return result;
}

function refreshMessageMentionsInDOM() {
    if (!chatMessagesContainer) return;
    chatMessagesContainer.querySelectorAll('[data-message-id]').forEach(element => {
        const message = chatState.messagesById.get(element.dataset.messageId);
        if (!message || message.deleted_at) return;
        const bubble = element.querySelector('.message-bubble');
        if (bubble) {
            bubble.innerHTML = formatMessageContentWithMentions(message.content);
        }
    });
}

function focusCharacterInRoomList(characterId) {
    if (!characterId) return;

    if (!chatState.isEncenacaoEnabled) {
        chatState.isEncenacaoEnabled = true;
        if (toggleEncenacao) toggleEncenacao.checked = true;
        if (characterBar) characterBar.classList.remove('hidden');
        renderDeck();
        updateInputUI();
    } else if (characterBar?.classList.contains('hidden')) {
        characterBar.classList.remove('hidden');
    }

    const sortedCharacters = getSortedCharacters();
    const targetIndex = sortedCharacters.findIndex(char => String(char.id) === String(characterId));
    if (targetIndex === -1) return;

    const targetPage = Math.floor(targetIndex / CHARACTER_AVATAR_BATCH_SIZE);
    const pageCount = Math.max(1, Math.ceil(sortedCharacters.length / CHARACTER_AVATAR_BATCH_SIZE));
    const isMobile = window.matchMedia('(max-width: 700px)').matches;

    if (isMobile) {
        setActiveCharacterPage(targetPage, pageCount);
    } else {
        hydrateCharacterAvatarBatch(targetPage);
    }

    requestAnimationFrame(() => {
        const targetItem = characterList?.querySelector(`.char-item[data-id="${CSS.escape(String(characterId))}"]`);
        if (!targetItem) return;

        if (!isMobile) {
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        characterList?.querySelectorAll('.char-item.mention-target-highlight').forEach(el => {
            el.classList.remove('mention-target-highlight');
        });
        void targetItem.offsetWidth;
        targetItem.classList.add('mention-target-highlight');

        clearTimeout(chatState.mentionHighlightTimer);
        chatState.mentionHighlightTimer = setTimeout(() => {
            targetItem.classList.remove('mention-target-highlight');
        }, 2400);
    });
}

function getFilteredMentionCharacters(query) {
    const normalizedQuery = normalizeMentionSearchText(query).trim();
    const sorted = getSortedCharacters();

    if (!normalizedQuery) return sorted;

    const startsWithMatches = [];
    const containsMatches = [];

    sorted.forEach(char => {
        const normalizedName = normalizeMentionSearchText(char.name);
        if (normalizedName.startsWith(normalizedQuery)) {
            startsWithMatches.push(char);
        } else if (normalizedName.includes(normalizedQuery)) {
            containsMatches.push(char);
        }
    });

    return [...startsWithMatches, ...containsMatches];
}

function closeMentionDropdown() {
    chatState.mentionMenuOpen = false;
    chatState.mentionTriggerStart = -1;
    chatState.mentionQuery = '';
    chatState.mentionFilteredCharacters = [];
    chatState.mentionSelectedIndex = 0;
    if (mentionDropdown) {
        mentionDropdown.classList.add('hidden');
        mentionDropdown.innerHTML = '';
    }
}

function renderMentionDropdown() {
    if (!mentionDropdown) return;

    const items = chatState.mentionFilteredCharacters;
    if (!chatState.mentionMenuOpen || !items.length) {
        mentionDropdown.classList.add('hidden');
        mentionDropdown.innerHTML = '';
        return;
    }

    chatState.mentionSelectedIndex = Math.max(0, Math.min(chatState.mentionSelectedIndex, items.length - 1));

    const header = document.createElement('div');
    header.className = 'mention-dropdown-header';
    header.textContent = chatState.mentionQuery
        ? `Personagens (${items.length})`
        : `Mencionar personagem na sala (${items.length})`;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(header);

    items.forEach((char, index) => {
        const isActive = index === chatState.mentionSelectedIndex;
        const option = document.createElement('button');
        option.type = 'button';
        option.className = `mention-option${isActive ? ' is-active' : ''}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(isActive));
        option.dataset.characterId = char.id;

        const statusLabel = char.ownerId === chatState.currentUser.id
            ? 'Seu personagem'
            : (char.ownerId ? `Com ${char.ownerName || 'outro jogador'}` : 'Livre na sala');

        const avatarHTML = char.avatar
            ? `<img class="mention-option-avatar" src="${escapeHtml(char.avatar)}" alt="${escapeHtml(char.name)}">`
            : `<span class="mention-option-avatar" style="color:${escapeHtml(char.color || '#c084fc')};border-color:${escapeHtml(char.color || '#9d4edd')};">${escapeHtml(char.initials)}</span>`;

        option.innerHTML = `
            ${avatarHTML}
            <span class="mention-option-info">
                <span class="mention-option-name">${escapeHtml(char.name)}</span>
                <span class="mention-option-status">${escapeHtml(statusLabel)}</span>
            </span>
            <span class="mention-option-at">@${escapeHtml(char.name.split(' ')[0])}</span>
        `;

        option.addEventListener('pointerdown', event => {
            event.preventDefault();
            selectMentionCharacter(char);
        });

        fragment.appendChild(option);
    });

    mentionDropdown.replaceChildren(fragment);
    mentionDropdown.classList.remove('hidden');

    const activeOption = mentionDropdown.querySelector('.mention-option.is-active');
    activeOption?.scrollIntoView({ block: 'nearest' });
}

function updateMentionAutocomplete() {
    if (!chatInput || !mentionDropdown) return;

    if (!chatState.roomCharacters.length) {
        closeMentionDropdown();
        return;
    }

    const value = chatInput.value;
    const cursor = chatInput.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursor);

    const triggerMatch = textBeforeCursor.match(/(?:^|\s)@([^\s@][^@]{0,40}|)$/);
    if (!triggerMatch) {
        closeMentionDropdown();
        return;
    }

    const query = triggerMatch[1] ?? '';
    const triggerStart = textBeforeCursor.lastIndexOf('@');
    const filtered = getFilteredMentionCharacters(query);

    if (!filtered.length) {
        closeMentionDropdown();
        return;
    }

    const queryChanged = chatState.mentionQuery !== query || chatState.mentionTriggerStart !== triggerStart;
    chatState.mentionMenuOpen = true;
    chatState.mentionTriggerStart = triggerStart;
    chatState.mentionQuery = query;
    chatState.mentionFilteredCharacters = filtered;
    if (queryChanged) {
        chatState.mentionSelectedIndex = 0;
    }

    renderMentionDropdown();
}

function selectMentionCharacter(character) {
    if (!chatInput || !character) return;

    const value = chatInput.value;
    const cursor = chatInput.selectionStart ?? value.length;
    const start = chatState.mentionTriggerStart >= 0 ? chatState.mentionTriggerStart : cursor;

    const before = value.slice(0, start);
    const after = value.slice(cursor);
    const spacer = after.startsWith(' ') ? '' : ' ';
    const insertion = `@${character.name}${spacer}`;
    const nextValue = `${before}${insertion}${after}`;
    const nextCursor = before.length + insertion.length;

    chatInput.value = nextValue;
    chatInput.focus();
    chatInput.setSelectionRange(nextCursor, nextCursor);
    closeMentionDropdown();
    updateTypingState();
}

function appendMessageToUI(msg, { container = chatMessagesContainer, skipScroll = false } = {}) {
    if (!container) return;
    if (msg.id) {
        const msgKey = String(msg.id);
        chatState.messagesById.set(msgKey, msg);
        if (chatState.renderedMessageIds.has(msgKey)) return;
        chatState.renderedMessageIds.add(msgKey);
    }
    rememberMessageTimestamp(msg.created_at);
    const msgTs = Date.parse(msg.created_at);
    markCurrentRoomAsViewed(Math.max(Date.now(), Number.isFinite(msgTs) ? msgTs : 0));

    const isMine = msg.user_id === chatState.currentUser.id;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const char = msg.characters;
    const isDeleted = Boolean(msg.deleted_at);
    const messageText = isDeleted ? 'Esta mensagem foi apagada' : formatMessageContentWithMentions(msg.content);

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
    const nextMessage = Array.from(container.children).find(element =>
        element.dataset.messageId && Number(element.dataset.createdAt || 0) > timestamp
    );

    const isUnreadFromOther = !isMine
        && !chatState.unreadDividerInserted
        && Number.isFinite(chatState.unreadSinceTimestamp)
        && chatState.unreadSinceTimestamp > 0
        && timestamp > chatState.unreadSinceTimestamp;

    if (isUnreadFromOther) {
        chatState.unreadDividerInserted = true;
        container.insertBefore(createUnreadDividerElement(), nextMessage || null);
    }

    container.insertBefore(msgElement, nextMessage || null);
    if (!skipScroll) scrollToLatestMessage();
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

async function showCharacterProfile(characterId) {
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

    const descEl = characterProfileModal.querySelector('.character-profile-description');
    const cachedDesc = chatState.characterDescriptionsCache.get(character.id) ?? character.description;
    descEl.textContent = cachedDesc || 'Carregando descrição...';
    characterProfileModal.classList.remove('hidden');

    if (!chatState.characterDescriptionsCache.has(character.id)) {
        const { data } = await supabase
            .from('characters')
            .select('description')
            .eq('id', character.id)
            .maybeSingle();
        const loadedDesc = data?.description || '';
        chatState.characterDescriptionsCache.set(character.id, loadedDesc);
        character.description = loadedDesc;
        if (!characterProfileModal.classList.contains('hidden')) {
            descEl.textContent = loadedDesc || 'Este personagem ainda não possui uma descrição.';
        }
    }
}

if (chatMessagesContainer) {
    chatMessagesContainer.addEventListener('click', event => {
        const mentionEl = event.target.closest('.character-mention[data-mention-character-id]');
        if (mentionEl) {
            event.preventDefault();
            event.stopPropagation();
            focusCharacterInRoomList(mentionEl.dataset.mentionCharacterId);
            return;
        }

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

    chatMessagesContainer.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const mentionEl = event.target.closest('.character-mention[data-mention-character-id]');
        if (!mentionEl) return;
        event.preventDefault();
        focusCharacterInRoomList(mentionEl.dataset.mentionCharacterId);
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
    if (!event.target.closest('#mention-dropdown') && event.target !== chatInput) closeMentionDropdown();
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
        const cachedChar = chatState.roomCharacters.find(c => c.id === newMsg.character_id);
        if (cachedChar) {
            newMsg.characters = {
                id: cachedChar.id,
                name: cachedChar.name,
                avatar_url: cachedChar.avatar,
                color: cachedChar.color,
                initials: cachedChar.initials
            };
        } else {
            const { data: charData } = await supabase
                .from('characters')
                .select('id, name, avatar_url, color, initials')
                .eq('id', newMsg.character_id)
                .single();
            newMsg.characters = charData;
        }
    }
    if (newMsg.reply_to_id && !newMsg.reply) {
        const cachedReply = chatState.messagesById.get(String(newMsg.reply_to_id));
        if (cachedReply) {
            newMsg.reply = {
                id: cachedReply.id,
                content: cachedReply.content,
                user_id: cachedReply.user_id,
                deleted_at: cachedReply.deleted_at
            };
        } else {
            const { data: reply } = await supabase
                .from('messages')
                .select('id, content, user_id, deleted_at')
                .eq('id', newMsg.reply_to_id)
                .maybeSingle();
            newMsg.reply = reply;
        }
    }
    const charData = newMsg.characters;
    if (charData && !chatState.roomCharacters.some(character => character.id === charData.id)) {
        chatState.roomCharacters.push({
            id: charData.id,
            name: charData.name,
            avatar: charData.avatar_url,
            initials: charData.initials || charData.name.substring(0, 2).toUpperCase(),
            color: charData.color || '#9333ea',
            description: ''
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
// 6. ORDENAÇÃO E RENDERIZAÇÃO DO DECK (SLOTS COMPLETOS + FOTOS 10 EM 10 SOB DEMANDA)
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

function loadCharacterSlotAvatar(slot) {
    if (!slot || slot.dataset.loading === 'true') return;
    const url = slot.getAttribute('data-avatar-src');
    const name = slot.getAttribute('data-char-name') || 'Personagem';
    const initials = slot.getAttribute('data-char-initials') || '??';
    const color = slot.getAttribute('data-char-color') || '#9333ea';

    if (!url) {
        const fallback = document.createElement('div');
        fallback.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1b26;color:${color};font-weight:bold;`;
        fallback.textContent = initials;
        slot.replaceWith(fallback);
        return;
    }

    slot.dataset.loading = 'true';
    const loader = new Image();
    loader.decoding = 'async';
    loader.onload = () => {
        chatState.loadedAvatarUrls.add(url);
        if (!slot.isConnected) return;
        const img = document.createElement('img');
        img.src = url;
        img.alt = name;
        img.decoding = 'async';
        slot.replaceWith(img);
    };
    loader.onerror = () => {
        if (!slot.isConnected) return;
        const fallback = document.createElement('div');
        fallback.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1b26;color:${color};font-weight:bold;`;
        fallback.textContent = initials;
        slot.replaceWith(fallback);
    };
    loader.src = url;
}

function hydrateCharacterAvatarBatch(pageIndex) {
    if (!characterList) return;
    chatState.unlockedCharacterPages.add(pageIndex);

    const pages = characterList.querySelectorAll('.char-page');
    const targetPage = pages[pageIndex];
    if (!targetPage) return;

    targetPage.querySelectorAll('.char-avatar-slot[data-avatar-src]').forEach(slot => {
        loadCharacterSlotAvatar(slot);
    });
}

function setupDesktopCharacterAvatarObserver() {
    if (characterAvatarObserver) {
        characterAvatarObserver.disconnect();
        characterAvatarObserver = null;
    }
    if (!characterList || window.matchMedia('(max-width: 700px)').matches) return;

    const rootEl = characterListViewport || characterList;
    if (typeof IntersectionObserver !== 'function') {
        hydrateCharacterAvatarBatch(0);
        return;
    }

    characterAvatarObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const slot = entry.target;
            const batchPage = Number(slot.dataset.batchPage || 0);
            hydrateCharacterAvatarBatch(batchPage);
            characterAvatarObserver?.unobserve(slot);
        });
    }, {
        root: rootEl,
        rootMargin: '0px 80px 0px 0px',
        threshold: 0.05
    });

    characterList.querySelectorAll('.char-avatar-slot[data-avatar-src]').forEach(slot => {
        characterAvatarObserver.observe(slot);
    });
}

function renderDeck() {
    if (!characterList) return;

    if (characterAvatarObserver) {
        characterAvatarObserver.disconnect();
        characterAvatarObserver = null;
    }

    characterList.innerHTML = '';
    const sortedCharacters = getSortedCharacters();
    const pageCount = Math.max(1, Math.ceil(sortedCharacters.length / CHARACTER_AVATAR_BATCH_SIZE));
    activeCharacterPage = Math.min(activeCharacterPage, pageCount - 1);
    chatState.unlockedCharacterPages.add(activeCharacterPage);
    const isMobile = window.matchMedia('(max-width: 700px)').matches;

    const characterItems = sortedCharacters.map((char, index) => {
        const batchPage = Math.floor(index / CHARACTER_AVATAR_BATCH_SIZE);
        const isAlreadyCached = Boolean(char.avatar && chatState.loadedAvatarUrls.has(char.avatar));
        const shouldLoadAvatarNow = Boolean(
            char.avatar && (isAlreadyCached || chatState.unlockedCharacterPages.has(batchPage))
        );

        const isMyChar = char.ownerId === chatState.currentUser.id;
        const isActive = isMyChar && char.id === chatState.activeCharacterId;
        const isStandby = isMyChar && !isActive;
        const isSolto = char.ownerId === null;
        const isTaken = char.ownerId && !isMyChar;

        const charItem = document.createElement('div');

        let stateClass = 'free';
        let badgeHTML = `<span class="status-badge free-icon">${ICONS.unlock}</span>`;
        let tooltipText = 'Personagem Solto - Clique para assumir';
        let wrapperStyle = !char.avatar ? `border-color: ${char.color};` : '';

        if (isActive) {
            stateClass = 'active';
            badgeHTML = `<span class="status-badge active-check" style="background-color: ${char.color}; color: #fff;">${ICONS.check}</span>`;
            tooltipText = 'Personagem Ativo (Sua fala)';
            wrapperStyle = `border-color: ${char.color}; border-style: solid; box-shadow: 0 0 12px ${char.color}40;`;
        } else if (isStandby) {
            stateClass = 'standby';
            badgeHTML = `<span class="status-badge standby-icon" style="background-color: ${char.color}; color: #fff;">${ICONS.pause}</span>`;
            tooltipText = 'Em Standby - Clique para mudar para Ativo';
            wrapperStyle = `border-color: ${char.color}; border-style: dashed;`;
        } else if (isTaken) {
            stateClass = 'taken';
            badgeHTML = `<span class="status-badge taken-icon">${ICONS.lock}</span>`;
            tooltipText = `Possuído por ${char.ownerName || 'outro usuário'}`;
        }

        charItem.className = `char-item ${stateClass}`;
        charItem.setAttribute('data-id', char.id);

        let avatarImgOrInitials;
        if (char.avatar && isAlreadyCached) {
            avatarImgOrInitials = `<img src="${escapeHtml(char.avatar)}" alt="${escapeHtml(char.name)}" decoding="async">`;
        } else if (char.avatar) {
            avatarImgOrInitials = `<div class="char-avatar-slot" data-batch-page="${batchPage}" data-avatar-src="${escapeHtml(char.avatar)}" data-char-name="${escapeHtml(char.name)}" data-char-initials="${escapeHtml(char.initials)}" data-char-color="${escapeHtml(char.color)}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1b26;color:${char.color};font-weight:bold;">${escapeHtml(char.initials)}</div>`;
        } else {
            avatarImgOrInitials = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1a1b26; color: ${char.color}; font-weight: bold;">${escapeHtml(char.initials)}</div>`;
        }

        charItem.innerHTML = `
            <div class="char-avatar-wrapper" title="${escapeHtml(tooltipText)}" style="${wrapperStyle}">
                ${avatarImgOrInitials}
                ${badgeHTML}
            </div>
            <span>${escapeHtml(char.name.split(' ')[0])}</span>
        `;

        if (shouldLoadAvatarNow && !isAlreadyCached) {
            const slot = charItem.querySelector('.char-avatar-slot');
            if (slot) loadCharacterSlotAvatar(slot);
        }

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

        return charItem;
    });

    const fragment = document.createDocumentFragment();
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const page = document.createElement('div');
        page.className = 'char-page';
        page.setAttribute('role', 'group');
        page.setAttribute('aria-label', `Página ${pageIndex + 1} de ${pageCount} de personagens`);
        characterItems
            .slice(pageIndex * CHARACTER_AVATAR_BATCH_SIZE, (pageIndex + 1) * CHARACTER_AVATAR_BATCH_SIZE)
            .forEach(item => page.appendChild(item));
        fragment.appendChild(page);
    }

    const addCard = document.createElement('div');
    addCard.className = 'char-item desktop-add-character';
    addCard.innerHTML = `
        <div class="char-avatar-wrapper placeholder add" title="Adicionar personagem à sala">+</div>
        <span>Novo</span>
    `;
    addCard.addEventListener('click', openAddCharacterModal);
    fragment.appendChild(addCard);
    characterList.appendChild(fragment);

    renderCharacterPageIndicators(pageCount);
    updateCharacterPagePosition();
    if (!isMobile) {
        setupDesktopCharacterAvatarObserver();
    }
}

function updateCharacterPagePosition() {
    if (!characterList) return;
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    characterList.style.transform = isMobile ? `translateX(-${activeCharacterPage * 100}%)` : '';
    if (isMobile) {
        hydrateCharacterAvatarBatch(activeCharacterPage);
    }

    characterPageIndicators?.querySelectorAll('.character-page-dot').forEach((dot, index) => {
        dot.setAttribute('aria-current', String(index === activeCharacterPage));
    });
}

function setActiveCharacterPage(pageIndex, pageCount) {
    activeCharacterPage = Math.max(0, Math.min(pageIndex, pageCount - 1));
    updateCharacterPagePosition();
}

function renderCharacterPageIndicators(pageCount) {
    if (!characterPageIndicators) return;
    characterPageIndicators.innerHTML = '';
    characterPageIndicators.hidden = pageCount < 2;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'character-page-dot';
        dot.setAttribute('aria-label', `Ir para a página ${pageIndex + 1} de personagens`);
        dot.setAttribute('aria-current', String(pageIndex === activeCharacterPage));
        dot.addEventListener('click', () => setActiveCharacterPage(pageIndex, pageCount));
        characterPageIndicators.appendChild(dot);
    }
}

if (btnAddCharacterMobile) btnAddCharacterMobile.addEventListener('click', openAddCharacterModal);

if (characterListViewport) {
    characterListViewport.addEventListener('pointerdown', event => {
        if (window.matchMedia('(max-width: 700px)').matches) characterSwipeStartX = event.clientX;
    });

    characterListViewport.addEventListener('pointerup', event => {
        if (characterSwipeStartX === null) return;
        const distance = event.clientX - characterSwipeStartX;
        characterSwipeStartX = null;
        const pageCount = characterList?.querySelectorAll('.char-page').length || 1;
        if (Math.abs(distance) < 40 || pageCount < 2) return;
        setActiveCharacterPage(activeCharacterPage + (distance < 0 ? 1 : -1), pageCount);
    });

    characterListViewport.addEventListener('pointercancel', () => { characterSwipeStartX = null; });

    // Permite rolar a lista horizontalmente com a rodinha do mouse no desktop
    characterListViewport.addEventListener('wheel', event => {
        if (window.matchMedia('(max-width: 700px)').matches) return;
        const scrollTarget = characterListViewport.scrollWidth > characterListViewport.clientWidth
            ? characterListViewport
            : characterList;
        if (!scrollTarget || scrollTarget.scrollWidth <= scrollTarget.clientWidth) return;
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.preventDefault();
            scrollTarget.scrollLeft += event.deltaY;
        }
    }, { passive: false });
}

window.addEventListener('resize', () => {
    updateCharacterPagePosition();
    setupDesktopCharacterAvatarObserver();
});

function setActiveCharacter(charId) {
    const char = chatState.roomCharacters.find(c => c.id === charId);
    if (!char || char.ownerId !== chatState.currentUser.id) return;

    const nowIso = new Date().toISOString();
    char.lastUsed = Date.now();
    chatState.activeCharacterId = charId;

    renderDeck();
    updateInputUI();

    supabase
        .from('room_characters')
        .update({ last_used_at: nowIso })
        .eq('room_id', chatState.roomId)
        .eq('character_id', charId)
        .eq('owner_id', chatState.currentUser.id)
        .then(({ error }) => {
            if (error) console.error('Falha ao salvar última utilização do personagem:', error);
        });
}

function setCharacterStandby(charId) {
    if (chatState.activeCharacterId === charId) {
        chatState.activeCharacterId = null;
    }
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

    const fragment = document.createDocumentFragment();

    const addFolderCard = (folderId, name, count) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'room-wallet-folder-card';
        card.innerHTML = `<span class="room-wallet-folder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></span><strong></strong><small>${count} personagem${count !== 1 ? 's' : ''}</small>`;
        card.querySelector('strong').textContent = name;
        card.addEventListener('click', () => {
            activeWalletFolderId = folderId;
            renderModalCharacterGrid();
        });
        fragment.appendChild(card);
    };

    if (activeWalletFolderId === null) {
        const heading = document.createElement('p');
        heading.className = 'room-wallet-folder-heading';
        heading.textContent = 'Escolha uma pasta para ver os personagens';
        fragment.appendChild(heading);

        userWalletFolders.forEach(folder => {
            const count = userWalletCharacters.filter(char => char.folderId === folder.id).length;
            addFolderCard(folder.id, folder.name, count);
        });
        const unfiledCount = userWalletCharacters.filter(char => !char.folderId).length;
        if (unfiledCount) addFolderCard(UNFILED_WALLET_FOLDER, 'Sem pasta', unfiledCount);

        if (!userWalletFolders.length && !unfiledCount) {
            const empty = document.createElement('p');
            empty.className = 'room-wallet-empty';
            empty.textContent = 'Sua carteira está vazia. Crie pastas e personagens na Carteira de personagens.';
            fragment.appendChild(empty);
        }
        roomCharacterSelectGrid.appendChild(fragment);
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
    fragment.appendChild(backButton);

    const folderName = activeWalletFolderId === UNFILED_WALLET_FOLDER
        ? 'Sem pasta'
        : userWalletFolders.find(folder => folder.id === activeWalletFolderId)?.name || 'Pasta';
    const heading = document.createElement('p');
    heading.className = 'room-wallet-folder-heading';
    heading.textContent = folderName;
    fragment.appendChild(heading);

    const folderCharacters = userWalletCharacters.filter(char => activeWalletFolderId === UNFILED_WALLET_FOLDER
        ? !char.folderId
        : char.folderId === activeWalletFolderId);

    if (!folderCharacters.length) {
        const empty = document.createElement('p');
        empty.className = 'room-wallet-empty';
        empty.textContent = 'Esta pasta ainda não tem personagens.';
        fragment.appendChild(empty);
        roomCharacterSelectGrid.appendChild(fragment);
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
            ? `<img src="${char.avatar}" alt="${char.name}" loading="lazy" style="width:52px;height:52px;border-radius:10px;object-fit:cover;">`
            : `<div style="width:52px;height:52px;border-radius:10px;border:2px dashed ${char.color};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;">${char.initials}</div>`;
        card.innerHTML = `<div style="margin-bottom:10px;">${avatarHTML}</div><span class="room-wallet-character-name"></span><button type="button" class="room-wallet-character-toggle">${isSelected ? '✓ Adicionado' : '+ Adicionar'}</button>`;
        card.querySelector('.room-wallet-character-name').textContent = char.name;
        card.querySelector('.room-wallet-character-toggle').classList.toggle('selected', isSelected);
        card.addEventListener('click', () => {
            if (selectedWalletCharIds.has(char.id)) selectedWalletCharIds.delete(char.id);
            else selectedWalletCharIds.add(char.id);
            renderModalCharacterGrid();
        });
        fragment.appendChild(card);
    });

    roomCharacterSelectGrid.appendChild(fragment);
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
    
    if (chatState.activeCharacterId && !chatState.roomCharacters.some(c => c.id === chatState.activeCharacterId && c.ownerId === chatState.currentUser.id)) {
        chatState.activeCharacterId = null;
    }

    closeAddCharacterModal();
    renderDeck();
    updateInputUI();
    refreshMessageMentionsInDOM();
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
            <div class="context-menu-item" data-action="standby">${ICONS.pause} Stand-by</div>
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
        if (action === 'standby') setCharacterStandby(character.id);
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
    const char = chatState.roomCharacters.find(c => c.id === charId);
    if (!char || char.ownerId !== null) return;

    const prevOwnerId = char.ownerId;
    const prevOwnerName = char.ownerName;
    const prevLastUsed = char.lastUsed;
    const prevActiveId = chatState.activeCharacterId;
    const nowIso = new Date().toISOString();

    char.ownerId = chatState.currentUser.id;
    char.ownerName = 'Você';
    char.lastUsed = Date.now();
    chatState.activeCharacterId = charId;
    renderDeck();
    updateInputUI();

    const { data, error } = await supabase
        .from('room_characters')
        .update({ owner_id: chatState.currentUser.id, last_used_at: nowIso })
        .eq('room_id', chatState.roomId)
        .eq('character_id', charId)
        .is('owner_id', null)
        .select('id');

    if (error || !data?.length) {
        char.ownerId = prevOwnerId;
        char.ownerName = prevOwnerName;
        char.lastUsed = prevLastUsed;
        chatState.activeCharacterId = prevActiveId;
        await syncRoomCharacters();
        if (!error) {
            alert('Outro integrante assumiu esse personagem primeiro. A lista foi atualizada.');
        } else {
            console.error('Falha ao assumir personagem:', error);
        }
        return;
    }

    broadcastRoomCharactersChanged();
}

async function soltarPersonagem(charId) {
    const char = chatState.roomCharacters.find(c => c.id === charId);
    if (!char || char.ownerId !== chatState.currentUser.id) return;

    const prevOwnerId = char.ownerId;
    const prevOwnerName = char.ownerName;
    const prevLastUsed = char.lastUsed;
    const prevActiveId = chatState.activeCharacterId;

    char.ownerId = null;
    char.ownerName = null;
    char.lastUsed = 0;
    if (chatState.activeCharacterId === charId) chatState.activeCharacterId = null;
    renderDeck();
    updateInputUI();

    const { data, error } = await supabase
        .from('room_characters')
        .update({ owner_id: null, last_used_at: null })
        .eq('room_id', chatState.roomId)
        .eq('character_id', charId)
        .eq('owner_id', chatState.currentUser.id)
        .select('id');

    if (error) {
        char.ownerId = prevOwnerId;
        char.ownerName = prevOwnerName;
        char.lastUsed = prevLastUsed;
        chatState.activeCharacterId = prevActiveId;
        console.error('Falha ao soltar personagem:', error);
        await syncRoomCharacters();
        return;
    }

    if (data?.length) broadcastRoomCharactersChanged();
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
        refreshMessageMentionsInDOM();
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

async function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || !chatState.roomId) return;

    closeMentionDropdown();

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

    const character = chatState.isEncenacaoEnabled && activeChar
        ? {
            id: activeChar.id,
            name: activeChar.name,
            avatar_url: activeChar.avatar,
            color: activeChar.color,
            initials: activeChar.initials
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
    chatInput.addEventListener('input', () => {
        updateTypingState();
        updateMentionAutocomplete();
    });
    chatInput.addEventListener('click', updateMentionAutocomplete);
    chatInput.addEventListener('keyup', event => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            updateMentionAutocomplete();
        }
    });
    chatInput.addEventListener('focus', () => {
        updateMentionAutocomplete();
        setTimeout(() => {
            syncMobileViewport();
            window.scrollTo(0, 0);
            scrollToLatestMessage();
        }, 300);
    });
    chatInput.addEventListener('blur', () => {
        clearTimeout(chatState.typingStopTimer);
        sendTypingEvent(false);
        setTimeout(() => {
            closeMentionDropdown();
            syncMobileViewport();
        }, 180);
    });
    chatInput.addEventListener('keydown', async (e) => {
        if (chatState.mentionMenuOpen && chatState.mentionFilteredCharacters.length) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                chatState.mentionSelectedIndex = (chatState.mentionSelectedIndex + 1) % chatState.mentionFilteredCharacters.length;
                renderMentionDropdown();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                chatState.mentionSelectedIndex = (chatState.mentionSelectedIndex - 1 + chatState.mentionFilteredCharacters.length) % chatState.mentionFilteredCharacters.length;
                renderMentionDropdown();
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selected = chatState.mentionFilteredCharacters[chatState.mentionSelectedIndex];
                if (selected) selectMentionCharacter(selected);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                closeMentionDropdown();
                return;
            }
        }

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

setupPageLifecycleReset();
initChat();
