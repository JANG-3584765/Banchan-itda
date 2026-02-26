window.onload = function() {
    if (typeof kakao === 'undefined') {
        console.error("카카오 지도 라이브러리가 로드되지 않았습니다.");
        return;
    }

    kakao.maps.load(function() {
        // --- 1. 데이터 정의 (나중에 서버에서 받아올 실제 데이터 예시) ---
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

        // --- 2. 지도 초기화 ---
        const container = document.getElementById('map'); 
        const options = {
            center: new kakao.maps.LatLng(37.5936, 127.0903), 
            level: 4 
        };
        const map = new kakao.maps.Map(container, options);

        // --- 3. 리스트 동적 생성 및 마커 표시 ---
        const shopListContainer = document.querySelector('.shop-list');
        shopListContainer.innerHTML = ''; // 기존 HTML에 써둔 샘플 태그 비우기

        stores.forEach(store => {
            // (1) 사이드바 카드 HTML 생성
            const shopCard = document.createElement('article');
            shopCard.className = 'shop-card';
            
            // 영업 상태에 따른 배지 설정
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
            
            // 리스트에 추가
            shopListContainer.appendChild(shopCard);

            // (2) 지도에 마커 표시
            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(store.lat, store.lng),
                map: map,
                title: store.name
            });

            // (3) 카드 클릭 시 지도로 이동하는 이벤트 추가
            shopCard.addEventListener('click', () => {
                const moveLatLon = new kakao.maps.LatLng(store.lat, store.lng);
                map.panTo(moveLatLon); // 부드럽게 이동
            });
        });
        
        console.log(`${stores.length}개의 가게 데이터를 로드했습니다.`);
    });
};