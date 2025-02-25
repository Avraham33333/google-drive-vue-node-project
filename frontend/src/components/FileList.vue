<template>
  <div class="file-list-outer">
    <div class="header">
      <h2 class="section-title">Files from Google Drive</h2>
      <div v-if="selectedFiles.length > 0" class="bulk-actions">
        <button class="btn bulk-delete-btn" @click="deleteSelected">
          Delete Selected ({{ selectedFiles.length }})
        </button>
      </div>
    </div>

    <div class="filter-controls">
      <div class="filter-group">
        <label for="startDate">Start Date:</label>
        <input id="startDate" type="date" v-model="startDate" />
      </div>
      <div class="filter-group">
        <label for="endDate">End Date:</label>
        <input id="endDate" type="date" v-model="endDate" />
      </div>
      <button class="btn filter-btn" @click="resetFiles">Filter</button>
    </div>

    <!-- We no longer set height or overflow here. The parent .files-section scrolls. -->
    <div class="file-list-container">
      <draggable
        v-model="files"
        item-key="id"
        @end="onDragEnd"
        class="cards-grid"
        :options="{
          animation: 500,
          ghostClass: 'drag-ghost',
          chosenClass: 'drag-chosen',
          swapThreshold: 0.65,
          fallbackOnBody: true,
          forceFallback: true
        }"
      >
        <template #item="{ element }">
          <div class="file-card">
            <!-- Icon based on extension -->
            <div class="file-icon">
              <i :class="getFileIcon(element.name)"></i>
            </div>

            <!-- File name -->
            <h3 class="file-name wrap-text">{{ getFileBaseName(element.name) }}</h3>

            <!-- File details -->
            <div class="file-info">
              <p class="field-group">
                <span class="field-title id">ID</span>
                <span class="field-value multiline">{{ element.id }}</span>
              </p>
              <p class="field-group">
                <span class="field-title file-type">File Type</span>
                <span class="field-value multiline">{{ getExtension(element.name) }}</span>
              </p>
              <p class="field-group">
                <span class="field-title owners">Owner(s)</span>
                <span class="field-value multiline">{{ displayOwner(element.owners) }}</span>
              </p>
              <p class="field-group">
                <span class="field-title modified">Last Modified</span>
                <span class="field-value multiline">{{ formatModifiedTime(element.modifiedTime) }}</span>
              </p>
              <p class="field-group">
                <span class="field-title size">Size</span>
                <span class="field-value multiline">{{ displaySize(element.size) }}</span>
              </p>
            </div>

            <!-- Rename / Delete (silent, no popups) -->
            <div class="file-actions" :class="{ editing: editingId === element.id }">
              <div v-if="editingId === element.id" class="rename-container">
                <input
                  v-model="renameText"
                  class="rename-input"
                  placeholder="New name"
                  @keyup.enter="confirmRename(element)"
                />
                <button class="btn enter-btn" @click="confirmRename(element)">
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
              <div v-else>
                <button class="btn action-btn" @click="startRename(element)">Rename</button>
                <button class="btn action-btn delete-btn" @click="deleteFile(element.id)">Delete</button>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- IntersectionObserver sentinel for infinite scroll -->
      <div ref="sentinel" class="sentinel"></div>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";

