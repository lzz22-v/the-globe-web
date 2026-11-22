// ==========================================
// UTILITÁRIO DE CORTE DE IMAGEM (CANVAS NATIVO)
// ==========================================

let cropperStylesInjected = false;

function injectCropperStyles() {
    if (cropperStylesInjected) return;
    cropperStylesInjected = true;

    const style = document.createElement('style');
    style.id = 'theglobe-image-cropper-styles';
    style.textContent = `
        .tg-cropper-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(10, 10, 16, 0.88);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
        .tg-cropper-modal {
            width: 100%;
            max-width: 460px;
            background: #161522;
            border: 1px solid #2e2b42;
            border-radius: 16px;
            padding: 20px;
            color: #f4f4f5;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
            display: flex;
            flex-direction: column;
            gap: 16px;
            font-family: inherit;
        }
        .tg-cropper-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .tg-cropper-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #fff;
        }
        .tg-cropper-close {
            background: transparent;
            border: none;
            color: #a1a1aa;
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 6px;
        }
        .tg-cropper-close:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.08);
        }
        .tg-cropper-stage {
            position: relative;
            width: 100%;
            height: 290px;
            background: #0d0d14;
            border: 1px solid #28253a;
            border-radius: 12px;
            overflow: hidden;
            touch-action: none;
            cursor: grab;
            user-select: none;
        }
        .tg-cropper-stage:active {
            cursor: grabbing;
        }
        .tg-cropper-canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
        .tg-cropper-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .tg-cropper-controls label {
            font-size: 13px;
            color: #a1a1aa;
            white-space: nowrap;
        }
        .tg-cropper-zoom {
            flex: 1;
            accent-color: #9b30ff;
            cursor: pointer;
        }
        .tg-cropper-hint {
            margin: 0;
            font-size: 12px;
            color: #71717a;
            text-align: center;
        }
        .tg-cropper-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 4px;
        }
        .tg-cropper-btn {
            padding: 9px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid transparent;
            transition: opacity 0.15s ease, background 0.15s ease;
        }
        .tg-cropper-btn-cancel {
            background: #232133;
            border-color: #322f47;
            color: #d4d4d8;
        }
        .tg-cropper-btn-cancel:hover {
            background: #2c2940;
        }
        .tg-cropper-btn-confirm {
            background: #9b30ff;
            color: #fff;
        }
        .tg-cropper-btn-confirm:hover {
            opacity: 0.92;
        }
    `;
    document.head.appendChild(style);
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Não foi possível carregar a imagem selecionada.'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
        reader.readAsDataURL(file);
    });
}

/**
 * Abre o modal de corte de imagem.
 * @param {File} file Arquivo de imagem selecionado pelo usuário
 * @param {Object} options Configurações de corte
 * @param {number} [options.aspectRatio=1] Proporção largura/altura (ex: 1 para avatar, 16/9 para capa)
 * @param {number} [options.outputWidth=400] Largura final gerada em px
 * @param {number} [options.outputHeight=400] Altura final gerada em px
 * @param {string} [options.title='Ajustar e cortar imagem'] Título exibido no modal
 * @param {boolean} [options.circular=false] Exibe guia circular no centro
 * @param {string} [options.mimeType='image/webp'] Formato de saída ('image/webp' ou 'image/jpeg')
 * @param {number} [options.quality=0.88] Qualidade da compressão (0 a 1)
 * @param {'dataUrl'|'file'} [options.returnType='dataUrl'] Tipo do retorno
 * @returns {Promise<{ dataUrl: string, file: File } | null>} Retorna null se o usuário cancelar
 */
