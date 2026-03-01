window.onload = function() {
    // 1. 카카오 SDK 초기화
    if (!Kakao.isInitialized()) {
        Kakao.init('1018b180a2f2cd1e1b559ae3d503375f');
    }

    // 전역 상태 관리
    let wishList = [];
    let isLoggedIn = false;

    // --- [기능 1] 카카오 로그인 관련 ---
    function loginWithKakao() {
        Kakao.Auth.login({
            success: function(authObj) {
                console.log("로그인 성공", authObj);
                fetchUserInfo();
            },
            fail: function(err) {
                console.error("로그인 실패", err);
            },
        });
    }

    function fetchUserInfo() {
        Kakao.API.request({
            url: '/v2/user/me',
            success: function(res) {
                isLoggedIn = true;
                const nickname = res.kakao_account.profile.nickname;
                
                // UI 업데이트: 로그인 버튼을 사용자 이름으로 변경
                const loginBtn = document.getElementById('kakao-login-btn');
                if (loginBtn) {
                    loginBtn.innerText = nickname + "님";
                    loginBtn.style.color = "#27ae60"; // 포인트 컬러
                }
                alert(nickname + "님, 반찬잇다에 오신 것을 환영합니다!");
            },
            fail: function(error) {
                console.error("사용자 정보 요청 실패", error);
            }
        });
    }

    // 로그인 버튼 이벤트 연결
    const loginBtn = document.getElementById('kakao-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn) {
                loginWithKakao();
            }
        });
    }

    // --- [기능 2] 지도 및 데이터 렌더링 시작 ---
    if (typeof kakao === 'undefined') {
        console.error("카카오 지도 라이브러리가 로드되지 않았습니다.");
        return;
    }

    kakao.maps.load(function() {
        const stores = [
            { id: 1, name: "엄마손 반찬가게", rating: 4.5, reviews: 120, address: "중랑구 상봉동", tags: ["#저염식", "#당일제조"], desc: "조미료를 쓰지 않는 깔끔한 맛!", lat: 37.5936, lng: 127.0903, distance: "350m", status: "open" },
            { id: 2, name: "사임당 반찬", rating: 4.8, reviews: 85, address: "중랑구 중화동", tags: ["#나물맛집", "#집밥감성"], desc: "오늘의 나물 라인업이 다양해요.", lat: 37.5985, lng: 127.0763, distance: "800m", status: "new" },
            { id: 3, name: "맛있는 반찬가게", rating: 4.2, reviews: 50, address: "중랑구 면목동", tags: ["#자취생소분", "#매콤맛집"], desc: "1인 가구를 위한 소분 반찬 전문!", lat: 37.5897, lng: 127.0915, distance: "1.2km", status: "open" }
        ];

        // 지도 설정
        const container = document.getElementById('map'); 
        const options = {
            center: new kakao.maps.LatLng(37.5936, 127.0903), 
            level: 4 
        };
        const map = new kakao.maps.Map(container, options);

        // 상단 가게 수 업데이트
        document.getElementById('store-num').innerText = stores.length;

        const shopListContainer = document.getElementById('shop-list-container');
        shopListContainer.innerHTML = ''; // 로딩 메시지 제거

        stores.forEach(store => {
            const shopCard = document.createElement('article');
            shopCard.className = 'shop-card';
            
            const badgeClass = store.status === 'open' ? 'status-open' : 'status-new';
            const badgeText = store.status === 'open' ? '영업중' : 'NEW';

            shopCard.innerHTML = `
                <div class="shop-card__img-box">
                    <div class="badge ${badgeClass}">${badgeText}</div>
                    <button class="btn-wish" data-id="${store.id}">🤍</button>
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

            // 지도 마커 표시
            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(store.lat, store.lng),
                map: map,
                title: store.name
            });

            // 카드 클릭 시 지도로 이동
            shopCard.addEventListener('click', (e) => {
                // 하트 클릭 시에는 지도가 이동하지 않도록 방지
                if(e.target.classList.contains('btn-wish')) return;
                
                const moveLatLon = new kakao.maps.LatLng(store.lat, store.lng);
                map.panTo(moveLatLon);
            });

            // --- [기능 3] 찜하기 클릭 이벤트 ---
            const wishBtn = shopCard.querySelector('.btn-wish');
            wishBtn.addEventListener('click', () => {
                if (!isLoggedIn) {
                    alert("로그인 후 찜하기 기능을 이용할 수 있습니다.");
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
                
                // 헤더 찜 개수 업데이트
                document.querySelector('.wish-count').innerText = wishList.length;
            });
        });
        
        console.log("반찬잇다 데이터 로드 완료");
    });
};