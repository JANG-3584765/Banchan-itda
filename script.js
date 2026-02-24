// script.js
window.onload = function() {
    // kakao 객체가 있는지 먼저 확인
    if (typeof kakao === 'undefined') {
        console.error("카카오 지도 라이브러리가 로드되지 않았습니다. 키값과 도메인 설정을 확인하세요.");
        return;
    }

    // autoload=false일 때 사용해야 하는 함수
    kakao.maps.load(function() {
        const container = document.getElementById('map'); 
        const options = {
            center: new kakao.maps.LatLng(37.5936, 127.0903), 
            level: 3 
        };

        // 지도 생성
        const map = new kakao.maps.Map(container, options);

        // 확인용 마커
        const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(37.5936, 127.0903)
        });
        marker.setMap(map);
        
        console.log("지도 로드 성공!");
    });
};