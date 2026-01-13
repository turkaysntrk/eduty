<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h1>COMMITTEES</h1>
      <p>ACADEMIC BODIES OF CFLMUN'26</p>
    </div>

    <div class="committees-grid container">
      <div v-for="c in committees" :key="c.short" class="c-card">
        <div class="c-img">
          <span>{{ c.short }}</span>
        </div>
        <div class="c-info">
          <h3>{{ c.name }}</h3>
          <p class="agenda"><strong>Gündem:</strong> {{ c.agenda }}</p>
          <div class="c-footer">
            <span class="level-tag">{{ c.level }}</span>
            <button class="study-btn">Study Guide</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const committees = [
  { short: 'DISEC', name: 'Disarmament & Int. Security', agenda: 'The Arms Race and Space Security', level: 'Beginner' },
  { short: 'NATO', name: 'North Atlantic Treaty Org.', agenda: 'Threats in the Arctic Region', level: 'Intermediate' },
  { short: 'JCC', name: 'Joint Crisis Committee', agenda: 'The 1962 Cuban Missile Crisis', level: 'Advanced / Crisis' },
  // Buraya diğer komiteleri ekle
]
</script>

<style scoped>
.page-wrapper { padding-top: 100px; padding-bottom: 50px; }
.page-header { text-align: center; margin-bottom: 60px; }
.page-header h1 { font-size: 3rem; color: #fff; margin-bottom: 10px; }
.page-header p { color: #888; }

.committees-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
  gap: 30px; 
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 0 20px;
}

.c-card {
  background: #121212;
  border: 1px solid #333;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.c-card:hover {
  transform: translateY(-5px);
  border-color: #b91c1c;
  box-shadow: 0 10px 20px rgba(185, 28, 28, 0.15);
}

.c-img {
  height: 180px;
  background: #1a1a1a;
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; font-weight: 900; color: #333;
  border-bottom: 1px solid #222;
}

.c-info { padding: 25px; }
.c-info h3 { margin: 0 0 15px; font-size: 1.4rem; color: white; }
.agenda { color: #bbb; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.5; }

.c-footer { display: flex; justify-content: space-between; align-items: center; }
.level-tag { background: #b91c1c; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
.study-btn { background: transparent; border: 1px solid #555; color: #888; padding: 5px 15px; cursor: pointer; transition: 0.2s; }
.study-btn:hover { border-color: white; color: white; }
</style>