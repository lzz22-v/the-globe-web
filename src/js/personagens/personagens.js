import { supabase } from '../config/supabase.js';

// Cores para a paleta idênticas às imagens de modelo
const PALETTE_COLORS = [
    '#9B30FF', '#E24B4A', '#34D399', '#3ABFF8', '#F59E0B', 
    '#EC4899', '#6366F1', '#06B6D4', '#10B981', '#F97316', 
    '#EF4444', '#84CC16', '#14B8A6', '#A855F7'
];

// Mapeamento dos elementos da página
const grid = document.getElementById('character-grid');
const characterCount = document.getElementById('character-count');
const btnCreate = document.getElementById('btn-create-character');

// Mapeamento dos elementos do Modal
const modalOverlay = document.getElementById('modal-personagem');
const modalTitle = document.getElementById('modal-title');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const formPersonagem = document.getElementById('form-personagem');

const charIdInput = document.getElementById('char-id-input');
const inputAvatarFile = document.getElementById('input-avatar-file');
const uploadDropzone = document.getElementById('upload-dropzone');
const dropzoneContent = document.getElementById('dropzone-content');
const avatarPreview = document.getElementById('avatar-preview');

const inputCharName = document.getElementById('input-char-name');
const inputCharDesc = document.getElementById('input-char-desc');

const colorPaletteContainer = document.getElementById('color-palette');
const badgeColorDot = document.getElementById('badge-color-dot');
const badgeColorHex = document.getElementById('badge-color-hex');

let characters = [];
let currentUser = null;
let selectedColor = PALETTE_COLORS[0];
let currentAvatarBase64 = null;

// ==========================================
// 1. INICIALIZAÇÃO E AUTENTICAÇÃO
// ==========================================
async function init() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        window.location.replace('index.html');
        return;
    }

    currentUser = session.user;
    const metadata = currentUser.user_metadata;

    const sidebarName = document.getElementById('sidebar-name');
    const sidebarEmail = document.getElementById('sidebar-email');
    const sidebarAvatar = document.getElementById('sidebar-avatar');

    if (sidebarName) sidebarName.textContent = metadata?.full_name || metadata?.name || 'Usuário';
    if (sidebarEmail) sidebarEmail.textContent = currentUser.email || '';
    if (sidebarAvatar && metadata?.avatar_url) sidebarAvatar.src = metadata.avatar_url;

    renderPalette();
    setupDropzone();
    await loadCharacters();
}

// ==========================================
// 2. BUSCAR PERSONAGENS DO SUPABASE
// ==========================================
async function loadCharacters() {
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar personagens:', error);
        return;
    }

    characters = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        color: c.color || PALETTE_COLORS[0],
        avatar: c.avatar_url || null,
        initials: c.initials || (c.name ? c.name.substring(0, 2).toUpperCase() : '??')
    }));

    renderCharacters();
}

// ==========================================
// 3. RENDERIZAÇÃO DA PALETA DE CORES
// ==========================================
function renderPalette() {
    colorPaletteContainer.innerHTML = '';

    PALETTE_COLORS.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = `color-swatch ${color === selectedColor ? 'active' : ''}`;
        swatch.style.backgroundColor = color;

        swatch.addEventListener('click', () => {
            selectedColor = color;
            updateColorSelection();
        });

        colorPaletteContainer.appendChild(swatch);
    });

    updateColorSelection();
}

function updateColorSelection() {
    const swatches = colorPaletteContainer.querySelectorAll('.color-swatch');
    swatches.forEach(s => {
        if (s.style.backgroundColor === hexToRgb(selectedColor) || s.style.backgroundColor === selectedColor) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    if (badgeColorDot) badgeColorDot.style.backgroundColor = selectedColor;
    if (badgeColorHex) badgeColorHex.textContent = selectedColor.toUpperCase();
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
}

// ==========================================
// 4. UPLOAD DE FOTO (DRAG & DROP / SELECT)
// ==========================================
function setupDropzone() {
    if (!uploadDropzone) return;

    uploadDropzone.addEventListener('click', () => inputAvatarFile.click());

    inputAvatarFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    });

    uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('dragover');
    });

    uploadDropzone.addEventListener('dragleave', () => {
        uploadDropzone.classList.remove('dragover');
    });

    uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        }
    });
}

function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        currentAvatarBase64 = e.target.result;
        avatarPreview.src = currentAvatarBase64;
        avatarPreview.classList.remove('hidden');
        dropzoneContent.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function resetDropzone() {
    currentAvatarBase64 = null;
    if (avatarPreview) {
        avatarPreview.src = '';
        avatarPreview.classList.add('hidden');
    }
    if (dropzoneContent) dropzoneContent.classList.remove('hidden');
    if (inputAvatarFile) inputAvatarFile.value = '';
}

