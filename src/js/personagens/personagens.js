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
const btnCreateFolder = document.getElementById('btn-create-folder');
const btnBackFolders = document.getElementById('btn-back-folders');
const btnRenameFolder = document.getElementById('btn-rename-folder');
const btnDeleteFolder = document.getElementById('btn-delete-folder');
const currentFolderTitle = document.getElementById('current-folder-title');
const folderSelect = document.getElementById('input-char-folder');
const folderModal = document.getElementById('modal-folder');
const folderModalTitle = document.getElementById('folder-modal-title');
const folderForm = document.getElementById('form-folder');
const folderIdInput = document.getElementById('folder-id-input');
const folderNameInput = document.getElementById('input-folder-name');

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
const inputCharRelevance = document.getElementById('input-char-relevance');
const relevanceChoiceList = document.getElementById('relevance-choice-list');

const colorPaletteContainer = document.getElementById('color-palette');
const badgeColorDot = document.getElementById('badge-color-dot');
const badgeColorHex = document.getElementById('badge-color-hex');

let characters = [];
let folders = [];
let currentUser = null;
let currentFolderId = null;
let selectedColor = PALETTE_COLORS[0];
let currentAvatarBase64 = null;
const UNFILED_FOLDER = '__unfiled__';

// Pesos de relevância para fixar protagonistas no topo
const RELEVANCE_WEIGHT = {
    'protagonista': 1,
    'coadjuvante': 2,
    'secundario': 3,
    'figurante': 4
};

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
    await loadFolders();
    await loadCharacters();
}

async function loadFolders() {
    const { data, error } = await supabase
        .from('character_folders')
        .select('id, name, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao carregar pastas de personagens:', error);
        folders = [];
        return;
    }

    folders = data || [];
}

