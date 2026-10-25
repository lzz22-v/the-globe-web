import { supabase } from '../config/supabase.js';

// ==========================================
// 1. MAPEAMENTO DOS ELEMENTOS
// ==========================================
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const mainProfileName = document.getElementById('main-profile-name');
const mainProfileEmail = document.getElementById('main-profile-email');

const sidebarAvatar = document.getElementById('sidebar-avatar');
const mainProfileAvatar = document.getElementById('main-profile-avatar');
const avatarFileInput = document.getElementById('avatar-file-input');

const profileBanner = document.getElementById('profile-banner');
const bannerColorPicker = document.getElementById('banner-color-picker');

const btnLogout = document.getElementById('btn-logout');

const welcomeModal = document.getElementById('welcome-modal');
const btnCloseWelcome = document.getElementById('btn-close-welcome');

// Contadores de Estatísticas
const statRooms = document.getElementById('stat-rooms');
// Você pode adicionar os próximos depois aqui:
// const statCharacters = document.getElementById('stat-characters');
// const statMessages = document.getElementById('stat-messages');

// Elementos dos Novos Modais
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');

const customAlertModal = document.getElementById('custom-alert-modal');
const customAlertIcon = document.getElementById('custom-alert-icon');
const customAlertTitle = document.getElementById('custom-alert-title');
const customAlertMessage = document.getElementById('custom-alert-message');
const btnCloseAlert = document.getElementById('btn-close-alert');

// Ícone padrão em base64 (SVG cinza genérico)
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// ==========================================
// 2. FUNÇÕES AUXILIARES (MODAIS)
// ==========================================
function showLoading(message) {
    loadingMessage.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showAlert(title, message, type = 'success') {
    customAlertTitle.textContent = title;
    customAlertMessage.textContent = message;
    
    // Injeção de SVGs estilizados em vez de Emojis
    if (type === 'success') {
        customAlertIcon.innerHTML = `
            <svg viewBox="0 0 24 24" width="64" height="64" stroke="#4ade80" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 8px rgba(74, 222, 128, 0.3));">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        `;
    } else if (type === 'error') {
        customAlertIcon.innerHTML = `
            <svg viewBox="0 0 24 24" width="64" height="64" stroke="#f87171" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 8px rgba(248, 113, 113, 0.3));">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        `;
    }

    customAlertModal.classList.remove('hidden');
}

// Fechar o alerta customizado
btnCloseAlert.addEventListener('click', () => {
    customAlertModal.classList.add('hidden');
});

// ==========================================
// 3. ESTATÍSTICAS DO USUÁRIO
// ==========================================
async function fetchUserStats(userId) {
    try {
        // Busca apenas a quantidade exata de salas (muito mais rápido do que buscar os dados inteiros)
        const { count: roomsCount, error: roomsError } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', userId);

        if (roomsError) throw roomsError;

        // Se o elemento statRooms existir no HTML, atualiza com o número do banco
        if (statRooms) {
            statRooms.textContent = roomsCount || 0;
        }

    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
    }
}

// ==========================================
// 4. INICIALIZAÇÃO DA PÁGINA
// ==========================================
async function initProfile() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        window.location.replace('index.html');
        return;
    }

    const user = session.user;
    const metadata = user.user_metadata;

    const userName = metadata?.full_name || metadata?.name || 'Usuário theGlobe';
    const userEmail = user.email;

    sidebarName.textContent = userName;
    mainProfileName.textContent = userName;
    sidebarEmail.textContent = userEmail;
    mainProfileEmail.textContent = userEmail;

    const userAvatar = metadata?.avatar_url || DEFAULT_AVATAR;
    sidebarAvatar.src = userAvatar;
    mainProfileAvatar.src = userAvatar;

    if (metadata?.banner_color) {
        profileBanner.style.background = metadata.banner_color;
        bannerColorPicker.value = metadata.banner_color;
    }

    if (!metadata?.profile_setup_completed) {
        welcomeModal.classList.remove('hidden');
    }

    // Chama a função que busca o número de salas
    await fetchUserStats(user.id);
}

// ==========================================
// 5. INTERAÇÕES E SALVAMENTO DE FOTO
// ==========================================

btnCloseWelcome.addEventListener('click', async () => {
    welcomeModal.classList.add('hidden');
    await supabase.auth.updateUser({
        data: { profile_setup_completed: true }
    });
});

profileBanner.addEventListener('click', () => bannerColorPicker.click());
bannerColorPicker.addEventListener('input', (e) => {
    profileBanner.style.background = e.target.value;
});
bannerColorPicker.addEventListener('change', async (e) => {
    const { error } = await supabase.auth.updateUser({
        data: { banner_color: e.target.value }
    });
    if (error) console.error("Erro no banner:", error);
});

// Lógica de Upload da Foto com Loader e Modal Customizado
avatarFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Inicia a animação de carregamento
    showLoading("Salvando sua foto no theGlobe...");

    // Mostra a foto instantaneamente pro usuário ver como ficou
    const objectUrl = URL.createObjectURL(file);
    mainProfileAvatar.src = objectUrl;
    sidebarAvatar.src = objectUrl;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;

        // Upload pro Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Pega URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Atualiza perfil
        const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: publicUrl }
        });

        if (updateError) throw updateError;

        // Oculta loading e exibe modal de SUCESSO com Vetor
        hideLoading();
        showAlert("Foto Atualizada!", "Sua foto de perfil foi salva com sucesso e não sumirá mais.", "success");

    } catch (error) {
        console.error("Erro ao salvar a foto:", error);
        
        // Oculta loading e exibe modal de ERRO com Vetor
        hideLoading();
        showAlert("Falha no Upload", "Não foi possível salvar a foto. Verifique as permissões do seu banco de dados.", "error");
        
        // Reverte a imagem
        mainProfileAvatar.src = DEFAULT_AVATAR;
        sidebarAvatar.src = DEFAULT_AVATAR;
    }
});

// ==========================================
// 6. LOGOUT
// ==========================================
btnLogout.addEventListener('click', async () => {
    showLoading("Desconectando...");
    const { error } = await supabase.auth.signOut();
    hideLoading();
    
    if (error) {
        showAlert("Erro", "Ocorreu um erro ao tentar sair da conta.", "error");
    } else {
        window.location.replace('index.html');
    }
});

initProfile();
