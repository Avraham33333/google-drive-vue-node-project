<template>
  <div>
    <h2>Ask a Question</h2>
    <input v-model="question" placeholder="Type your question here" />
    <button @click="submitQuestion">Submit</button>
    <div v-if="answer">
      <h3>Answer:</h3>
      <p>{{ answer }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AskQuestion',
  data() {
    return {
      question: '',
      answer: '',
    };
  },
  methods: {
    async submitQuestion() {
      try {
        const response = await axios.post('http://localhost:3000/ask', { question: this.question });
        this.answer = response.data.answer;
      } catch (error) {
        console.error('Error processing question:', error);
        this.answer = 'There was an error processing your question.';
      }
    },
  },
};
</script>

<style scoped>
input {
  width: 300px;
  margin-right: 10px;
}
</style>
