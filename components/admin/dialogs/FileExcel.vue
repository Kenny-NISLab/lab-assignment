<template>
  <v-card>
    <v-card-title>Excelファイルを出力</v-card-title>
    <v-container>
      <v-subheader>出力する学生の年度を選択してください</v-subheader>
      <v-form class="form__wrap">
        <v-select v-model="year" label="年度" :items="years" color="accent" />
      </v-form>
    </v-container>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click.stop="close"> 閉じる </v-btn>
      <v-btn color="accent" text @click.stop="downloadExcel"> ダウンロード </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'
import XLSX from 'xlsx'
import crypto from 'crypto-js'

export default {
  name: 'FileExcel',
  props: {
    open: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  data() {
    return {
      isOpen: false,
      year: '',
    }
  },
  computed: {
    ...mapGetters({
      years: 'users/years',
      users: 'users/itemsByYear',
      teachers: 'teachers/items',
    }),
  },
  async mounted() {
    this.isOpen = this.open
    if (this.teachers.length === 0) {
      await this.$store.dispatch('teachers/get')
    }
  },
  methods: {
    globalEscape() {
      this.isOpen = false
      this.$emit('close', this.isOpen)
    },
    close() {
      this.globalEscape()
    },
    async downloadExcel() {
      const wb = XLSX.utils.book_new()
      const users = await this.$store.dispatch('users/getUsersByYear', {
        year: this.year,
      })
      const excelData = []
      users.forEach((user) => {
        const student = {}
        this.appendDataAsExcelByMap(student, user.data(), this.$store.state.excel.keyMap)
        student['パスワード'] = this.decryptPassword(user.data().password)
        this.teachers.forEach((teacher) => {
          student[teacher.lab + '/' + teacher.name] = user.data().point[teacher.id]
        })
        if (user.data().isGraduate) {
          student['進学希望の確認'] = '希望する'
        } else {
          student['進学希望の確認'] = '希望しない'
        }
        excelData.push(student)
      })
      const sheet = XLSX.utils.json_to_sheet(excelData)
      const filename = this.year + '年度-結果.xlsx'
      XLSX.utils.book_append_sheet(wb, sheet, this.year + '年度')
      XLSX.writeFile(wb, filename)
      this.globalEscape()
    },
    appendDataAsExcelByMap(obj, data, map) {
      for (const key in map) {
        obj[map[key]] = data[key]
      }
    },
    decryptPassword(password) {
      return crypto.AES.decrypt(password, process.env.CRYPT_JS_PASSPHRASE).toString(crypto.enc.Utf8)
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
