<template>
  <div>
    <h2>Files from Google Drive</h2>

    <!-- Date Filter -->
    <label>Start Date:</label>
    <input type="date" v-model="startDate" />
    <label>End Date:</label>
    <input type="date" v-model="endDate" />

    <!-- Page Size -->
    <label>Page Size:</label>
    <input type="number" v-model="pageSize" min="1" />

    <button @click="fetchFiles(false)">Filter</button>

    <ul>
      <li v-for="file in files" :key="file.id">
        <div>
          <strong>{{ file.name }}</strong> (ID: {{ file.id }})
        </div>
        <div>Owner(s): {{ displayOwner(file.owners) }}</div>
        <div>Last Modified: {{ formatModifiedTime(file.modifiedTime) }}</div>
        <div>Size: {{ displaySize(file.size) }}</div>
        <div>
          <input v-model="file.newName" placeholder="New name" />
          <button @click="renameFile(file.id, file.newName)">Rename</button>
          <button @click="deleteFile(file.id)">Delete</button>
        </div>
      </li>
    </ul>

    <button v-if="nextPageToken" @click="fetchFiles(true)">Load More</button>
  </div>
</template>

<script>
export default {
  name: "FileList",
  data() {
    return {
      files: [],
      startDate: "",
      endDate: "",
      pageSize: 5, // Changed default page size from 10 to 5
      nextPageToken: null
    };
  },
  created() {
    // Fetch first page on component creation
    this.fetchFiles(false);
  },
  methods: {
    /**
     * Fetch files from the backend
     * @param {boolean} append - If true, append to existing files; otherwise, replace
     */
    async fetchFiles(append) {
      try {
        let url = "http://localhost:3000/files";
        const params = new URLSearchParams();

        // Date filters
        if (this.startDate) params.append("startDate", this.startDate);
        if (this.endDate) params.append("endDate", this.endDate);

        // Page size
        if (this.pageSize) params.append("pageSize", this.pageSize);

        // If we have a nextPageToken and want to load more
        if (append && this.nextPageToken) {
          params.append("pageToken", this.nextPageToken);
        } else {
          // If not appending, reset nextPageToken
          this.nextPageToken = null;
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        // data should contain { nextPageToken, files: [...] }
        const newFiles = data.files || [];
        if (append) {
          this.files = [...this.files, ...newFiles];
        } else {
          this.files = newFiles;
        }

        this.nextPageToken = data.nextPageToken || null;

        // Initialize newName for renaming
        this.files.forEach(file => {
          if (file.newName === undefined) {
            file.newName = "";
          }
        });
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    },

    async renameFile(fileId, newName) {
      if (!newName) {
        return alert("Please enter a new name!");
      }
      try {
        const response = await fetch(`http://localhost:3000/files/${fileId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName })
        });
        if (response.ok) {
          alert("File renamed successfully!");
          this.fetchFiles(false);
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
          this.fetchFiles(false);
        } else {
          alert("Failed to delete file.");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    },

    displayOwner(owners) {
      if (!owners || !Array.isArray(owners) || owners.length === 0) {
        return "N/A";
      }
      return owners.map(o => o.displayName).join(", ");
    },

    displaySize(size) {
      if (!size) return "N/A";
      return `${size} bytes`;
    },

    formatModifiedTime(isoString) {
      if (!isoString) return "N/A";
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
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
  margin-bottom: 10px;
}
</style>