// ==========================================
// 2. BUSCAR PERSONAGENS DO SUPABASE
// ==========================================
async function loadCharacters() {
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', currentUser.id);

    if (error) {
        console.error('Erro ao carregar personagens:', error);
        return;
    }

    characters = (data || []).map(c => ({
        id: c.id,
        folderId: c.folder_id || null,
        name: c.name,
        description: c.description || '',
        color: c.color || PALETTE_COLORS[0],
        avatar: c.avatar_url || null,
        initials: c.initials || (c.name ? c.name.substring(0, 2).toUpperCase() : '??'),
        relevance: c.relevance || 'secundario',
        created_at: c.created_at
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

    const customColorLabel = document.createElement('label');
    customColorLabel.className = `color-swatch custom-color-swatch ${PALETTE_COLORS.includes(selectedColor.toUpperCase()) ? '' : 'active'}`;
    customColorLabel.title = 'Escolher cor personalizada';
    customColorLabel.setAttribute('aria-label', 'Escolher cor personalizada');
    customColorLabel.innerHTML = '<span aria-hidden="true">+</span><input type="color" id="custom-character-color" aria-label="Escolher uma cor personalizada">';
    const customColorInput = customColorLabel.querySelector('input');
    customColorInput.value = /^#[0-9a-f]{6}$/i.test(selectedColor) ? selectedColor : PALETTE_COLORS[0];
    customColorInput.addEventListener('input', () => {
        selectedColor = customColorInput.value.toUpperCase();
        updateColorSelection();
    });
    colorPaletteContainer.appendChild(customColorLabel);

    updateColorSelection();
}

function updateColorSelection() {
    const swatches = colorPaletteContainer.querySelectorAll('.color-swatch:not(.custom-color-swatch)');
    const customSwatch = colorPaletteContainer.querySelector('.custom-color-swatch');
    const customColorInput = colorPaletteContainer.querySelector('#custom-character-color');
    swatches.forEach(s => {
        if (s.style.backgroundColor === hexToRgb(selectedColor) || s.style.backgroundColor === selectedColor) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    if (customSwatch) {
        const isCustomColor = !PALETTE_COLORS.some(color => color.toLowerCase() === selectedColor.toLowerCase());
        customSwatch.classList.toggle('active', isCustomColor);
        customSwatch.style.backgroundColor = isCustomColor ? selectedColor : '';
        if (customColorInput && /^#[0-9a-f]{6}$/i.test(selectedColor)) customColorInput.value = selectedColor;
    }

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
        if (inputCharRelevance) inputCharRelevance.value = char.relevance || 'secundario';
        syncRelevanceChoices();
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
        if (inputCharRelevance) inputCharRelevance.value = 'secundario';
        syncRelevanceChoices();
        selectedColor = PALETTE_COLORS[0];
        resetDropzone();
    }

    const defaultFolderId = char?.folderId || (currentFolderId && currentFolderId !== UNFILED_FOLDER ? currentFolderId : '');
    renderFolderSelect(defaultFolderId);
    renderPalette();
    modalOverlay.classList.remove('hidden');
}

function renderFolderSelect(selectedFolderId = '') {
    if (!folderSelect) return;
    folderSelect.replaceChildren();

    const unfiledOption = document.createElement('option');
    unfiledOption.value = '';
    unfiledOption.textContent = 'Sem pasta';
    folderSelect.appendChild(unfiledOption);

    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        folderSelect.appendChild(option);
    });
    folderSelect.value = selectedFolderId || '';
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

function openFolderModal(folder = null) {
    folderIdInput.value = folder?.id || '';
    folderModalTitle.textContent = folder ? 'Renomear pasta' : 'Criar pasta';
    folderNameInput.value = folder?.name || '';
    folderModal.classList.remove('hidden');
    folderNameInput.focus();
}

function closeFolderModal() {
    folderModal.classList.add('hidden');
    folderForm.reset();
}

if (btnCreateFolder) btnCreateFolder.addEventListener('click', () => openFolderModal());
if (btnBackFolders) btnBackFolders.addEventListener('click', () => {
    currentFolderId = null;
    renderCharacters();
});
if (btnRenameFolder) btnRenameFolder.addEventListener('click', () => {
    const folder = folders.find(item => item.id === currentFolderId);
    if (folder) openFolderModal(folder);
});
if (btnDeleteFolder) btnDeleteFolder.addEventListener('click', async () => {
    const folder = folders.find(item => item.id === currentFolderId);
    if (!folder || !confirm(`Excluir a pasta “${folder.name}”? Os personagens serão mantidos em “Sem pasta”.`)) return;

    const { error } = await supabase
        .from('character_folders')
        .delete()
        .eq('id', folder.id)
        .eq('user_id', currentUser.id);

    if (error) {
        console.error('Erro ao excluir pasta:', error);
        alert('Não foi possível excluir a pasta.');
        return;
    }

    currentFolderId = null;
    await loadFolders();
    await loadCharacters();
});

document.getElementById('btn-close-folder-modal')?.addEventListener('click', closeFolderModal);
document.getElementById('btn-cancel-folder-modal')?.addEventListener('click', closeFolderModal);
if (folderModal) folderModal.addEventListener('click', event => {
    if (event.target === folderModal) closeFolderModal();
});

if (folderForm) folderForm.addEventListener('submit', async event => {
    event.preventDefault();
    const id = folderIdInput.value;
    const name = folderNameInput.value.trim();
    if (!name) return;

    const query = id
        ? supabase.from('character_folders').update({ name }).eq('id', id).eq('user_id', currentUser.id)
        : supabase.from('character_folders').insert({ user_id: currentUser.id, name });
    const { error } = await query;
    if (error) {
        console.error('Erro ao salvar pasta:', error);
        alert(error.code === '23505' ? 'Você já tem uma pasta com esse nome.' : 'Não foi possível salvar a pasta.');
        return;
    }

    await loadFolders();
    renderCharacters();
    closeFolderModal();
});

// ==========================================
// 6. SALVAR PERSONAGEM (SUBMIT DO FORM NO SUPABASE)
// ==========================================
formPersonagem.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = inputCharName.value.trim();
    const description = inputCharDesc.value.trim();
    const relevance = inputCharRelevance?.value || 'secundario';
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
                initials: avatarUrl ? null : initials,
                folder_id: folderSelect?.value || null,
                relevance: relevance
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
                initials: avatarUrl ? null : initials,
                folder_id: folderSelect?.value || null,
                relevance: relevance
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
    const isRoot = currentFolderId === null;
    const isUnfiled = currentFolderId === UNFILED_FOLDER;
    const activeFolder = folders.find(folder => folder.id === currentFolderId);
    
    let visibleCharacters = isRoot
        ? []
        : characters.filter(character => isUnfiled ? !character.folderId : character.folderId === currentFolderId);

    // ORDENAÇÃO POR RELEVÂNCIA (Protagonistas fixados no topo) E DESEMPATE POR DATA
    visibleCharacters.sort((a, b) => {
        const weightA = RELEVANCE_WEIGHT[a.relevance] || 3;
        const weightB = RELEVANCE_WEIGHT[b.relevance] || 3;

        if (weightA !== weightB) {
            return weightA - weightB; // Menor peso (1 = Protagonista) vem primeiro
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });

    if (btnBackFolders) btnBackFolders.classList.toggle('hidden', isRoot);
    if (btnRenameFolder) btnRenameFolder.classList.toggle('hidden', isRoot || isUnfiled || !activeFolder);
    if (btnDeleteFolder) btnDeleteFolder.classList.toggle('hidden', isRoot || isUnfiled || !activeFolder);
    if (btnCreateFolder) btnCreateFolder.classList.toggle('hidden', !isRoot);
    if (currentFolderTitle) currentFolderTitle.textContent = isRoot ? 'Pastas da carteira' : (isUnfiled ? 'Sem pasta' : activeFolder?.name || 'Pasta');

    if (characterCount) {
        characterCount.textContent = isRoot
            ? `${folders.length} pasta${folders.length !== 1 ? 's' : ''} · ${characters.length} personagem${characters.length !== 1 ? 's' : ''}`
            : `${visibleCharacters.length} personagem${visibleCharacters.length !== 1 ? 's' : ''}`;
    }

    if (isRoot) {
        folders.forEach(folder => {
            const count = characters.filter(character => character.folderId === folder.id).length;
            const card = createFolderCard(folder.name, count, () => {
                currentFolderId = folder.id;
                renderCharacters();
            });
            grid.appendChild(card);
        });

        const unfiledCharacters = characters.filter(character => !character.folderId);
        if (unfiledCharacters.length) {
            grid.appendChild(createFolderCard('Sem pasta', unfiledCharacters.length, () => {
                currentFolderId = UNFILED_FOLDER;
                renderCharacters();
            }, true));
        }

        if (!folders.length && !unfiledCharacters.length) {
            grid.innerHTML = '<p class="wallet-empty-state">Sua carteira está vazia. Crie uma pasta para organizar os personagens das suas sessões.</p>';
        }
        return;
    }

    if (!visibleCharacters.length) {
        grid.innerHTML = '<p class="wallet-empty-state">Esta pasta ainda não tem personagens. Use “Criar personagem” para adicionar um.</p>';
        return;
    }

    visibleCharacters.forEach(char => {
        const card = document.createElement('div');
        card.className = `char-card relevance-${char.relevance || 'secundario'}`;
        card.style.borderTop = `3px solid ${char.color}`;

        const avatarHTML = char.avatar
            ? `<img src="${char.avatar}" alt="${char.name}" class="card-avatar" style="border: 2px solid ${char.color}">`
            : `<div class="card-avatar-initials" style="color: ${char.color}; border: 2px solid ${char.color}">${char.initials || char.name.substring(0, 2).toUpperCase()}</div>`;

        card.innerHTML = `
            <div>
                <div class="card-header">
                    ${avatarHTML}
                    <div class="card-title-group">
                        <div class="title-with-badge">
                            <h3>${char.name}</h3>
                            <span class="relevance-badge badge-${char.relevance}">
                                ${getRelevanceSvgIcon(char.relevance)}
                                ${formatRelevanceLabel(char.relevance)}
                            </span>
                        </div>
                        <span class="color-tag"><span class="color-dot" style="background-color: ${char.color}"></span>${char.color.toUpperCase()}</span>
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

function syncRelevanceChoices() {
    if (!relevanceChoiceList || !inputCharRelevance) return;
    relevanceChoiceList.querySelectorAll('[data-relevance]').forEach(button => {
        const selected = button.dataset.relevance === inputCharRelevance.value;
        button.setAttribute('aria-checked', String(selected));
        button.tabIndex = selected ? 0 : -1;
    });
}

if (relevanceChoiceList) {
    relevanceChoiceList.addEventListener('click', event => {
        const button = event.target.closest('[data-relevance]');
        if (!button) return;
        inputCharRelevance.value = button.dataset.relevance;
        syncRelevanceChoices();
    });
    relevanceChoiceList.querySelectorAll('[data-relevance]').forEach(button => {
        button.querySelector('.relevance-choice-icon').innerHTML = getRelevanceSvgIcon(button.dataset.relevance);
    });
    syncRelevanceChoices();
}

function formatRelevanceLabel(relevance) {
    switch(relevance) {
        case 'protagonista': return 'Protagonista';
        case 'coadjuvante': return 'Coadjuvante';
        case 'secundario': return 'Secundário';
        case 'figurante': return 'Figurante';
        default: return 'Secundário';
    }
}

function getRelevanceSvgIcon(relevance) {
    // Símbolos vetoriais distintos para comunicar a importância narrativa.
    const icon = (label, paths) => `<svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${label}"><title>${label}</title>${paths}</svg>`;
    switch(relevance) {
        case 'protagonista':
            return icon('Protagonista', '<path d="m3 17 2-10 5 4 2-7 2 7 5-4 2 10H3Z"/><path d="M4 20h16"/><circle cx="12" cy="4" r="1" fill="currentColor" stroke="none"/>');
        case 'coadjuvante':
            return icon('Coadjuvante', '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19z"/><path d="M15 14a4.2 4.2 0 0 1 5.5 4v1h-4"/>');
        case 'secundario':
            return icon('Secundário', '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 1.5v2M22.5 12h-2"/>');
        case 'figurante':
            return icon('Figurante', '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="17" cy="9" r="2"/><path d="M3.5 17a3.5 3.5 0 0 1 7 0M8.5 16a3.5 3.5 0 0 1 7 0M13.5 17a3.5 3.5 0 0 1 7 0"/>');
        default:
            return icon('Secundário', '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/>');
    }
}
function createFolderCard(name, count, onOpen, isUnfiled = false) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `folder-card${isUnfiled ? ' unfiled-folder-card' : ''}`;
    card.innerHTML = `
        <span class="folder-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
        </span>
        <span class="folder-card-copy"><strong></strong><small>${count} personagem${count !== 1 ? 's' : ''}</small></span>
        <span class="folder-card-arrow">›</span>
    `;
    card.querySelector('strong').textContent = name;
    card.addEventListener('click', onOpen);
    return card;
}

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