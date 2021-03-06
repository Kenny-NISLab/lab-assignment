import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'

export const state = () => ({
  loggedIn: false,
  admin: false,
  userId: '',
  userName: '',
  userEmail: '',
})

export const mutations = {
  setLoginState(state, { uid, name, email }) {
    state.loggedIn = true
    state.userId = uid
    state.userName = name
    state.userEmail = email
  },
  setAdminState(state, { uid, name, email }) {
    state.admin = true
    state.userId = uid
    state.userName = name
    state.userEmail = email
  },
  setLogoutState(state) {
    state.loggedIn = false
    state.admin = false
    state.userId = ''
    state.userName = ''
    state.userEmail = ''
  },
}

export const actions = {
  signIn({ commit, dispatch }, { email, password }) {
    const auth = getAuth()
    signInWithEmailAndPassword(auth, email, password)
      .then((credential) => {
        // ログインしたユーザのロールを取得
        credential.user.getIdTokenResult().then(async (idTokenResult) => {
          // adminなら管理者画面へ
          if (idTokenResult.claims.admin) {
            commit('setAdminState', {
              uid: credential.user.uid,
              name: credential.user.displayName,
              email: credential.user.email,
            })
            this.$router.push(process.env.ADMIN_ROOT_URL)
          } else {
            commit('setLoginState', {
              uid: credential.user.uid,
              name: credential.user.displayName,
              email: credential.user.email,
            })
            await dispatch(
              'users/getOne',
              {
                uid: credential.user.uid,
              },
              { root: true }
            )
            await dispatch('teachers/get', null, { root: true })
            this.$router.push('/user')
          }
        })
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err.message)
        alert('ログイン認証に失敗しました。\n入力したメールアドレスとパスワードが正しいかを確認してください。')
      })
  },

  signOut({ commit }) {
    const auth = getAuth()
    signOut(auth)
      .then(() => {
        commit('setLogoutState')
        this.$router.push('/')
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err.message)
      })
  },
}

export const getters = {
  // ユーザの情報を取得
  userId(state) {
    return state.userId
  },

  userEmail(state) {
    return state.userEmail
  },

  userName(state) {
    return state.userName
  },
  // ユーザがログインされているかの判定
  isLoggined(state) {
    return state.loggedIn
  },

  // 管理者権限かどうか
  isAdmin(state) {
    return state.admin
  },
}
