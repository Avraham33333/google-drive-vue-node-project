<template>
  <div>
    <h2>Files from Google Drive</h2>

    <!-- Date Filter -->
    <label>Start Date:</label>
    <input type="date" v-model="startDate">
    <label>End Date:</label>
    <input type="date" v-model="endDate">
    <button @click="fetchFiles">Filter</button>

    <ul>
      <li v-for="file in files" :key="file.id">
        <strong>{{ file.name }}</strong> (ID: {{ file.id }})
        
        <!-- Rename file -->
        <input v-model="file.newName" placeholder="New name">
        <button @click="renameFile(file.id, file.newName)">Rename</button>

        <!-- Delete file -->
        <button @click="deleteFile(file.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "FileList",
  data() {
    return {
      files: [],
      startDate: "",
      endDate: ""
    };
  },
  created() {
    this.fetchFiles();
  },
  methods: {
    async fetchFiles() {
      try {
        let url = 'http://localhost:3000/files';
        const params = new URLSearchParams();
        
        if (this.startDate) params.append("startDate", this.startDate);
        if (this.endDate) params.append("endDate", this.endDate);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        this.files = data.files.map(file => ({ ...file, newName: "" })); // Add a newName field
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    },

    async renameFile(fileId, newName) {
      if (!newName) return alert("Please enter a new name!");

      try {
        const response = await fetch(`http://localhost:3000/files/${fileId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName })
        });

        if (response.ok) {
          alert("File renamed successfully!");
          this.fetchFiles(); // Refresh list
        } else {
          alert("Failed to rename file.");
        }
      } catch (error) {
        console.error("Error renaming file:", error);
      }
    },

    async deleteFile(fileId) {
      if (!confirm("Are you sure you want to delete this file?")) return;

      try {
        const response = await fetch(`http://localhost:3000/files/${fileId}`, {
          method: "DELETE"
        });

        if (response.ok) {
          alert("File deleted successfully!");
          this.fetchFiles(); // Refresh list
        } else {
          alert("Failed to delete file.");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  }
};
</script>

<style scoped>
input {
  margin-left: 5px;
}
button {
  margin-left: 5px;
}
</style>
