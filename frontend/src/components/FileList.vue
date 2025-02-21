<template>
  <div>
    <h2>Files from Google Drive</h2>
    <ul>
      <li v-for="file in files" :key="file.id">
        {{ file.name }} (ID: {{ file.id }})
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'FileList',
  data() {
    return {
      files: [],
    };
  },
  created() {
    this.fetchFiles();
  },
  methods: {
    async fetchFiles() {
      try {
        // This is your Node/Express route to list Google Drive files
        const response = await fetch('http://localhost:3000/files');
        const data = await response.json();
        // Adjust if your backend returns a different structure
        this.files = data.files || [];
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
  }
};
</script>
