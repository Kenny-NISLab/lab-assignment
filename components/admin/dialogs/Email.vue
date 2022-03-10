<template>
  <v-card>
    <v-card-title>{{ card.title }}</v-card-title>
    <v-card-subtitle>{{ card.subTitle }}</v-card-subtitle>

    <v-list>
      <v-list-item-group>
        <v-list-item @click="entireSendDialogOpen">
          <v-list-item-icon>
            <v-icon v-text="entireSend.icon" />
          </v-list-item-icon>
          <v-list-item-content v-text="entireSend.text" />
        </v-list-item>
        <v-list-item @click="manualSendDialogOpen">
          <v-list-item-icon>
            <v-icon v-text="manualSend.icon" />
          </v-list-item-icon>
          <v-list-item-content v-text="manualSend.text" />
        </v-list-item>
      </v-list-item-group>
    </v-list>

    <v-dialog v-model="isEntireSendDialogOpen" max-width="600px">
      <v-card>
        <v-card-title>{{ entireSend.text }}</v-card-title>
        <v-card-subtitle class="pt-1">{{ card.subTitle }}</v-card-subtitle>
        <v-container>
          <v-subheader>ログイン情報を配信する学生の年度を選択</v-subheader>
          <v-form ref="select" class="form__wrap">
            <v-select ref="year" v-model="year" label="年度" :items="years" color="accent" />
          </v-form>
        </v-container>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click.stop="close"> 閉じる </v-btn>
          <v-btn color="accent" text :disabled="entireConfirmDisabled" @click.stop="toEntireConfirm"> 確認画面へ </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDialog" max-width="600px">
      <v-card>
        <v-card-title>{{ entireSend.text }}</v-card-title>

        <v-card-text>
          <p>
            {{ year }}年度の学生にログイン情報を送信します。<br />
            実行する場合は、下記フォームに「{{ confirmLabel }}」と入力してください。
          </p>
          <p>ログインができるユーザに対して、メールが送信されます。</p>
        </v-card-text>

        <v-form class="form__wrap mx-10">
          <v-text-field v-model="value" label="確認しました" prepend-icon="mdi-alert" />
        </v-form>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeConfirm"> 閉じる </v-btn>
          <v-btn color="error" text :loading="loading" :disabled="disabled" @click="sendEmails"> 送信 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isManualSendDialogOpen" max-width="600px">
      <v-card>
        <v-card-title>{{ manualSend.text }}</v-card-title>
        <v-card-subtitle class="pt-1">{{ card.subTitle }}</v-card-subtitle>
        <v-container class="form__scroll">
          <v-subheader>送信したいユーザの学籍番号を入力してください</v-subheader>
          <v-form class="form__wrap">
            <div v-for="(form, index) in manualSend.studentId" :key="index">
              <v-text-field
                ref="id"
                v-model="manualSend.studentId[index]"
                append-outer-icon="mdi-close-circle"
                name="id"
                label="学籍番号"
                color="accent"
                prepend-icon="mdi-identifier"
                :rules="[studentIdRule.required]"
                @click:append-outer="deleteForm(index)"
              />
            </div>
          </v-form>
        </v-container>

        <v-card-actions>
          <v-btn text @click="addForm"> フォームを追加 </v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click.stop="close"> 閉じる </v-btn>
          <v-btn color="accent" text :disabled="manualConfirmDisabled" @click.stop="toManualConfirm"> 確認画面へ </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="manualConfirmDialog" max-width="600px">
      <v-card>
        <v-card-title>{{ manualSend.text }}</v-card-title>

        <v-card-text>
          <div v-for="(form, index) in manualSend.studentId" :key="index">
            {{ manualSend.studentId[index] }}
          </div>
          の学生にログイン情報を送信します。<br />
          実行する場合は、下記フォームに「{{ confirmLabel }}」と入力してください。
          <p>ログインができるユーザに対して、メールが送信されます。</p>
        </v-card-text>

        <v-form class="form__wrap mx-10">
          <v-text-field v-model="value" label="確認しました" prepend-icon="mdi-alert" />
        </v-form>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeConfirm"> 閉じる </v-btn>
          <v-btn color="error" text :loading="loading" :disabled="disabled" @click="sendManualEmails"> 送信 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'
import { httpsCallable } from 'firebase/functions'
import { functions } from '~/plugins/firebase'

export default {
  name: 'Email',
  props: {
    open: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  data() {
    return {
      card: {
        title: 'メール配信',
        subTitle: 'ユーザに対して、ログイン情報を載せたメールを配信します。',
      },
      isOpen: false,
      year: '',
      value: '',
      loading: false,
      confirmDialog: false,
      confirmLabel: '確認しました',
      isEntireSendDialogOpen: false,
      isManualSendDialogOpen: false,
      manualConfirmDialog: false,
      entireSend: {
        icon: 'mdi-email-multiple',
        text: '選択した年度の学生に送信',
      },
      manualSend: {
        icon: 'mdi-account-plus',
        text: '入力した学生に送信',
        studentId: [''],
      },
      studentIdRule: {
        required: (value) => value.length <= 20 || '正しい学生番号を入力してください',
      },
    }
  },
  computed: {
    ...mapGetters({
      years: 'users/years',
    }),
    entireConfirmDisabled() {
      if (this.year === '') {
        return true
      } else {
        return false
      }
    },
    manualConfirmDisabled() {
      if (this.manualSend.studentId.includes('')) {
        return true
      } else {
        return false
      }
    },
    disabled() {
      if (this.value !== this.confirmLabel) {
        return true
      } else {
        return false
      }
    },
  },
  mounted() {
    this.isOpen = this.open
  },
  methods: {
    globalEscape() {
      this.isOpen = false
      this.$emit('close', this.isOpen)
    },
    entireSendDialogOpen() {
      this.globalEscape()
      this.isEntireSendDialogOpen = true
    },
    manualSendDialogOpen() {
      this.globalEscape()
      this.isManualSendDialogOpen = true
    },
    close() {
      this.year = ''
      this.isEntireSendDialogOpen = false
      this.isManualSendDialogOpen = false
      this.resetForm()
    },
    toEntireConfirm() {
      this.isEntireSendDialogOpen = false
      this.confirmDialog = true
    },
    toManualConfirm() {
      this.isManualSendDialogOpen = false
      this.manualConfirmDialog = true
    },
    openConfirm() {
      this.confirmDialog = true
    },
    closeConfirm() {
      this.value = ''
      this.year = ''
      this.manualSend.studentId = ''
      this.confirmDialog = false
      this.manualConfirmDialog = false
      this.resetForm()
    },
    sendEmails() {
      this.loading = true
      const sendEmails = httpsCallable(functions, 'sendLoginDataBatch')
      sendEmails(this.year).then(() => {
        this.loading = false
        this.closeConfirm()
      })
    },
    sendManualEmails() {
      this.loading = true
      const sendEmails = httpsCallable(functions, 'sendPersonLoginDataBatch')
      const students = {
        ids: this.manualSend.studentId,
      }
      sendEmails(students).then(() => {
        this.loading = false
        this.closeConfirm()
        this.resetForm()
      })
    },
    resetForm() {
      this.manualSend.studentId = ['']
    },
    addForm() {
      this.manualSend.studentId.push('')
    },
    deleteForm(index) {
      if (index > 0) {
        this.manualSend.studentId.splice(index, 1)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.form {
  &__wrap {
    width: 90%;
    margin: 0 auto;
  }
}
</style>
