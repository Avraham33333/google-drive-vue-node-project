<template>
  <div id="app">
    <h1>Google Drive Files</h1>
    <FileList />
    <hr />
    <h1>Ask a Question</h1>
    <AskQuestion />
  </div>
</template>

<script>
import FileList from './components/FileList.vue';
import AskQuestion from './components/AskQuestion.vue';

export default {
  name: 'App',
  components: {
    FileList,
    AskQuestion,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
