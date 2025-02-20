<template>
  <div>
    <h2>Files</h2>
    <button @click="fetchFiles">Fetch Files</button>
    <ul v-if="files.length">
      <li v-for="file in files" :key="file.id">
        <strong>{{ file.name }}</strong><br />
        Owner: {{ file.owners && file.owners.length ? file.owners[0].emailAddress : 'N/A' }}<br />
        Modified: {{ file.modifiedTime }}
      </li>
    </ul>
    <div v-if="nextPageToken">
      <button @click="fetchFiles(nextPageToken)">Load More</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'FileList',
  data() {
    return {
      files: [],
      nextPageToken: null,
    };
  },
  methods: {
    async fetchFiles(pageToken) {
      try {
        const params = { pageSize: 10 };
        if (pageToken) {
          params.pageToken = pageToken;
        }
        const response = await axios.get('http://localhost:3000/files', { params });
        if (response.data.files) {
          // Append new files to the list
          this.files = [...this.files, ...response.data.files];
        }
        this.nextPageToken = response.data.nextPageToken || null;
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    },
  },
  created() {
    this.fetchFiles();
  },
};
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
}
</style>
