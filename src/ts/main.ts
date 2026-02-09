// @ts-nocheck
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const infoDiv = document.getElementById('info');

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
        }
        resizeCanvas();


        // ========================================
        // イベントハンドラ
        // ========================================

        function handleMove(e) {
            const rect = canvas.getBoundingClientRect();
            if (e.touches) {
                mouseX = e.touches[0].clientX - rect.left;
                mouseY = e.touches[0].clientY - rect.top;
            } else {
                mouseX = e.clientX - rect.left;
                mouseY = e.clientY - rect.top;
            }
        }

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', (e) => {
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

        // ビーコンボタンのイベントハンドラ
        const beaconButton = document.getElementById('beacon-button');
        const teamCycle = ['A', 'B', 'C'];
        beaconButton.addEventListener('click', () => {
            const currentIndex = teamCycle.indexOf(selectedBeaconTeam);
            selectedBeaconTeam = teamCycle[(currentIndex + 1) % teamCycle.length];
            beaconButton.textContent = `ビーコン: チーム${selectedBeaconTeam}`;
            beaconButton.classList.add('active');
        });

        // キャンバスクリックでビーコン配置
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // ビーコンを配置
            detectionBeacons.push(new DetectionBeacon(x, y, selectedBeaconTeam));
        });

        document.addEventListener('contextmenu', (e) => e.preventDefault());