// ==========================================
// 5. ABRIR E FECHAR O MODAL
// ==========================================
function openModal(char = null) {
    if (char) {
        modalTitle.textContent = 'Editar personagem';
        charIdInput.value = char.id;
        inputCharName.value = char.name;
        inputCharDesc.value = char.description || '';
        selectedColor = char.color || PALETTE_COLORS[0];

        if (char.avatar) {
            currentAvatarBase64 = char.avatar;
            avatarPreview.src = char.avatar;
            avatarPreview.classList.remove('hidden');
            dropzoneContent.classList.add('hidden');
        } else {
            resetDropzone();
        }
    } else {
        modalTitle.textContent = 'Criar personagem';
        charIdInput.value = '';
        inputCharName.value = '';
        inputCharDesc.value = '';
        selectedColor = PALETTE_COLORS[0];
        resetDropzone();
    }

    renderPalette();
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}

if (btnCreate) btnCreate.addEventListener('click', () => openModal());
if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

// ==========================================
// 6. SALVAR PERSONAGEM (SUBMIT DO FORM NO SUPABASE)
// ==========================================
formPersonagem.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = inputCharName.value.trim();
    const description = inputCharDesc.value.trim();
    const id = charIdInput.value;

    if (!name) return;

    const initials = name.substring(0, 2).toUpperCase();
    const avatarUrl = currentAvatarBase64 || null;

    if (id) {
        // Atualizar
        const { error } = await supabase
            .from('characters')
            .update({
                name: name,
                description: description,
                color: selectedColor,
                avatar_url: avatarUrl,
                initials: avatarUrl ? null : initials
            })
            .eq('id', id)
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('Erro ao atualizar personagem:', error);
            alert('Erro ao salvar alterações no banco de dados.');
            return;
        }
    } else {
        // Criar
        const { error } = await supabase
            .from('characters')
            .insert({
                user_id: currentUser.id,
                name: name,
                description: description || 'Sem descrição informada.',
                color: selectedColor,
                avatar_url: avatarUrl,
                initials: avatarUrl ? null : initials
            });

        if (error) {
            console.error('Erro ao criar personagem:', error);
            alert('Erro ao salvar personagem no banco de dados.');
            return;
        }
    }

    await loadCharacters();
    closeModal();
});

// ==========================================
// 7. RENDERIZAÇÃO DOS CARDS DE PERSONAGENS
// ==========================================
function renderCharacters() {
    grid.innerHTML = '';
    if (characterCount) {
        characterCount.textContent = `${characters.length} personagem${characters.length !== 1 ? 's' : ''} criado${characters.length !== 1 ? 's' : ''}`;
    }

    if (characters.length === 0) {
        grid.innerHTML = '<p style="color: #a1a1aa; grid-column: 1/-1; text-align: center; padding: 40px 0;">Nenhum personagem cadastrado na sua carteira. Clique em "+ Criar personagem" para começar!</p>';
        return;
    }

    characters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.style.borderTop = `3px solid ${char.color}`;

        let avatarHTML = char.avatar 
            ? `<img src="${char.avatar}" alt="${char.name}" class="card-avatar" style="border: 2px solid ${char.color}">`
            : `<div class="card-avatar-initials" style="color: ${char.color}; border: 2px solid ${char.color}">${char.initials || char.name.substring(0, 2).toUpperCase()}</div>`;

        card.innerHTML = `
            <div>
                <div class="card-header">
                    ${avatarHTML}
                    <div class="card-title-group">
                        <h3>${char.name}</h3>
                        <span class="color-tag">
                            <span class="color-dot" style="background-color: ${char.color}"></span>
                            ${char.color.toUpperCase()}
                        </span>
                    </div>
                </div>
                <p class="card-description">${char.description}</p>
            </div>
            <div class="card-actions">
                <button class="btn-edit" data-id="${char.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Editar
                </button>
                <button class="btn-delete" data-id="${char.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;

        card.querySelector('.btn-edit').addEventListener('click', () => openModal(char));
        card.querySelector('.btn-delete').addEventListener('click', () => deleteCharacter(char.id));

        grid.appendChild(card);
    });
}

// ==========================================
// 8. DELETAR PERSONAGEM
// ==========================================
async function deleteCharacter(id) {
    if (!confirm('Deseja excluir este personagem da sua carteira?')) return;

    const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

    if (error) {
        console.error('Erro ao excluir personagem:', error);
        alert('Erro ao excluir o personagem do banco de dados.');
        return;
    }

    await loadCharacters();
}

init();