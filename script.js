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

    // --- [기능 1] 카카오 로그인 관련 ---
    function loginWithKakao() {
        Kakao.Auth.login({
            success: function(authObj) {
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
                const loginBtn = document.getElementById('kakao-login-btn');
                if (loginBtn) {
                    loginBtn.innerText = nickname + "님";
                    loginBtn.style.color = "#27ae60";
                }
                alert(nickname + "님, 찬차니에 오신 것을 환영합니다!");
            }
        });
    }

    // 로그인 버튼 이벤트
    const loginBtn = document.getElementById('kakao-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn) loginWithKakao();
        });
    }

    // --- [기능 2] 지도 및 주소 검색 로직 ---
    if (typeof kakao === 'undefined') {
        console.error("카카오 지도 라이브러리가 로드되지 않았습니다.");
        return;
    }

    kakao.maps.load(function() {
        const container = document.getElementById('map'); 
        const options = {
            center: new kakao.maps.LatLng(37.5936, 127.0903), 
            level: 4 
        };
        const map = new kakao.maps.Map(container, options);
        
        // 주소-좌표 변환 객체 생성 (숙지 코드 반영)
        const geocoder = new kakao.maps.services.Geocoder();

        // 2-1. 주소 검색 함수 (숙지 코드의 핵심 로직 통합)
        window.openAddressSearch = function() {
            new daum.Postcode({
                oncomplete: function(data) {
                    const addr = data.address; // 최종 주소 변수

                    // 주소로 상세 좌표를 찾음
                    geocoder.addressSearch(addr, function(results, status) {
                        if (status === kakao.maps.services.Status.OK) {
                            const result = results[0];
                            const coords = new kakao.maps.LatLng(result.y, result.x);
                            
                            // 지도 중심 이동 및 부드러운 효과
                            map.setCenter(coords);
                            
                            // 검색한 위치에 특별 마커 표시 (옵션)
                            new kakao.maps.Marker({
                                map: map,
                                position: coords
                            });

                            console.log("검색된 위치로 이동 완료:", addr);
                        }
                    });
                }
            }).open();
        };

        // 검색창 클릭 시 주소 팝업 띄우기 연결
        const searchInput = document.getElementById('shop-search');
        if (searchInput) {
            searchInput.addEventListener('click', openAddressSearch);
        }

        // --- [기능 3] 가게 데이터 및 렌더링 ---
        const stores = [
            { id: 1, name: "엄마손 반찬가게", rating: 4.5, reviews: 120, tags: ["#저염식", "#당일제조"], desc: "조미료를 쓰지 않는 깔끔한 맛!", lat: 37.5936, lng: 127.0903, distance: "350m", status: "open" },
            { id: 2, name: "사임당 반찬", rating: 4.8, reviews: 85, tags: ["#나물맛집", "#집밥감성"], desc: "오늘의 나물 라인업이 다양해요.", lat: 37.5985, lng: 127.0763, distance: "800m", status: "new" },
            { id: 3, name: "맛있는 반찬가게", rating: 4.2, reviews: 50, tags: ["#자취생소분", "#매콤맛집"], desc: "1인 가구를 위한 소분 반찬 전문!", lat: 37.5897, lng: 127.0915, distance: "1.2km", status: "open" }
        ];

        document.getElementById('store-num').innerText = stores.length;
        const shopListContainer = document.getElementById('shop-list-container');
        shopListContainer.innerHTML = ''; 

        stores.forEach(store => {
            const shopCard = document.createElement('article');
            shopCard.className = 'shop-card';
            const badgeClass = store.status === 'open' ? 'status-open' : 'status-new';

            shopCard.innerHTML = `
                <div class="shop-card__img-box">
                    <div class="badge ${badgeClass}">${store.status === 'open' ? '영업중' : 'NEW'}</div>
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

            // 마커 생성
            new kakao.maps.Marker({
                position: new kakao.maps.LatLng(store.lat, store.lng),
                map: map,
                title: store.name
            });

            // 카드 클릭 시 이동
            shopCard.addEventListener('click', (e) => {
                if(e.target.classList.contains('btn-wish')) return;
                map.panTo(new kakao.maps.LatLng(store.lat, store.lng));
            });

            // 찜하기 로직
            const wishBtn = shopCard.querySelector('.btn-wish');
            wishBtn.addEventListener('click', () => {
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
    });
};