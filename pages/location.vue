<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h1>LOCATION</h1>
    </div>

    <div class="location-content">
      <div class="map-box">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d99948.64767906873!2d27.864786519126223!3d41.12534539203999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14b4e1321f9a66c9%3A0xa025da8649180b79!2s%C3%87orlu%20%C4%B0mkb%20Fen%20Lisesi!5e0!3m2!1str!2str!4v1765735257297!5m2!1str!2str"
          width="100%" 
          height="450" 
          style="border:0;" 
          loading="lazy" 
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>

      <div class="info-blocks">
        <div class="info-card address-card">
          <h3>Address</h3>
          <p>Corlu Borsa Istanbul Science High School<br>35/1 Bülent Ecevit Boulevard, Zafer Neighborhood, Next to the
            New State Hospital, Çorlu, Tekirdağ, Türkiye</p>
        </div>
        
        <div class="info-card transportation-card">
          <h3>Transportation</h3>

          <div class="transport-section">
            <h4>Süleymanpaşa</h4>
            <ul class="bus-list">
              <li><p>To the **Old Bus Terminal**: Bus numbers 1/3, 10, 11/B, 11, 12, 13, and 2/7.</p></li>
              <li><p>To the **Çorlu Bus Terminal**: Bus numbers 34 and 201.</p></li>
              <li><p>To the **Schools Area** (Okullar Bölgesi): Bus numbers 11, 12, 14, 4, 5, 7, 8, and 9.</p></li>
            </ul>
          </div>

          <div class="transport-section">
            <h4>Çerkezköy</h4>
            <ul class="bus-list">
              <li><p>To the **Çerkezköy Bus Terminal**: Bus numbers 1, 4, and 6.</p></li>
              <li><p>To the **Çorlu Bus Terminal**: Bus numbers 34 and 202A.</p></li>
              <li><p>To the **Schools Area**: Bus numbers 11, 12, 14, 4, 5, 7, 8, and 9.</p></li>
            </ul>
          </div>

          <div class="transport-section">
            <h4>Çorlu</h4>
            <ul class="bus-list">
              <li><p>To the **Schools Area**: Bus numbers 4, 5, 7, 8, 9, 10, 11, 12, and 14.</p></li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Mevcut Stiller */
.page-wrapper {
  padding-top: 100px;
  padding-bottom: 50px;
  background-color: #050505;
  color: #fff;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

/* <h1> Başlığını ortalamak için CSS ekledim */
.page-header h1 {
  font-size: 2.5rem; /* index.vue'daki h2 büyüklüğüne yakın */
  letter-spacing: 2px;
  /* Başlığı ortalamak için margin-top ve margin-bottom ihtiyacına bakılır.
     Varsayılan olarak ortalanmıştır, sadece text-align: center yeterlidir. */
}

.location-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.map-box {
  border-radius: 12px;
  overflow: hidden;
  filter: grayscale(80%) invert(92%) contrast(83%);
  margin-bottom: 40px;
  border: 1px solid #333;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

/* YENİ: info-grid sınıfını kaldırdık, kartları alt alta dizecek bir yapı oluşturduk */
.info-blocks {
    display: flex;
    flex-direction: column; /* Kartlar alt alta */
    gap: 30px; /* Kartlar arası boşluk */
}

.info-card {
  background: #111;
  padding: 30px;
  border-left: 4px solid #19213a; 
  border-radius: 8px;
}

.info-card h3 {
  color: #fff;
  margin-top: 0;
  font-size: 1.8rem;
  margin-bottom: 20px;
}

.info-card p {
  color: #ccc;
  line-height: 1.8;
}

/* Ulaşım Alt Başlık Stilleri (Önceki düzenlemeden kalan) */
.transport-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #222;
}

.transport-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.transport-section h4 {
  color: #538ED6;
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.bus-list {
  list-style-type: none;
  padding-left: 0;
}

.bus-list li {
  margin-bottom: 8px;
  position: relative;
  padding-left: 15px;
}

.bus-list li p {
  font-size: 1rem;
  line-height: 1.5;
  color: #bbb;
}

.bus-list li::before {
  content: '•'; 
  color: #538ED6;
  font-weight: bold; 
  display: inline-block; 
  width: 1em; 
  margin-left: -1em;
}


/* Mobil Uyumluluk: Artık gerekmiyor çünkü varsayılan olarak alt alta dizili */
/* @media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
} */
</style>