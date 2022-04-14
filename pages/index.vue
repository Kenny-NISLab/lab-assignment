<template>
  <v-row class="app__height" justify="center" align-content="center">
    <v-card class="login__card" outlined>
      <CardTitle :title="title" :subtitle="subtitle" />

      <div class="px-6 py-3">
        <div class="mx-auto login__wrap">
          <div class="pt-3">
            <div>
              <v-text-field
                ref="email"
                v-model="email"
                aria-label="email"
                :rules="[emailRules.required, emailRules.checked]"
                autofocus
                dense
                height="48px"
                color="accent"
                class="py-2"
                placeholder="メールアドレス"
              ></v-text-field>

              <v-text-field
                ref="password"
                v-model="password"
                aria-label="password"
                :append-icon="passwordShow ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[passwordRules.required]"
                :type="passwordShow ? 'text' : 'password'"
                dense
                height="48px"
                color="accent"
                placeholder="パスワード"
                class="py-2"
                @click:append="passwordShow = !passwordShow"
              ></v-text-field>
            </div>
            <div class="pb-8 pt-4">
              <v-btn color="accent" depressed height="48" :loading="loading" :disabled="loading" @click="signIn">
                <v-icon left> mdi-login </v-icon>
                ログイン
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-row>
</template>

<script>
import { CardTitle } from '~/components/card/index'

export default {
  name: 'Index',
  components: {
    CardTitle,
  },
  data() {
    return {
      validate: false,
      title: '研究室配属希望調査',
      subtitle: 'ご自身のメールアドレスと配布されたパスワードを入力してください',
      email: '',
      emailRules: {
        required: (value) => !!value || 'メールアドレスは必須です',
        checked: (value) => this.$checkEmail(value) || '適切なメールアドレスを入力してください',
      },
      password: '',
      passwordShow: false,
      passwordRules: {
        required: (value) => !!value || 'パスワードは必須です',
      },
      loading: false,
    }
  },
  computed: {
    form() {
      return {
        email: this.email,
        password: this.password,
      }
    },
  },
  methods: {
    signIn() {
      this.validate = false
      Object.keys(this.form).forEach((f) => {
        this.$refs[f].validate(true)
        if (!this.$refs[f].valid) {
          this.validate = true
        }
      })
      if (!this.validate) {
        this.loading = true
        this.$store.dispatch('auth/signIn', {
          email: this.email,
          password: this.password,
        })
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.login {
  &__card {
    width: 90%;
    @include display_tab {
      width: 500px;
    }
  }
  &__wrap {
    width: 90%;
  }
}
</style>
