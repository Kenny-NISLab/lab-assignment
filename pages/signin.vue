<template>
  <v-form>
    <v-container>
      <v-text-field v-model="email" label="MailAddress"></v-text-field>
      <v-text-field v-model="password" label="Password"></v-text-field>
      <v-btn color="primary" @click="userSingIn">ログイン</v-btn>
    </v-container>
  </v-form>
</template>
<script>
import firebase from '@/pages/firebase.js'
export default {
  data() {
    return {
      email: '',
      password: '',
    }
  },
  methods: {
    userSingIn() {
      firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password)
        .then(() => {
          alert('ログインしました。')
        })
        .catch(() => {
          alert('メールアドレスかパスワードが間違っています。')
        })
    },
  },
}
</script>