export default {
  name: "FileList",
  components: { draggable },
  data() {
    return {
      files: [],
      startDate: "",
      endDate: "",
      pageSize: 20,
      nextPageToken: null,
      editingId: null,
      renameText: "",
      observer: null,
      selectedFiles: [],
      orderKey: "fileOrder",
    };
  },
  created() {
    this.fetchFiles(false);
  },
  mounted() {
    this.setupObserver();
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    // Extract extension
    getExtension(fileName) {
      if (!fileName) return "unknown";
      const dotIndex = fileName.lastIndexOf(".");
      if (dotIndex > 0 && dotIndex < fileName.length - 1) {
        return fileName.substring(dotIndex + 1).toLowerCase();
      }
      return "unknown";
    },
    // Base name without extension
    getFileBaseName(fileName) {
      if (!fileName) return "Untitled";
      const dotIndex = fileName.lastIndexOf(".");
      if (dotIndex > 0) {
        return fileName.substring(0, dotIndex);
      }
      return fileName;
    },
    // Icon class
    getFileIcon(fileName) {
      const ext = this.getExtension(fileName);
      switch (ext) {
        case "pdf":
          return "fas fa-file-pdf icon-pdf";
        case "doc":
        case "docx":
          return "fas fa-file-word icon-doc";
        case "xls":
        case "xlsx":
        case "csv":
          return "fas fa-file-excel icon-xls";
        case "ppt":
        case "pptx":
          return "fas fa-file-powerpoint icon-ppt";
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
          return "fas fa-file-image icon-img";
        case "txt":
        case "log":
        case "md":
          return "fas fa-file-alt icon-text";
        case "exe":
        case "msi":
        case "bin":
          return "fas fa-file-code icon-exe";
        default:
          return "fas fa-file icon-default";
      }
    },
    // Owner display
    displayOwner(owners) {
      if (!owners || !Array.isArray(owners) || owners.length === 0) {
        return "N/A";
      }
      return owners.map(o => o.displayName).join(", ");
    },
    // Human-readable file size
    displaySize(rawSize) {
      if (!rawSize) return "Unknown";
      const num = Number(rawSize);
      if (isNaN(num) || num <= 0) return "Unknown";
      const units = ["B", "KB", "MB", "GB", "TB"];
      let i = 0;
      let bytes = num;
      while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
      }
      return `${bytes.toFixed(1)} ${units[i]}`;
    },
    // Format date/time
    formatModifiedTime(isoString) {
      if (!isoString) return "N/A";
      const date = new Date(isoString);
      return date.toLocaleString();
    },
    // Fetch files from backend
    async fetchFiles(append) {
      let url = "http://localhost:3000/files";
      const params = new URLSearchParams();
      if (this.startDate) params.append("startDate", this.startDate);
      if (this.endDate) params.append("endDate", this.endDate);
      params.append("pageSize", this.pageSize);
      if (append && this.nextPageToken) {
        params.append("pageToken", this.nextPageToken);
      }
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      let newFiles = append ? [...this.files, ...data.files] : data.files;
      newFiles = this.applySavedOrder(newFiles);
      this.files = newFiles;
      this.nextPageToken = data.nextPageToken || null;
    },
    // Reset filter
    resetFiles() {
      this.files = [];
      this.nextPageToken = null;
      this.fetchFiles(false);
    },
    // IntersectionObserver for infinite scroll
    setupObserver() {
      this.observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && this.nextPageToken) {
            this.fetchFiles(true);
          }
        },
        {
          root: null, // or this.$el, but typically null works with the parent container
          rootMargin: "100px",
          threshold: 0,
        }
      );
      if (this.$refs.sentinel) {
        this.observer.observe(this.$refs.sentinel);
      }
    },
    // Draggable reorder
    onDragEnd() {
      localStorage.setItem(this.orderKey, JSON.stringify(this.files.map(f => f.id)));
    },
    // Start rename
    startRename(file) {
      this.editingId = file.id;
      this.renameText = this.getFileBaseName(file.name);
    },
    // Confirm rename (silent, no popup)
    async confirmRename(file) {
      if (!this.renameText) {
        console.warn("No rename text provided. Rename aborted.");
        return;
      }
      const oldExt = this.getExtension(file.name);
      const newFileName = oldExt === "unknown"
        ? this.renameText
        : `${this.renameText}.${oldExt}`;

      try {
        const response = await fetch(`http://localhost:3000/files/${file.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newFileName }),
        });
        if (response.ok) {
          file.name = newFileName;
          this.editingId = null;
          this.renameText = "";
        } else {
          console.error("Failed to rename file. Status:", response.status);
        }
      } catch (error) {
        console.error("Error renaming file:", error);
      }
    },
    // Checkbox toggle
    onSelect(file) {
      if (file.selected) {
        if (!this.selectedFiles.includes(file.id)) {
          this.selectedFiles.push(file.id);
        }
      } else {
        this.selectedFiles = this.selectedFiles.filter(id => id !== file.id);
      }
    },
    // Bulk delete (silent)
    async deleteSelected() {
      try {
        for (const fileId of this.selectedFiles) {
          const response = await fetch(`http://localhost:3000/files/${fileId}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            console.error(`Failed to delete file ${fileId}. Status:`, response.status);
          }
        }
        this.files = this.files.filter(file => !this.selectedFiles.includes(file.id));
        this.selectedFiles = [];
        localStorage.setItem(this.orderKey, JSON.stringify(this.files.map(f => f.id)));
      } catch (error) {
        console.error("Error deleting selected files:", error);
      }
    },
    // Single file delete (silent)
    async deleteFile(fileId) {
      try {
        const response = await fetch(`http://localhost:3000/files/${fileId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          console.error(`Failed to delete file ${fileId}. Status:`, response.status);
          return;
        }
        this.files = this.files.filter(file => file.id !== fileId);
        localStorage.setItem(this.orderKey, JSON.stringify(this.files.map(f => f.id)));
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    },
    // Apply saved order from localStorage
    applySavedOrder(files) {
      const savedOrder = JSON.parse(localStorage.getItem(this.orderKey) || "[]");
      if (!savedOrder.length) return files;
      const orderMap = {};
      savedOrder.forEach((id, index) => {
        orderMap[id] = index;
      });
      const inOrder = [];
      const notInOrder = [];
      files.forEach(file => {
        if (Object.prototype.hasOwnProperty.call(orderMap, file.id)) {
          inOrder.push(file);
        } else {
          notInOrder.push(file);
        }
      });
      inOrder.sort((a, b) => orderMap[a.id] - orderMap[b.id]);
      return [...inOrder, ...notInOrder];
    },
  },
};
</script>

<style scoped>
.file-list-outer {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 1.8em;
  color: #14171a;
}

.bulk-actions .bulk-delete-btn {
  background-color: #e0245e;
}

.bulk-actions .bulk-delete-btn:hover {
  background-color: #c21c50;
}

.filter-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 0.9em;
  color: #657786;
  margin-bottom: 3px;
}

.filter-controls input {
  padding: 5px 10px;
  border: 1px solid #ccd6dd;
  border-radius: 4px;
}

.filter-btn {
  padding: 6px 16px;
}

/* We remove any fixed height or overflow here! */
.file-list-container {
  /* Let .files-section handle scrolling. */
  height: auto;
  overflow: visible;
}

/* Cards grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: min-content;
  gap: 20px;
  padding-bottom: 50px;
}

.file-card {
  background: #fdfdfd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 15px;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.file-card:hover {
  transform: translateY(-5px);
}

.file-icon {
  font-size: 36px;
  text-align: center;
  margin-bottom: 5px;
}

.file-name {
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 8px;
  color: #14171a;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.field-title.id {
  color: #1da1f2;
}
.field-title.file-type {
  color: #ff9900;
}
.field-title.owners {
  color: #2ecc71;
}
.field-title.modified {
  color: #9b59b6;
}
.field-title.size {
  color: #e74c3c;
}

.field-value {
  font-family: "Courier New", monospace;
  color: #333;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.multiline {
  white-space: pre-wrap;
}

.file-actions {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  margin-top: auto;
}
.file-card:hover .file-actions,
.file-actions.editing {
  opacity: 1;
  pointer-events: auto;
}

.rename-container {
  display: flex;
  align-items: center;
  gap: 5px;
}
.rename-input {
  flex: 1;
  border: 1px solid #ccd6dd;
  border-radius: 4px;
  padding: 5px 10px;
}

/* Draggable placeholders */
.drag-ghost {
  opacity: 0.4;
  transform: scale(0.95);
}
.drag-chosen {
  opacity: 0;
  pointer-events: none;
}

/* Buttons */
.btn {
  background-color: #1da1f2;
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
  padding: 8px 16px;
}
.btn:hover {
  background-color: #0d95e8;
}
.delete-btn {
  background-color: #e0245e;
  margin-left: 5px;
}
.delete-btn:hover {
  background-color: #c21c50;
}
.enter-btn {
  background-color: #1da1f2;
  border-radius: 50%;
  padding: 5px 8px;
}

/* Icon brand color classes */
.icon-pdf { color: #FF0000; }
.icon-doc { color: #2B579A; }
.icon-xls { color: #217346; }
.icon-ppt { color: #D24726; }
.icon-img { color: #E67E22; }
.icon-text { color: #666; }
.icon-exe { color: #7D3C98; }
.icon-default { color: #888; }

.sentinel {
  height: 50px;
}
</style>
