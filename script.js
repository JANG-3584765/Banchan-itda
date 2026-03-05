window.onload = function() {
    // 1. 카카오 SDK 초기화 체크 (로그인용)
    if (typeof Kakao !== 'undefined') {
        if (!Kakao.isInitialized()) {
            Kakao.init('1018b180a2f2cd1e1b559ae3d503375f');
        }
    }

    // 전역 상태 관리
    let wishList = [];
    let isLoggedIn = false;
    let markers = []; 
    let currentMap = null; 

    // --- [데이터] 가게 정보 ---
    const stores = [
        { id: 1, name: "엄마손 반찬가게", rating: 4.5, reviews: 120, tags: ["#저염식", "#당일제조"], desc: "조미료를 쓰지 않는 깔끔한 맛!", lat: 37.5936, lng: 127.0903, distance: "350m", status: "open" },
        { id: 2, name: "사임당 반찬", rating: 4.8, reviews: 85, tags: ["#나물맛집", "#집밥감성"], desc: "오늘의 나물 라인업이 다양해요.", lat: 37.5985, lng: 127.0763, distance: "800m", status: "new" },
        { id: 3, name: "맛있는 반찬가게", rating: 4.2, reviews: 50, tags: ["#자취생소분", "#매콤맛집"], desc: "1인 가구를 위한 소분 반찬 전문!", lat: 37.5897, lng: 127.0915, distance: "1.2km", status: "open" }
    ];

    // --- [공통 함수] 리스트 및 마커 렌더링 ---
    function renderStores(filterTag = 'all') {
        const shopListContainer = document.getElementById('shop-list-container');
        if (!shopListContainer) return;
        
        shopListContainer.innerHTML = ''; 
        markers.forEach(marker => marker.setMap(null));
        markers = [];

        const filteredStores = filterTag === 'all' 
            ? stores 
            : stores.filter(s => s.tags.some(tag => tag.includes(filterTag)));

        document.getElementById('store-num').innerText = filteredStores.length;

        filteredStores.forEach(store => {
            const shopCard = document.createElement('article');
            shopCard.className = 'shop-card';
            const badgeClass = store.status === 'open' ? 'status-open' : 'status-new';

            shopCard.innerHTML = `
                <div class="shop-card__img-box">
                    <div class="badge ${badgeClass}">${store.status === 'open' ? '영업중' : 'NEW'}</div>
                    <button class="btn-wish" data-id="${store.id}">${wishList.includes(store.id) ? '❤️' : '🤍'}</button>
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
            
            shopListContainer.appendChild(shopCard);

            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(store.lat, store.lng),
                map: currentMap,
                title: store.name
            });
            markers.push(marker);

            shopCard.addEventListener('click', (e) => {
                if(e.target.classList.contains('btn-wish')) return;
                currentMap.panTo(new kakao.maps.LatLng(store.lat, store.lng));
            });

            const wishBtn = shopCard.querySelector('.btn-wish');
            wishBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (!isLoggedIn) {
                    alert("로그인 후 이용 가능합니다.");
                    loginWithKakao();
                    return;
                }
                const storeId = store.id;
                if (wishList.includes(storeId)) {
                    wishList = wishList.filter(id => id !== storeId);
                    wishBtn.innerText = "🤍";
                    wishBtn.style.color = "black";
                } else {
                    wishList.push(storeId);
                    wishBtn.innerText = "❤️";
                    wishBtn.style.color = "red";
                }
                document.querySelector('.wish-count').innerText = wishList.length;
            });
        });
    }

    // --- [기능 1] 로그인 관련 ---
    function loginWithKakao() {
        Kakao.Auth.login({
            success: function() { fetchUserInfo(); },
            fail: function(err) { console.error(err); }
        });
    }

    function fetchUserInfo() {
        Kakao.API.request({
            url: '/v2/user/me',
            success: function(res) {
                isLoggedIn = true;
                document.getElementById('kakao-login-btn').innerText = res.kakao_account.profile.nickname + "님";
            }
        });
    }

    const loginBtn = document.getElementById('kakao-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn) loginWithKakao();
        });
    }

    // --- [기능 2] 지도 초기화 및 검색 ---
    if (typeof kakao === 'undefined') return;

    kakao.maps.load(function() {
        const container = document.getElementById('map'); 
        currentMap = new kakao.maps.Map(container, {
            center: new kakao.maps.LatLng(37.5936, 127.0903), 
            level: 4 
        });
        
        const geocoder = new kakao.maps.services.Geocoder();

        renderStores('all');

        window.openAddressSearch = function() {
            new daum.Postcode({
                oncomplete: function(data) {
                    geocoder.addressSearch(data.address, function(results, status) {
                        if (status === kakao.maps.services.Status.OK) {
                            const coords = new kakao.maps.LatLng(results[0].y, results[0].x);
                            currentMap.setCenter(coords);
                            new kakao.maps.Marker({ map: currentMap, position: coords });
                        }
                    });
                }
            }).open();
        };

        const searchInput = document.getElementById('shop-search');
        if (searchInput) searchInput.addEventListener('click', openAddressSearch);

        // --- [기능 5] 내 위치 찾기 추가 ---
        const locBtn = document.querySelector('.btn-current-loc');
        if (locBtn) {
            locBtn.addEventListener('click', () => {
                if (navigator.geolocation) {
                    // 로딩 표시 (선택사항)
                    locBtn.innerText = "찾는 중...";
                    
                    navigator.geolocation.getCurrentPosition((position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        const locPosition = new kakao.maps.LatLng(lat, lon);
                        
                        // 현재 위치로 지도 이동
                        currentMap.panTo(locPosition);
                        
                        // 현재 위치 마커 표시 (파란색 등 다른 커스텀 가능)
                        new kakao.maps.Marker({
                            map: currentMap,
                            position: locPosition,
                            title: "내 현재 위치"
                        });
                        
                        locBtn.innerText = "내 위치로";
                    }, (err) => {
                        alert("위치 정보를 가져올 수 없습니다.");
                        locBtn.innerText = "내 위치로";
                    });
                } else {
                    alert("이 브라우저에서는 GPS 기능을 사용할 수 없습니다.");
                }
            });
        }
    });

    // --- [기능 4] 필터 태그 클릭 ---
    const filterButtons = document.querySelectorAll('.filter-tag');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-filter');
            renderStores(filterValue);
        });
    });
};