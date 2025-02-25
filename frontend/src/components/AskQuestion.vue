<template>
  <div class="ask-question-container">
    <h2 class="section-title">Ask a Question</h2>
    <!-- Wrapping in a form with @submit.prevent so that pressing Enter submits -->
    <form class="question-form" @submit.prevent="submitQuestion">
      <input
        v-model="question"
        placeholder="Type your question here"
        class="question-input"
      />
      <button class="btn submit-btn" type="submit">Submit</button>
    </form>
    <div v-if="answer" class="answer-section">
      <h3 class="answer-title">Answer:</h3>
      <p class="answer-text">{{ answer }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "AskQuestion",
  data() {
    return {
      question: "",
      answer: "",
    };
  },
  methods: {
    async submitQuestion() {
      try {
        const response = await axios.post("http://localhost:3000/ask", {
          question: this.question,
        });
        this.answer = response.data.answer;
      } catch (error) {
        console.error("Error processing question:", error);
        this.answer = "There was an error processing your question.";
      }
    },
  },
};
</script>

<style scoped>
.ask-question-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  text-align: left;
}
.section-title {
  font-size: 1.8em;
  margin-bottom: 15px;
  color: #14171a;
  text-align: center;
}
.question-form {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.question-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccd6dd;
  border-radius: 20px;
  font-size: 1em;
}
.btn {
  padding: 10px 20px;
  background-color: #1da1f2;
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}
.btn:hover {
  background-color: #0d95e8;
}
.answer-section {
  background: #f5f8fa;
  padding: 15px;
  border-radius: 8px;
}
.answer-title {
  font-size: 1.4em;
  margin-bottom: 10px;
  color: #14171a;
}
.answer-text {
  font-size: 1em;
  color: #657786;
  line-height: 1.5;
}
</style>
