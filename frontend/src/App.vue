<template>
  <div id="app">
    <!-- Top Navigation Bar (sticky) -->
    <header class="top-nav">
      <div class="nav-right">
        <!-- If you have a userPhoto from /userinfo, display it -->
        <div class="user-avatar">
          <img
            v-if="userPhoto"
            :src="userPhoto"
            alt="User Photo"
          />
          <img
            v-else
            src="https://via.placeholder.com/36x36"
            alt="User Placeholder"
          />
          <span class="user-email">{{ userEmail }}</span>
        </div>
      </div>
    </header>

    <!-- Main Container (no scroll here) -->
    <main class="app-content">
      <!-- AskQuestion section: no scroll -->
      <section class="ask-section">
        <AskQuestion />
      </section>

      <!-- Files section: the ONLY scrollable container -->
      <section class="files-section">
        <FileList />
      </section>
    </main>
  </div>
</template>

<script>
import AskQuestion from "./components/AskQuestion.vue";
import FileList from "./components/FileList.vue";

export default {
  name: "App",
  components: {
    AskQuestion,
    FileList,
  },
  data() {
    return {
      userEmail: "",
      userPhoto: "",
    };
  },
  async mounted() {
    // Example: fetch user info (email, picture) from your backend's /userinfo endpoint
    try {
      const response = await fetch("http://localhost:3000/userinfo");
      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }
      const data = await response.json();
      // data.email, data.picture come from Google's userinfo
      this.userEmail = data.email || "";
      this.userPhoto = data.picture || "";
    } catch (err) {
      console.error("Error fetching user info:", err);
      this.userEmail = "";
      this.userPhoto = "";
    }
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap");

/* Remove default body scroll */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden; /* no scroll on the outer body */
  background-color: #f0f2f5;
  font-family: "Roboto", sans-serif;
  color: #14171a;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Top Navigation Bar (sticky at top) */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 999;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 20px;
  flex-shrink: 0; /* don't shrink in flex layout */
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar img {
  border-radius: 50%;
  width: 36px;
  height: 36px;
}

.user-email {
  font-weight: 500;
  color: #333;
}

/* Main Content: no scroll on the container */
.app-content {
  height: calc(100vh - 60px); /* Subtract nav's height (approx 60px) */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* no scroll here */
}

/* Ask section (no scrolling) */
.ask-section {
  flex-shrink: 0;
  padding: 20px;
  background: #fff; /* or #f0f2f5, your choice */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Files section: the ONLY scrollable area */
.files-section {
  flex: 1;
  overflow-y: auto; /* vertical scroll only here */
  padding: 20px;
  background: #f0f2f5; /* or #fafafa, your choice */
}
</style>
