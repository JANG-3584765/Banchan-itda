window.onload = function() {
    // --- [1] 초기 설정 및 상태 관리 ---
    const APP_CONFIG = {
        KAKAO_KEY: '1018b180a2f2cd1e1b559ae3d503375f',
        DEFAULT_COORDS: { lat: 37.5936, lng: 127.0903 }
    };

    let state = {
        wishList: new Set(), // 중복 방지를 위해 Set 사용
        isLoggedIn: false,
        currentMap: null,
        markers: [],
        stores: [
            { id: 1, name: "엄마손 반찬가게", rating: 4.5, reviews: 120, tags: ["#저염식", "#당일제조"], desc: "조미료를 쓰지 않는 깔끔한 맛!", lat: 37.5936, lng: 127.0903, distance: "350m", status: "open" },
            { id: 2, name: "사임당 반찬", rating: 4.8, reviews: 85, tags: ["#나물맛집", "#집밥감성"], desc: "오늘의 나물 라인업이 다양해요.", lat: 37.5985, lng: 127.0763, distance: "800m", status: "new" },
            { id: 3, name: "맛있는 반찬가게", rating: 4.2, reviews: 50, tags: ["#자취생소분", "#매콤맛집"], desc: "1인 가구를 위한 소분 반찬 전문!", lat: 37.5897, lng: 127.0915, distance: "1.2km", status: "open" }
        ]
    };

    // --- [2] 초기화 실행 ---
    initSDK();
    initMap();
    bindGlobalEvents();

    function initSDK() {
        if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
            Kakao.init(APP_CONFIG.KAKAO_KEY);
        }
    }

    function initMap() {
        if (typeof kakao === 'undefined') return;
        
        kakao.maps.load(() => {
            const container = document.getElementById('map');
            const options = {
                center: new kakao.maps.LatLng(APP_CONFIG.DEFAULT_COORDS.lat, APP_CONFIG.DEFAULT_COORDS.lng),
                level: 4
            };
            state.currentMap = new kakao.maps.Map(container, options);
            renderStores('all');
        });
    }

    // --- [3] 핵심 렌더링 함수 (업스케일링) ---
    function renderStores(filterTag = 'all') {
        const listContainer = document.getElementById('shop-list-container');
        if (!listContainer) return;

        // 마커 및 리스트 초기화
        state.markers.forEach(m => m.setMap(null));
        state.markers = [];
        listContainer.innerHTML = '';

        const filtered = filterTag === 'all' 
            ? state.stores 
            : state.stores.filter(s => s.tags.some(t => t.includes(filterTag)));

        document.getElementById('store-num').innerText = filtered.length;

        filtered.forEach(store => {
            // 카드 UI 생성
            const isWished = state.wishList.has(store.id);
            const card = document.createElement('article');
            card.className = 'shop-card';
            card.setAttribute('data-id', store.id);
            card.innerHTML = `
                <div class="shop-card__img-box">
                    <div class="badge ${store.status === 'open' ? 'status-open' : 'status-new'}">
                        ${store.status === 'open' ? '영업중' : 'NEW'}
                    </div>
                    <button class="btn-wish" style="color: ${isWished ? 'red' : 'black'}">
                        ${isWished ? '❤️' : '🤍'}
                    </button>
                    <div class="shop-card__image"></div>
                </div>
                <div class="shop-card__info">
                    <div class="shop-card__title">
                        <h3>${store.name}</h3>
                        <span class="distance">${store.distance}</span>
                    </div>
                    <div class="shop-card__rating">⭐ ${store.rating} (${store.reviews})</div>
                    <p class="shop-card__tags">${store.tags.join(' ')}</p>
                    <p class="shop-card__desc">"${store.desc}"</p>
                </div>
            `;
            
            // 마커 생성
            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(store.lat, store.lng),
                map: state.currentMap,
                title: store.name
            });

            state.markers.push(marker);
            listContainer.appendChild(card);
        });
    }

    // --- [4] 이벤트 바인딩 (간략화 및 통합) ---
    function bindGlobalEvents() {
        // 리스트 클릭 이벤트 (위임 방식: 개별 카드에 안 걸고 부모에 하나만!)
        document.getElementById('shop-list-container').addEventListener('click', (e) => {
            const card = e.target.closest('.shop-card');
            if (!card) return;

            const id = parseInt(card.getAttribute('data-id'));
            const store = state.stores.find(s => s.id === id);

            if (e.target.classList.contains('btn-wish')) {
                toggleWish(store, e.target);
            } else {
                state.currentMap.panTo(new kakao.maps.LatLng(store.lat, store.lng));
            }
        });

        // 필터 버튼
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-tag.active').classList.remove('active');
                btn.classList.add('active');
                renderStores(btn.getAttribute('data-filter'));
            });
        });

        // 주소 검색
        document.getElementById('shop-search')?.addEventListener('click', openAddressSearch);

        // 내 위치 찾기
        document.querySelector('.btn-current-loc')?.addEventListener('click', handleGeoLocation);

        // 로그인
        document.getElementById('kakao-login-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (!state.isLoggedIn) loginWithKakao();
        });
    }

    // --- [5] 기능별 유틸리티 함수 ---
    function toggleWish(store, btnElement) {
        if (!state.isLoggedIn) {
            alert("로그인 후 이용 가능합니다.");
            return loginWithKakao();
        }

        if (state.wishList.has(store.id)) {
            state.wishList.delete(store.id);
            btnElement.innerText = "🤍";
            btnElement.style.color = "black";
        } else {
            state.wishList.add(store.id);
            btnElement.innerText = "❤️";
            btnElement.style.color = "red";
        }
        document.querySelector('.wish-count').innerText = state.wishList.size;
    }

    function handleGeoLocation() {
        const locBtn = document.querySelector('.btn-current-loc');
        if (!navigator.geolocation) return alert("GPS를 지원하지 않는 브라우저입니다.");

        locBtn.innerText = "찾는 중...";
        navigator.geolocation.getCurrentPosition((pos) => {
            const moveLatLon = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            state.currentMap.panTo(moveLatLon);
            new kakao.maps.Marker({ map: state.currentMap, position: moveLatLon });
            locBtn.innerText = "내 위치로";
        }, () => {
            alert("위치 정보를 가져올 수 없습니다.");
            locBtn.innerText = "내 위치로";
        });
    }

    function openAddressSearch() {
        new daum.Postcode({
            oncomplete: (data) => {
                const geocoder = new kakao.maps.services.Geocoder();
                geocoder.addressSearch(data.address, (result, status) => {
                    if (status === kakao.maps.services.Status.OK) {
                        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                        state.currentMap.setCenter(coords);
                        new kakao.maps.Marker({ map: state.currentMap, position: coords });
                    }
                });
            }
        }).open();
    }

    function loginWithKakao() {
        Kakao.Auth.login({
            success: () => {
                Kakao.API.request({
                    url: '/v2/user/me',
                    success: (res) => {
                        state.isLoggedIn = true;
                        document.getElementById('kakao-login-btn').innerText = `${res.kakao_account.profile.nickname}님`;
                    }
                });
            }
        });
    }
};