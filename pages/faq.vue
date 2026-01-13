<template>
  <div class="page-wrapper">
    <div class="page-header"><h1>FAQ</h1></div>
    
    <div class="faq-container">
      <div v-for="(item, index) in faqs" :key="index" class="faq-item" @click="toggle(index)">
        <div class="question">
          {{ item.q }}
          <span class="icon">{{ activeIndex === index ? '-' : '+' }}</span>
        </div>
        <div v-if="activeIndex === index" class="answer">
          {{ item.a }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeIndex = ref(null)
const toggle = (i) => {
  activeIndex.value = activeIndex.value === i ? null : i
}

const faqs = [
  { q: 'What is the conference fee?', a: 'Our delegation application fee is 1700₺. This covers participation in all conference sessions, delegate kits, and event materials.' },
  { q: 'What is the dress code?', a: 'The dress code is formal business attire. This means delegates are expected to wear suits, blazers, dress shirts, ties, or other professional clothing that reflects a diplomatic environment.' },
  { q: 'Is accommodation provided?', a: 'Unfortunately, we do not provide accommodation for delegates. However, we can recommend nearby hotels upon request.' },
  { q: 'Where will the conference take place?', a: 'The conference will be held at Çorlu Borsa İstanbul Science High School, located in Çorlu/Tekirdağ, Türkiye.' },
  { q: 'What are the conference dates?', a: 'The event will take place from March 1st to May 3rd, 2026.' },
  { q: 'How can I contact the organizing team?', a: 'You can reach us via email at contact@cflmun.org or through our official Instagram page (@cflmun).' },
  { q: 'Can individual delegates apply?', a: 'Yes! Independent delegates are welcome to apply, even if they are not part of a school delegation.' },
  { q: 'Will meals be provided during the conference?', a: 'Yes, lunch and light refreshments will be provided for all participants on each conference day.' },

]
</script>

<style scoped>
.page-wrapper { padding-top: 100px; min-height: 80vh; }
.page-header { text-align: center; margin-bottom: 40px; }
.faq-container { max-width: 800px; margin: 0 auto; padding: 20px; }

.faq-item { 
  background: #111; border-bottom: 1px solid #333; margin-bottom: 10px; 
  border-radius: 8px; overflow: hidden; cursor: pointer; transition: 0.3s;
}
.faq-item:hover { background: #161616; }

.question { 
  padding: 20px; font-weight: bold; display: flex; justify-content: space-between; color: white;
}
.answer { 
  padding: 0 20px 20px; color: #999; line-height: 1.6; border-top: 1px solid #222; margin-top: -5px; padding-top: 15px; 
}
.icon { color: #b91c1c; font-weight: bold; font-size: 1.2rem; }
</style>