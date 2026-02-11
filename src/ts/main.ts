// @ts-nocheck
        const WORLD_SIZE = 720;
        const MIN_ZOOM = 0.5;
        const AUTO_FOCUS_DELAY_MS = 3000;
        const SHIP_PICK_TOLERANCE = 8;
        const ZOOM_STEPS = [0.4, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 3, 4];
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const infoDiv = document.getElementById('info');
        const githubLink = document.getElementById('github-link');
        const testButtons = document.getElementById('test-buttons');
        const bottomControls = document.getElementById('bottom-controls');
        const zoomControls = document.getElementById('zoom-controls');
        const zoomOutButton = document.getElementById('zoom-out');
        const zoomInButton = document.getElementById('zoom-in');
        const zoomValueLabel = document.getElementById('zoom-value');
        let hasInitializedZoom = false;
        let hasUserAdjustedZoom = false;
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
        const followState = {
            selectedShip: null,
            preferredTeamId: null,
            lastKnownX: WORLD_SIZE / 2,
            lastKnownY: WORLD_SIZE / 2,
            pendingAutoFocusAt: 0,
            forceCenterOnNextFrame: false
        };

        function getAllShips() {
            if (typeof TEAM_IDS === 'undefined' || typeof teamShips === 'undefined') return [];
            return TEAM_IDS.flatMap((teamId) => teamShips[teamId] || []);
        }

        function getShipTeamId(ship) {
            if (!ship || typeof TEAM_IDS === 'undefined' || typeof teamShips === 'undefined') return null;
            for (const teamId of TEAM_IDS) {
                const ships = teamShips[teamId] || [];
                if (ships.includes(ship)) return teamId;
            }
            if (typeof TEAM_COLORS !== 'undefined') {
                for (const teamId of TEAM_IDS) {
                    if (TEAM_COLORS[teamId] === ship.color) return teamId;
                }
            }
            return null;
        }

        function getPreferredAliveShip(preferredTeamId) {
            const hasPropulsion = (ship) => ship && ship.isAlive() && ship.engines && ship.engines.length > 0;

            if (preferredTeamId && typeof teamShips !== 'undefined') {
                const preferredShips = teamShips[preferredTeamId] || [];
                for (const ship of preferredShips) {
                    if (hasPropulsion(ship)) return ship;
                }
            }

            // 同陣営に候補がいない場合でも、まずは推進力ありを優先
            const allShips = getAllShips();
            for (const ship of allShips) {
                if (hasPropulsion(ship)) return ship;
            }
            return null;
        }

        function selectFollowShip(ship, forceCenter = true) {
            followState.selectedShip = ship || null;
            if (ship) {
                followState.lastKnownX = ship.x;
                followState.lastKnownY = ship.y;
                const teamId = getShipTeamId(ship);
                if (teamId) followState.preferredTeamId = teamId;
            }
            followState.pendingAutoFocusAt = 0;
            followState.forceCenterOnNextFrame = forceCenter;
        }

        function isShipFollowable(ship) {
            if (!ship || !ship.isAlive()) return false;
            if (!ship.engines || ship.engines.length === 0) return false;
            return getAllShips().includes(ship);
        }

        function isWorldFullyVisible() {
            const worldPixelSize = WORLD_SIZE * renderState.zoom;
            return worldPixelSize <= renderState.viewportWidth && worldPixelSize <= renderState.viewportHeight;
        }

        function isShipFollowModeActive() {
            if (typeof selectedBeaconTeam === 'undefined') return false;
            return selectedBeaconTeam === null && !isWorldFullyVisible();
        }

        function getFocusPoint() {
            const followModeActive = isShipFollowModeActive();
            if (!followModeActive) {
                followState.pendingAutoFocusAt = 0;
                return null;
            }

            // 追尾モード開始時に選択がない場合は、生存船先頭へ自動フォーカスする
            if (!followState.selectedShip) {
                const nextShip = getPreferredAliveShip(followState.preferredTeamId);
                if (nextShip) {
                    selectFollowShip(nextShip, true);
                    return { x: nextShip.x, y: nextShip.y };
                }
            }

            if (isShipFollowable(followState.selectedShip)) {
                followState.pendingAutoFocusAt = 0;
                followState.lastKnownX = followState.selectedShip.x;
                followState.lastKnownY = followState.selectedShip.y;
                const selectedTeamId = getShipTeamId(followState.selectedShip);
                if (selectedTeamId) followState.preferredTeamId = selectedTeamId;
                return { x: followState.selectedShip.x, y: followState.selectedShip.y };
            }

            if (followState.selectedShip) {
                followState.lastKnownX = followState.selectedShip.x;
                followState.lastKnownY = followState.selectedShip.y;
            }

            const now = performance.now();
            if (followState.pendingAutoFocusAt === 0) {
                followState.pendingAutoFocusAt = now + AUTO_FOCUS_DELAY_MS;
                return { x: followState.lastKnownX, y: followState.lastKnownY };
            }

            if (now < followState.pendingAutoFocusAt) {
                return { x: followState.lastKnownX, y: followState.lastKnownY };
            }

            const nextShip = getPreferredAliveShip(followState.preferredTeamId);
            if (nextShip) {
                selectFollowShip(nextShip, true);
                return { x: nextShip.x, y: nextShip.y };
            }
            followState.pendingAutoFocusAt = 0;
            followState.selectedShip = null;
            return { x: followState.lastKnownX, y: followState.lastKnownY };
        }

        function computeCenteredOffset(viewportSize, worldPixelSize, targetWorldPos) {
            const desiredOffset = Math.floor(viewportSize / 2 - targetWorldPos * renderState.worldScale);
            const minOffset = Math.floor(viewportSize - worldPixelSize);
            if (minOffset <= 0) {
                return clamp(desiredOffset, minOffset, 0);
            }
            return Math.floor((viewportSize - worldPixelSize) / 2);
        }

        function formatZoomLabel(zoom) {
            return `${Math.round(zoom * 100)}%`;
        }

        function updateZoomControls() {
            const maxFittableZoom = Math.min(renderState.viewportWidth, renderState.viewportHeight) / WORLD_SIZE;
            const alwaysMinZoom = 0.4;
            const alwaysMaxZoom = 2;
            const selectableMaxZoom = Math.max(maxFittableZoom, alwaysMaxZoom);
            const levels = ZOOM_STEPS.filter(
                (zoom) =>
                    (zoom >= alwaysMinZoom && zoom <= alwaysMaxZoom) ||
                    (zoom > alwaysMaxZoom && zoom <= selectableMaxZoom + 0.000001)
            );
            if (levels.length === 0) levels.push(MIN_ZOOM);
            if (levels.length === 1) {
                const nextLevel = ZOOM_STEPS.find((zoom) => zoom > levels[0]);
                if (nextLevel !== undefined) levels.push(nextLevel);
            }
            renderState.zoomLevels = levels;

            const currentIndex = levels.indexOf(renderState.zoom);
            if (currentIndex === -1) {
                renderState.zoom = levels[levels.length - 1];
            }
            const nextIndex = levels.indexOf(renderState.zoom);
            zoomOutButton.disabled = nextIndex <= 0;
            zoomInButton.disabled = nextIndex >= levels.length - 1;
            zoomValueLabel.textContent = formatZoomLabel(renderState.zoom);
        }

        function getInitialFitZoom() {
            const maxFittableZoom = Math.min(renderState.viewportWidth, renderState.viewportHeight) / WORLD_SIZE;
            const fitLevels = ZOOM_STEPS.filter((zoom) => zoom <= maxFittableZoom + 0.000001);
            if (fitLevels.length > 0) return fitLevels[fitLevels.length - 1];
            // 画面が極端に小さい場合は最小ズームで開始
            return ZOOM_STEPS[0];
        }

        function recomputeRenderState() {
            const worldPixelSize = WORLD_SIZE * renderState.zoom;
            renderState.worldScale = renderState.zoom;
            const focusPoint = getFocusPoint();
            if (!focusPoint) {
                renderState.offsetX = Math.floor((renderState.viewportWidth - worldPixelSize) / 2);
                renderState.offsetY = Math.floor((renderState.viewportHeight - worldPixelSize) / 2);
                return;
            }

            const focusX = clamp(focusPoint.x, 0, WORLD_SIZE);
            const focusY = clamp(focusPoint.y, 0, WORLD_SIZE);
            if (followState.forceCenterOnNextFrame) {
                renderState.offsetX = computeCenteredOffset(renderState.viewportWidth, worldPixelSize, focusX);
                renderState.offsetY = computeCenteredOffset(renderState.viewportHeight, worldPixelSize, focusY);
                followState.forceCenterOnNextFrame = false;
                return;
            }
            // 追尾モード中は選択船を常時センタリング（全体が収まる場合はcomputeCenteredOffset内で固定表示）
            renderState.offsetX = computeCenteredOffset(renderState.viewportWidth, worldPixelSize, focusX);
            renderState.offsetY = computeCenteredOffset(renderState.viewportHeight, worldPixelSize, focusY);
        }

        function resetFollowSelectionState() {
            followState.selectedShip = null;
            followState.preferredTeamId = null;
            followState.lastKnownX = WORLD_SIZE / 2;
            followState.lastKnownY = WORLD_SIZE / 2;
            followState.pendingAutoFocusAt = 0;
            followState.forceCenterOnNextFrame = false;
            recomputeRenderState();
            requestAnimationFrame(layoutUi);
        }

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function layoutUi() {
            const margin = 8;
            const worldPixelSize = WORLD_SIZE * renderState.worldScale;
            const worldLeft = renderState.offsetX;
            const worldTop = renderState.offsetY;
            const worldRight = worldLeft + worldPixelSize;
            const worldBottom = worldTop + worldPixelSize;
            const leftGutter = worldLeft - margin;
            const rightGutter = renderState.viewportWidth - worldRight - margin;
            const topGutter = worldTop - margin;
            const bottomGutter = renderState.viewportHeight - worldBottom - margin;

            function placeTopLeft(element) {
                const width = element.offsetWidth;
                const height = element.offsetHeight;
                let left;
                let top;
                if (leftGutter >= width) {
                    left = worldLeft - width - margin;
                    top = worldTop;
                } else if (topGutter >= height) {
                    left = worldLeft;
                    top = worldTop - height - margin;
                } else {
                    left = margin;
                    top = margin;
                }
                element.style.left = `${Math.round(clamp(left, margin, renderState.viewportWidth - width - margin))}px`;
                element.style.top = `${Math.round(clamp(top, margin, renderState.viewportHeight - height - margin))}px`;
            }

            function placeTopRight(element) {
                const width = element.offsetWidth;
                const height = element.offsetHeight;
                let left;
                let top;
                if (rightGutter >= width) {
                    left = worldRight + margin;
                    top = worldTop;
                } else if (topGutter >= height) {
                    left = worldRight - width;
                    top = worldTop - height - margin;
                } else {
                    left = renderState.viewportWidth - width - margin;
                    top = margin;
                }
                element.style.left = `${Math.round(clamp(left, margin, renderState.viewportWidth - width - margin))}px`;
                element.style.top = `${Math.round(clamp(top, margin, renderState.viewportHeight - height - margin))}px`;
            }

            function placeBottomRight(element) {
                const width = element.offsetWidth;
                const height = element.offsetHeight;
                let left;
                let top;
                if (rightGutter >= width) {
                    left = worldRight + margin;
                    top = worldBottom - height;
                } else if (bottomGutter >= height) {
                    left = worldRight - width;
                    top = worldBottom + margin;
                } else {
                    left = renderState.viewportWidth - width - margin;
                    top = renderState.viewportHeight - height - margin;
                }
                element.style.left = `${Math.round(clamp(left, margin, renderState.viewportWidth - width - margin))}px`;
                element.style.top = `${Math.round(clamp(top, margin, renderState.viewportHeight - height - margin))}px`;
            }

            function placeBottomLeft(element) {
                const width = element.offsetWidth;
                const height = element.offsetHeight;
                let left;
                let top;
                if (leftGutter >= width) {
                    left = worldLeft - width - margin;
                    top = worldBottom - height;
                } else if (bottomGutter >= height) {
                    left = worldLeft;
                    top = worldBottom + margin;
                } else {
                    left = margin;
                    top = renderState.viewportHeight - height - margin;
                }
                element.style.left = `${Math.round(clamp(left, margin, renderState.viewportWidth - width - margin))}px`;
                element.style.top = `${Math.round(clamp(top, margin, renderState.viewportHeight - height - margin))}px`;
            }

            infoDiv.style.bottom = 'auto';
            infoDiv.style.right = 'auto';
            githubLink.style.bottom = 'auto';
            githubLink.style.right = 'auto';
            placeTopLeft(testButtons);
            placeTopRight(bottomControls);
            placeBottomRight(zoomControls);
            placeBottomLeft(infoDiv);

            const githubGap = 6;
            const githubLeft = infoDiv.offsetLeft;
            const githubTop = clamp(
                infoDiv.offsetTop - githubLink.offsetHeight - githubGap,
                margin,
                renderState.viewportHeight - githubLink.offsetHeight - margin
            );
            githubLink.style.left = `${Math.round(githubLeft)}px`;
            githubLink.style.top = `${Math.round(githubTop)}px`;
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
            if (!hasInitializedZoom) {
                renderState.zoom = getInitialFitZoom();
                hasInitializedZoom = true;
                updateZoomControls();
            } else if (!hasUserAdjustedZoom) {
                // 初回の手動操作前は、リサイズ時も画面に収まる倍率へ追従
                renderState.zoom = getInitialFitZoom();
                updateZoomControls();
            }
            recomputeRenderState();
            requestAnimationFrame(layoutUi);
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
            const previousBeaconTeam = selectedBeaconTeam;
            if (selectedBeaconTeam === teamId) {
                selectedBeaconTeam = null;
            } else {
                selectedBeaconTeam = teamId;
            }
            beaconTeamButtons.forEach((button) => {
                if (button.dataset.team === teamId) button.classList.add('active');
                else button.classList.remove('active');
            });
            if (selectedBeaconTeam === null) {
                beaconTeamButtons.forEach((button) => button.classList.remove('active'));
                // Beaconモード解除時は、記憶している追尾対象に1回だけ再センタリングする
                if (previousBeaconTeam !== null && followState.selectedShip) {
                    followState.forceCenterOnNextFrame = true;
                    followState.pendingAutoFocusAt = 0;
                }
            }
            recomputeRenderState();
            layoutUi();
        }
        beaconTeamButtons.forEach((button) => {
            button.addEventListener('click', () => {
                updateBeaconTeamSelection(button.dataset.team);
            });
        });

        function pickShipAt(worldX, worldY) {
            const allShips = getAllShips();
            let selected = null;
            let closestDistance = Infinity;
            for (const ship of allShips) {
                if (!ship || !ship.isAlive()) continue;
                const dx = ship.x - worldX;
                const dy = ship.y - worldY;
                const distance = Math.hypot(dx, dy);
                const pickRadius = ship.getCollisionRadius() + SHIP_PICK_TOLERANCE;
                if (distance <= pickRadius && distance < closestDistance) {
                    selected = ship;
                    closestDistance = distance;
                }
            }
            return selected;
        }

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

            if (typeof selectedBeaconTeam !== 'undefined' && selectedBeaconTeam) {
                // ビーコン配置モード
                detectionBeacons.push(new DetectionBeacon(worldPoint.x, worldPoint.y, selectedBeaconTeam));
                return;
            }

            // 追従モード（A/B/C すべてOFF）ではクリック/タップで船を選択
            const selectedShip = pickShipAt(worldPoint.x, worldPoint.y);
            if (!selectedShip) return;
            selectFollowShip(selectedShip, true);
            recomputeRenderState();
            layoutUi();
        }

        // キャンバスクリック/タップでビーコン配置
        canvas.addEventListener('click', (e) => {
            placeBeaconFromEvent(e);
        });
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            placeBeaconFromEvent(e);
        }, { passive: false });

        function shiftZoom(direction) {
            const index = renderState.zoomLevels.indexOf(renderState.zoom);
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= renderState.zoomLevels.length) return;
            const nextZoom = renderState.zoomLevels[targetIndex];
            if (!nextZoom) return;
            hasInitializedZoom = true;
            hasUserAdjustedZoom = true;
            renderState.zoom = nextZoom;
            updateZoomControls();
            recomputeRenderState();
            layoutUi();
        }

        zoomOutButton.addEventListener('click', () => {
            shiftZoom(-1);
        });
        zoomInButton.addEventListener('click', () => {
            shiftZoom(1);
        });
        zoomOutButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            shiftZoom(-1);
        }, { passive: false });
        zoomInButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            shiftZoom(1);
        }, { passive: false });

        document.addEventListener('contextmenu', (e) => e.preventDefault());
