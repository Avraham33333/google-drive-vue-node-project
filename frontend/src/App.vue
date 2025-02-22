<template>
  <div id="app">
    <!-- Main title -->
    <h1 class="main-title">Google Drive Files</h1>

    <!-- Ask Question component -->
    <AskQuestion />

    <!-- Directly include FileList without an extra heading -->
    <FileList />
  </div>
</template>

<script>
import FileList from './components/FileList.vue';
import AskQuestion from './components/AskQuestion.vue';

export default {
  name: 'App',
  components: {
    FileList,
    AskQuestion
  }
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

.main-title {
  font-size: 2em;
  margin-bottom: 0.5em;
}
</style>
