<template>
  <div>
    <h2>Files from Google Drive</h2>

    <!-- Date Filter -->
    <label>Start Date:</label>
    <input type="date" v-model="startDate" />
    <label>End Date:</label>
    <input type="date" v-model="endDate" />
    <button @click="fetchFiles">Filter</button>

    <ul>
      <li v-for="file in files" :key="file.id">
        <div>
          <strong>{{ file.name }}</strong> (ID: {{ file.id }})
        </div>
        <div>Owner(s): {{ displayOwner(file) }}</div>
        <div>Last Modified: {{ formatModifiedTime(file.modifiedTime) }}</div>
        <div>Size: {{ displaySize(file.size) }}</div>
        <div>
          <input v-model="file.newName" placeholder="New name" />
          <button @click="renameFile(file.id, file.newName)">Rename</button>
          <button @click="deleteFile(file.id)">Delete</button>
        </div>
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
        let url = "http://localhost:3000/files";
        const params = new URLSearchParams();
        
        if (this.startDate) params.append("startDate", this.startDate);
        if (this.endDate) params.append("endDate", this.endDate);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        // Map files to add a newName property for renaming
        this.files = data.files.map(file => ({ ...file, newName: "" }));
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
    },

    displayOwner(file) {
      if (file.owners && Array.isArray(file.owners) && file.owners.length > 0) {
        return file.owners.map(o => o.displayName).join(", ");
      }
      return "N/A";
    },

    displaySize(size) {
      if (!size) return "N/A";
      return `${size} bytes`;
    },

    // Helper method to format the modifiedTime into dd/mm/yyyy ; HH:mm
    formatModifiedTime(isoString) {
      if (!isoString) return "N/A";
      const date = new Date(isoString);

      // Extract the parts
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      // Return dd/mm/yyyy ; HH:mm
      return `${day}/${month}/${year} ; ${hours}:${minutes}`;
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
