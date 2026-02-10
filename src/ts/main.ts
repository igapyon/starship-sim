// @ts-nocheck
        const WORLD_SIZE = 720;
        const MIN_ZOOM = 0.5;
        const ZOOM_STEPS = [0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 3, 4];
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const infoDiv = document.getElementById('info');
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomValueLabel = document.getElementById('zoom-value');
        const renderState = {
            dpr: 1,
            viewportWidth: 0,
            viewportHeight: 0,
            worldScale: 1,
            offsetX: 0,
            offsetY: 0,
            zoomLevels: [MIN_ZOOM, 1],
            zoom: 1
        };

        function formatZoomLabel(zoom) {
            return `${parseFloat(zoom.toFixed(3))}x`;
        }

        function updateZoomControls() {
            const maxFittableZoom = Math.min(renderState.viewportWidth, renderState.viewportHeight) / WORLD_SIZE;
            const levels = ZOOM_STEPS.filter((zoom) => zoom <= maxFittableZoom + 0.000001);
            if (levels.length === 0) levels.push(MIN_ZOOM);
            if (levels.length === 1) {
                const nextLevel = ZOOM_STEPS.find((zoom) => zoom > levels[0]);
                if (nextLevel !== undefined) levels.push(nextLevel);
            }
            renderState.zoomLevels = levels;

            zoomSlider.min = '0';
            zoomSlider.max = String(levels.length - 1);
            zoomSlider.step = '1';

            const currentIndex = levels.indexOf(renderState.zoom);
            if (currentIndex === -1) {
                renderState.zoom = levels[levels.length - 1];
                zoomSlider.value = String(levels.length - 1);
            } else {
                zoomSlider.value = String(currentIndex);
            }

            zoomValueLabel.textContent = formatZoomLabel(renderState.zoom);
        }

        function recomputeRenderState() {
            const worldPixelSize = WORLD_SIZE * renderState.zoom;
            renderState.worldScale = renderState.zoom;
            renderState.offsetX = Math.floor((renderState.viewportWidth - worldPixelSize) / 2);
            renderState.offsetY = Math.floor((renderState.viewportHeight - worldPixelSize) / 2);
        }

        function resizeCanvas() {
            renderState.dpr = window.devicePixelRatio || 1;
            renderState.viewportWidth = window.innerWidth;
            renderState.viewportHeight = window.innerHeight;
            canvas.width = Math.floor(renderState.viewportWidth * renderState.dpr);
            canvas.height = Math.floor(renderState.viewportHeight * renderState.dpr);
            canvas.style.width = `${renderState.viewportWidth}px`;
            canvas.style.height = `${renderState.viewportHeight}px`;
            updateZoomControls();
            recomputeRenderState();
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        function screenToWorld(screenX, screenY) {
            const worldX = (screenX - renderState.offsetX) / renderState.worldScale;
            const worldY = (screenY - renderState.offsetY) / renderState.worldScale;
            if (worldX < 0 || worldX > WORLD_SIZE || worldY < 0 || worldY > WORLD_SIZE) return null;
            return { x: worldX, y: worldY };
        }


        // ========================================
        // イベントハンドラ
        // ========================================

        function handleMove(e) {
            const rect = canvas.getBoundingClientRect();
            let screenX;
            let screenY;
            if (e.touches) {
                screenX = e.touches[0].clientX - rect.left;
                screenY = e.touches[0].clientY - rect.top;
            } else if (e.changedTouches) {
                screenX = e.changedTouches[0].clientX - rect.left;
                screenY = e.changedTouches[0].clientY - rect.top;
            } else {
                screenX = e.clientX - rect.left;
                screenY = e.clientY - rect.top;
            }
            const worldPoint = screenToWorld(screenX, screenY);
            if (!worldPoint) return;
            mouseX = worldPoint.x;
            mouseY = worldPoint.y;
        }

        document.addEventListener('mousemove', handleMove);
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMove(e);
        }, { passive: false });

        // テストボタンのイベントハンドラ
        document.querySelectorAll('.test-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const config = btn.dataset.config;
                initializeGame(config);
            });
        });

        // 残骸攻撃トグルボタンのイベントハンドラ
        document.getElementById('wreckage-toggle').addEventListener('click', () => {
            attackWrecks = !attackWrecks;
            const toggle = document.getElementById('wreckage-toggle');
            if (attackWrecks) {
                toggle.classList.add('active');
                toggle.textContent = '残骸を攻撃する';
            } else {
                toggle.classList.remove('active');
                toggle.textContent = '残骸を無視する';
            }
        });

        // ビーコンチームボタンのイベントハンドラ
        const beaconTeamButtons = document.querySelectorAll('.beacon-team-btn');
        function updateBeaconTeamSelection(teamId) {
            selectedBeaconTeam = teamId;
            beaconTeamButtons.forEach((button) => {
                if (button.dataset.team === teamId) button.classList.add('active');
                else button.classList.remove('active');
            });
        }
        beaconTeamButtons.forEach((button) => {
            button.addEventListener('click', () => {
                updateBeaconTeamSelection(button.dataset.team);
            });
        });

        function placeBeaconFromEvent(e) {
            const rect = canvas.getBoundingClientRect();
            let screenX;
            let screenY;
            if (e.touches) {
                screenX = e.touches[0].clientX - rect.left;
                screenY = e.touches[0].clientY - rect.top;
            } else if (e.changedTouches) {
                screenX = e.changedTouches[0].clientX - rect.left;
                screenY = e.changedTouches[0].clientY - rect.top;
            } else {
                screenX = e.clientX - rect.left;
                screenY = e.clientY - rect.top;
            }
            const worldPoint = screenToWorld(screenX, screenY);
            if (!worldPoint) return;

            // ビーコンを配置
            detectionBeacons.push(new DetectionBeacon(worldPoint.x, worldPoint.y, selectedBeaconTeam));
        }

        // キャンバスクリック/タップでビーコン配置
        canvas.addEventListener('click', (e) => {
            placeBeaconFromEvent(e);
        });
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            placeBeaconFromEvent(e);
        }, { passive: false });

        zoomSlider.addEventListener('input', () => {
            const index = Number(zoomSlider.value);
            const nextZoom = renderState.zoomLevels[index];
            if (!nextZoom) return;
            renderState.zoom = nextZoom;
            zoomValueLabel.textContent = formatZoomLabel(nextZoom);
            recomputeRenderState();
        });

        document.addEventListener('contextmenu', (e) => e.preventDefault());
