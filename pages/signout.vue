<template>
  <v-form>
    <v-container>
      <h1 class="heading--main">ログアウト</h1>
      <v-btn @click="singout"> ログアウト </v-btn>
    </v-container>
  </v-form>
</template>

<script>
import firebase from '@/pages/firebase.js'
export default {
  methods: {
    singout() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          alert('ログアウトしました。')
          this.$router.push('/')
        })
        .catch((error) => {
          alert(error)
        })
    },
  },
}
</script>