export async function openImageCropper(file, options = {}) {
    if (!file || !file.type.startsWith('image/')) return null;

    injectCropperStyles();

    const {
        aspectRatio = 1,
        outputWidth = 400,
        outputHeight = Math.round(outputWidth / aspectRatio),
        title = 'Ajustar e cortar imagem',
        circular = false,
        mimeType = 'image/webp',
        quality = 0.88
    } = options;

    const img = await loadImageFromFile(file);

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'tg-cropper-overlay';
        overlay.innerHTML = `
            <div class="tg-cropper-modal" role="dialog" aria-modal="true" aria-labelledby="tg-cropper-title">
                <div class="tg-cropper-header">
                    <h3 id="tg-cropper-title">${title}</h3>
                    <button type="button" class="tg-cropper-close" aria-label="Fechar">×</button>
                </div>
                <div class="tg-cropper-stage">
                    <canvas class="tg-cropper-canvas"></canvas>
                </div>
                <div class="tg-cropper-controls">
                    <label for="tg-cropper-zoom-input">Zoom</label>
                    <input id="tg-cropper-zoom-input" class="tg-cropper-zoom" type="range" min="1" max="3" step="0.01" value="1">
                </div>
                <p class="tg-cropper-hint">Arraste a imagem para enquadrar e use o controle para aproximar</p>
                <div class="tg-cropper-actions">
                    <button type="button" class="tg-cropper-btn tg-cropper-btn-cancel">Cancelar</button>
                    <button type="button" class="tg-cropper-btn tg-cropper-btn-confirm">Aplicar corte</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const stage = overlay.querySelector('.tg-cropper-stage');
        const canvas = overlay.querySelector('.tg-cropper-canvas');
        const ctx = canvas.getContext('2d');
        const zoomInput = overlay.querySelector('.tg-cropper-zoom');
        const btnClose = overlay.querySelector('.tg-cropper-close');
        const btnCancel = overlay.querySelector('.tg-cropper-btn-cancel');
        const btnConfirm = overlay.querySelector('.tg-cropper-btn-confirm');

        let stageW = 0;
        let stageH = 0;
        let cropW = 0;
        let cropH = 0;
        let cropX = 0;
        let cropY = 0;

        let baseScale = 1;
        let zoom = 1;
        let offsetX = 0;
        let offsetY = 0;

        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let startOffsetX = 0;
        let startOffsetY = 0;

        function computeLayout() {
            const rect = stage.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            stageW = rect.width;
            stageH = rect.height;
            canvas.width = Math.round(stageW * dpr);
            canvas.height = Math.round(stageH * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const padding = 24;
            const maxW = stageW - padding * 2;
            const maxH = stageH - padding * 2;

            if (maxW / maxH > aspectRatio) {
                cropH = maxH;
                cropW = cropH * aspectRatio;
            } else {
                cropW = maxW;
                cropH = cropW / aspectRatio;
            }

            cropX = (stageW - cropW) / 2;
            cropY = (stageH - cropH) / 2;

            baseScale = Math.max(cropW / img.width, cropH / img.height);
            clampOffsets();
        }

        function clampOffsets() {
            const scale = baseScale * zoom;
            const drawnW = img.width * scale;
            const drawnH = img.height * scale;

            const maxOffsetX = Math.max(0, (drawnW - cropW) / 2);
            const maxOffsetY = Math.max(0, (drawnH - cropH) / 2);

            offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offsetX));
            offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offsetY));
        }

        function draw() {
            ctx.clearRect(0, 0, stageW, stageH);

            const scale = baseScale * zoom;
            const drawnW = img.width * scale;
            const drawnH = img.height * scale;
            const imgX = stageW / 2 - drawnW / 2 + offsetX;
            const imgY = stageH / 2 - drawnH / 2 + offsetY;

            ctx.drawImage(img, imgX, imgY, drawnW, drawnH);

            // Máscara escura fora da área de corte
            ctx.save();
            ctx.fillStyle = 'rgba(10, 10, 16, 0.68)';
            ctx.beginPath();
            ctx.rect(0, 0, stageW, stageH);
            if (circular) {
                ctx.arc(stageW / 2, stageH / 2, Math.min(cropW, cropH) / 2, 0, Math.PI * 2, true);
            } else {
                ctx.rect(cropX, cropY, cropW, cropH);
            }
            ctx.fill('evenodd');

            // Borda da área de corte
            ctx.strokeStyle = '#9b30ff';
            ctx.lineWidth = 2;
            if (circular) {
                ctx.beginPath();
                ctx.arc(stageW / 2, stageH / 2, Math.min(cropW, cropH) / 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeRect(cropX, cropY, cropW, cropH);
            }
            ctx.restore();
        }

        function cleanup(result) {
            window.removeEventListener('resize', handleResize);
            overlay.remove();
            resolve(result);
        }

        function handleResize() {
            computeLayout();
            draw();
        }

        stage.addEventListener('pointerdown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            startOffsetX = offsetX;
            startOffsetY = offsetY;
            stage.setPointerCapture(e.pointerId);
        });

        stage.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            offsetX = startOffsetX + (e.clientX - dragStartX);
            offsetY = startOffsetY + (e.clientY - dragStartY);
            clampOffsets();
            draw();
        });

        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (e.pointerId && stage.hasPointerCapture(e.pointerId)) {
                stage.releasePointerCapture(e.pointerId);
            }
        };
        stage.addEventListener('pointerup', stopDrag);
        stage.addEventListener('pointercancel', stopDrag);

        stage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            zoom = Math.min(3, Math.max(1, Number((zoom + delta).toFixed(2))));
            zoomInput.value = String(zoom);
            clampOffsets();
            draw();
        }, { passive: false });

        zoomInput.addEventListener('input', () => {
            zoom = Number(zoomInput.value);
            clampOffsets();
            draw();
        });

        btnClose.addEventListener('click', () => cleanup(null));
        btnCancel.addEventListener('click', () => cleanup(null));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(null);
        });

        btnConfirm.addEventListener('click', () => {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = outputWidth;
            outCanvas.height = outputHeight;
            const outCtx = outCanvas.getContext('2d');

            const scale = baseScale * zoom;
            const drawnW = img.width * scale;
            const drawnH = img.height * scale;
            const imgX = stageW / 2 - drawnW / 2 + offsetX;
            const imgY = stageH / 2 - drawnH / 2 + offsetY;

            const srcX = (cropX - imgX) / scale;
            const srcY = (cropY - imgY) / scale;
            const srcW = cropW / scale;
            const srcH = cropH / scale;

            outCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight);

            const dataUrl = outCanvas.toDataURL(mimeType, quality);
            outCanvas.toBlob((blob) => {
                const ext = mimeType === 'image/jpeg' ? 'jpg' : 'webp';
                const baseName = file.name.replace(/\.[^.]+$/, '');
                const croppedFile = blob
                    ? new File([blob], `${baseName}.${ext}`, { type: mimeType })
                    : file;
                cleanup({ dataUrl, file: croppedFile });
            }, mimeType, quality);
        });

        window.addEventListener('resize', handleResize);
        requestAnimationFrame(() => {
            computeLayout();
            draw();
        });
    });
}