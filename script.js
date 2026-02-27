window.onload = function() {
    // 1. 카카오 SDK 초기화 (로그인 기능을 위해 필수)
    // 지도 API 키와 동일한 JavaScript 키를 사용합니다.
    if (!Kakao.isInitialized()) {
        Kakao.init('1018b180a2f2cd1e1b559ae3d503375f');
    }

    // --- 카카오 로그인 함수 ---
    function loginWithKakao() {
        Kakao.Auth.login({
            success: function(authObj) {
                console.log("로그인 성공!", authObj);
                // 로그인 성공 시 사용자 정보 가져오기
                Kakao.API.request({
                    url: '/v2/user/me',
                    success: function(res) {
                        const nickname = res.kakao_account.profile.nickname;
                        alert(nickname + "님, 반찬잇다에 오신 것을 환영합니다!");
                        // 로그인 버튼 텍스트를 사용자 이름으로 변경하거나 UI 업데이트 가능
                        document.querySelector('.nav-menu a').innerText = nickname + "님";
                    },
                    fail: function(error) {
                        console.error("사용자 정보 요청 실패", error);
                    }
                });
            },
            fail: function(err) {
                console.error("로그인 실패", err);
            },
        });
    }

    // 헤더의 '로그인' 버튼에 이벤트 연결
    const loginBtn = document.querySelector('.nav-menu a:first-child');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 링크 기본 동작 방지
            loginWithKakao();
        });
    }

    // --- 기존 지도 및 데이터 로직 시작 ---
    if (typeof kakao === 'undefined') {
        console.error("카카오 지도 라이브러리가 로드되지 않았습니다.");
        return;
    }

    kakao.maps.load(function() {
        const stores = [
            {
                id: 1,
                name: "엄마손 반찬가게",
                rating: 4.5,
                reviews: 120,
                address: "중랑구 상봉동",
                tags: ["#저염식", "#당일제조"],
                desc: "조미료를 쓰지 않는 깔끔한 맛!",
                lat: 37.5936,
                lng: 127.0903,
                distance: "350m",
                status: "open"
            },
            {
                id: 2,
                name: "사임당 반찬",
                rating: 4.8,
                reviews: 85,
                address: "중랑구 중화동",
                tags: ["#나물맛집", "#집밥감성"],
                desc: "오늘의 나물 라인업이 다양해요.",
                lat: 37.5985,
                lng: 127.0763,
                distance: "800m",
                status: "new"
            },
            {
                id: 3,
                name: "맛있는 반찬가게",
                rating: 4.2,
                reviews: 50,
                address: "중랑구 면목동",
                tags: ["#자취생소분", "#매콤맛집"],
                desc: "1인 가구를 위한 소분 반찬 전문!",
                lat: 37.5897,
                lng: 127.0915,
                distance: "1.2km",
                status: "open"
            }
        ];

        const container = document.getElementById('map'); 
        const options = {
            center: new kakao.maps.LatLng(37.5936, 127.0903), 
            level: 4 
        };
        const map = new kakao.maps.Map(container, options);

        const shopListContainer = document.querySelector('.shop-list');
        shopListContainer.innerHTML = '';

        stores.forEach(store => {
            const shopCard = document.createElement('article');
            shopCard.className = 'shop-card';
            
            const badgeClass = store.status === 'open' ? 'status-open' : 'status-new';
            const badgeText = store.status === 'open' ? '영업중' : 'NEW';

            shopCard.innerHTML = `
                <div class="shop-card__img-box">
                    <div class="badge ${badgeClass}">${badgeText}</div>
                    <div class="shop-card__image"></div>
                </div>
                <div class="shop-card__info">
                    <div class="shop-card__title">
                        <h3>${store.name}</h3>
                        <span class="distance">${store.distance}</span>
                    </div>
                    <div class="shop-card__rating">
                        <span class="star">⭐</span>
                        <span class="score">${store.rating}</span>
                        <span class="review">(${store.reviews})</span>
                    </div>
                    <p class="shop-card__tags">${store.tags.join(' ')}</p>
                    <p class="shop-card__desc">"${store.desc}"</p>
                </div>
            `;
            
            shopListContainer.appendChild(shopCard);

            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(store.lat, store.lng),
                map: map,
                title: store.name
            });

            shopCard.addEventListener('click', () => {
                const moveLatLon = new kakao.maps.LatLng(store.lat, store.lng);
                map.panTo(moveLatLon);
            });
        });
        
        console.log(`${stores.length}개의 가게 데이터를 로드했습니다.`);
    });
};