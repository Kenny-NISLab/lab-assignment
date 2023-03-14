<template>
  <v-app-bar app dark color="primary" class="elevation-0">
    <v-app-bar-nav-icon class="appbar__icon" @click="toggle" />
    <v-toolbar-title class="toolbar__title">
      <NuxtLink to="/" class="toolbar__text">研究室配属希望調査</NuxtLink>
    </v-toolbar-title>

    <v-tabs v-if="isLoggined" class="appbar__tabs">
      <v-tab v-for="(menuItem, index) in loginMenu" :key="index" nuxt @click="redirectPage(menuItem.url)">
        {{ menuItem.name }}
      </v-tab>
    </v-tabs>

    <v-tabs v-else-if="isAdmin" class="appbar__tabs">
      <v-tab v-for="(menuItem, index) in adminMenu" :key="index" nuxt @click="redirectPage(menuItem.url)">
        {{ menuItem.name }}
      </v-tab>
    </v-tabs>

    <v-tabs v-else class="appbar__tabs">
      <v-tab v-for="(menuItem, index) in logoutMenu" :key="index" nuxt @click="redirectPage(menuItem.url)">
        {{ menuItem.name }}
      </v-tab>
    </v-tabs>

    <v-spacer />

    <div v-if="isLoggined || isAdmin" class="appbar__profile mr-3">
      <v-list-item-title>ようこそ、{{ userName }}さん</v-list-item-title>
      <v-list-item-subtitle class="grey--text">{{ userEmail }}</v-list-item-subtitle>
    </div>

    <LogOutDialog :open="signOutConfirm" @close="close" />
  </v-app-bar>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import LogOutDialog from './LogOutDialog'

export default {
  name: 'Header',
  components: {
    LogOutDialog,
  },
  data() {
    return {
      signOutConfirm: false,
    }
  },
  computed: {
    ...mapGetters({
      isLoggined: 'auth/isLoggined',
      isAdmin: 'auth/isAdmin',
      userName: 'auth/userName',
      userEmail: 'auth/userEmail',
    }),
    drawer() {
      return this.$store.state.drawer.isOpen
    },
    loginMenu() {
      return this.$store.state.menu.loginMenu
    },
    adminMenu() {
      return this.$store.state.menu.adminMenu
    },
    logoutMenu() {
      return this.$store.state.menu.logoutMenu
    },
  },
  methods: {
    ...mapMutations({
      toggle: 'drawer/toggle',
    }),
    redirectPage(path) {
      if (path === '/signout') {
        this.signOutConfirm = true
      } else {
        this.$router.push({ path })
      }
    },
    close(e) {
      this.signOutConfirm = e
    },
  },
}
</script>

<style lang="scss" scoped>
.toolbar {
  &__title {
    margin-right: 38px;
    overflow: visible;
  }

  &__text {
    color: inherit;
    text-decoration: none;
  }
}

.appbar {
  &__icon {
    @include display_tab {
      display: none;
    }
  }

  &__tabs {
    display: none;

    @include display_tab {
      display: flex;
    }
  }

  &__profile {
    display: none;

    @include display_tab {
      display: block;
    }
  }
}
</style>
