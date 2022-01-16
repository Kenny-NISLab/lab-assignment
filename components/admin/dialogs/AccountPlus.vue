<template>
  <v-card>
    <v-card-title>{{ cardTitle }}</v-card-title>
    <v-card-subtitle>{{ cardSubTitle }}</v-card-subtitle>

    <v-list>
      <v-list-item-group>
        <v-list-item @click="excelDialogOpen">
          <v-list-item-icon>
            <v-icon v-text="excel.icon" />
          </v-list-item-icon>
          <v-list-item-content v-text="excel.text" />
        </v-list-item>
        <v-list-item @click="manualDialogOpen">
          <v-list-item-icon>
            <v-icon v-text="manual.icon" />
          </v-list-item-icon>
          <v-list-item-content v-text="manual.text" />
        </v-list-item>
      </v-list-item-group>
    </v-list>

    <v-dialog v-model="isExcelDialogOpen" max-width="600px">
      <v-card>
        <v-card-title>{{ cardTitle }}</v-card-title>
        <v-card-subtitle>{{ authSubTitle1 }}</v-card-subtitle>
        <v-card-subtitle>{{ authSubTitle2 }}</v-card-subtitle>

        <v-container class="form__scroll">
          <v-subheader> 年度 </v-subheader>
          <v-form class="form__wrap">
            <v-text-field
              ref="year"
              v-model="excel.year"
              label="年度"
              name="year"
              color="accent"
              prepend-icon="mdi-calendar-month"
              required
              :rules="[yearRule.required, yearRule.checked]"
            />
          </v-form>

          <v-divider class="mt-3" />

          <v-subheader> Excelファイル </v-subheader>
          <v-form class="form__wrap">
            <v-file-input
              ref="file"
              label="ファイルを選択"
              name="file"
              accept="xlsx"
              color="accent"
              required
              :rules="[fileRule.checked]"
              @change="loadFile"
            />
          </v-form>
        </v-container>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click.stop="excelDialogClose"> 閉じる </v-btn>
          <v-btn color="accent" :loading="loading" :disabled="loading" text @click.stop="createUsersByExcel"> 保存する </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isManualDialogOpen" max-width="600px">
      <v-card>
        <v-card-title>{{ cardTitle }}</v-card-title>
        <v-card-subtitle>{{ authSubTitle1 }}</v-card-subtitle>
        <v-card-subtitle>{{ authSubTitle2 }}</v-card-subtitle>

        <v-container class="form__scroll">
          <v-subheader> 年度 </v-subheader>
          <v-form class="form__wrap">
            <v-text-field
              ref="year"
              v-model="manual.year"
              label="年度"
              name="year"
              color="accent"
              prepend-icon="mdi-calendar-month"
              required
              :rules="[yearRule.required, yearRule.checked]"
            />
          </v-form>

          <v-divider class="mt-3" />

          <v-subheader> ユーザ情報 </v-subheader>
          <v-form class="form__wrap">
            <v-text-field
              ref="id"
              v-model="manual.id"
              name="id"
              label="学籍番号"
              color="accent"
              prepend-icon="mdi-identifier"
              :rules="[idRule.required, idRule.checked]"
            />
            <v-text-field
              ref="name"
              v-model="manual.name"
              name="name"
              label="名前（半角スペースあり）"
              color="accent"
              prepend-icon="mdi-account-arrow-left"
              :rules="[nameRule.required, nameRule.checked]"
            />
            <v-text-field
              ref="email"
              v-model="manual.email"
              name="email"
              label="メールアドレス"
              color="accent"
              prepend-icon="mdi-email"
              :rules="[emailRule.required, emailRule.checked]"
            />
            <v-text-field
              ref="rank"
              v-model="manual.rank"
              name="rank"
              label="順位"
              color="accent"
              prepend-icon="mdi-format-list-numbered"
              :rules="[rankRule.required, rankRule.checked]"
            />
            <v-select
              ref="group"
              v-model="manual.group"
              :items="selectItems"
              name="group"
              label="順位グループ"
              color="accent"
              prepend-icon="mdi-account-group"
              :rules="[groupRule.required]"
            />
          </v-form>
        </v-container>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click.stop="manualDialogClose"> 閉じる </v-btn>
          <v-btn color="accent" text @click.stop="createUserByManual"> 保存する </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { httpsCallable } from 'firebase/functions'
import XLSX from 'xlsx'
import { mapGetters } from 'vuex'
import { functions } from '~/plugins/firebase'

export default {
  name: 'AccountPlus',
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
      isExcelDialogOpen: false,
      isManualDialogOpen: false,
      validate: false,
      loading: false,
      cardTitle: '学生の新規追加',
      cardSubTitle: 'Excelファイルからインポートするか手動で入力するかを選択してください。',
      authSubTitle1: 'ユーザの追加が完了するまでにしばらく時間がかかる可能性があります。連続して実行しないでください。',
      authSubTitle2: 'ユーザを登録ができない場合は、再度ユーザを新規追加をするか、一度ユーザを削除してください。',
      excel: {
        icon: 'mdi-file-excel',
        text: 'Excelファイルからインポート',
        year: '',
        file: {},
      },
      manual: {
        icon: 'mdi-account-plus',
        text: '手動で入力',
        year: '',
        id: '',
        name: '',
        rank: '',
        group: '',
        email: '',
      },
      selectItems: ['1', '2', '3'],
      yearRule: {
        required: (value) => !!value || '入力してください',
        checked: (value) => this.$checkYear(value) || '適切な年度を入力してください',
      },
      fileRule: {
        required: (value) => !!value || 'ファイルを選択してください',
        checked: (value) => (!!value && this.$checkExcel(value.name)) || '.xlsxのみ有効です',
      },
      idRule: {
        required: (value) => !!value || '入力してください',
        checked: (value) => this.$checkID(value) || '正しい学籍番号を入力してください',
      },
      nameRule: {
        required: (value) => !!value || '入力してください',
        checked: (value) => this.$checkName(value) || '姓と名の間に半角スペースを1つ入力してください',
      },
      emailRule: {
        required: (value) => !!value || '入力してください',
        checked: (value) => this.$checkEmail(value) || '正しいメールアドレスを入力してください',
      },
      rankRule: {
        required: (value) => !!value || '入力してください',
        checked: (value) => this.$checkRank(value) || '1から99の間で入力してください',
      },
      groupRule: {
        required: (value) => !!value || '選択してください',
      },
    }
  },
  computed: {
    ...mapGetters({
      teachers: 'teachers/items',
    }),
    excelForm() {
      return {
        year: this.excel.year,
        file: this.excel.file,
      }
    },
    manualForm() {
      return {
        year: this.manual.year,
        id: this.manual.id,
        name: this.manual.name,
        rank: this.manual.rank,
        group: this.manual.group,
        email: this.manual.email,
      }
    },
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
    excelDialogOpen() {
      this.globalEscape()
      this.isExcelDialogOpen = true
    },
    manualDialogOpen() {
      this.globalEscape()
      this.isManualDialogOpen = true
    },
    excelDialogClose() {
      this.isExcelDialogOpen = false
    },
    manualDialogClose() {
      this.isManualDialogOpen = false
    },
    reset(form) {
      Object.keys(form).forEach((f) => {
        this.$refs[f].reset()
      })
    },
    loadFile(e) {
      this.excel.file = e
    },
    createUsersByExcel() {
      this.validate = false
      Object.keys(this.excelForm).forEach((f) => {
        this.$refs[f].validate(true)
        if (!this.$refs[f].valid) {
          this.validate = true
        }
      })
      if (!this.validate) {
        this.loading = true
        const reader = new FileReader()
        const createUser = httpsCallable(functions, 'createUserToAuthAndDB')
        reader.onload = async (e) => {
          const workbook = XLSX.read(e.target.result)
          const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
          for (let i = 0; i < excelData.length; i = i + 1) {
            const student = {
              status: 'test',
              isActive: true,
              isPointAssigned: false,
              isGraduate: false,
              point: {},
              year: this.excelForm.year,
            }
            this.appendDataAsJsonByMap(student, excelData[i], this.$store.state.excel.keyMap)
            this.appendPointAsJsonByList(
              student.point,
              this.teachers.map((obj) => obj.id)
            )
            if (typeof student.id === 'number') {
              const studentId = student.id.toString()
              student.id = studentId
            }
            if (student.rank == null) {
              student.rank = 0
            }
            if (student.group == null) {
              student.group = 0
            }
            if (student.password == null) {
              student.password = ''
            }
            createUser(student).then((result) => {
              if (result.statusCode === 400) {
                alert('以下の学生の登録に失敗しました。\nemail: ' + result.email + '\nname:' + result.name)
                // eslint-disable-next-line no-console
                console.log('email: ' + result.email + ' name:' + result.name)
              }
            })
            await this.$sleep(1000)
          }
          this.loading = false
          this.reset(this.excelForm)
          this.excelDialogClose()
        }
        reader.readAsArrayBuffer(this.excel.file)
      }
    },
    createUserByManual() {
      this.validate = false
      Object.keys(this.manualForm).forEach((f) => {
        this.$refs[f].validate(true)
        if (!this.$refs[f].valid) {
          this.validate = true
        }
      })
      if (!this.validate) {
        const createUser = httpsCallable(functions, 'createUserToAuthAndDB')
        const student = {
          id: this.manualForm.id.toString(),
          name: this.manualForm.name,
          rank: Number(this.manualForm.rank),
          group: Number(this.manualForm.group),
          email: this.manualForm.email,
          status: 'test',
          isActive: true,
          isPointAssigned: false,
          isGraduate: false,
          point: {},
          year: this.manualForm.year,
        }
        this.appendPointAsJsonByList(
          student.point,
          this.teachers.map((obj) => obj.id)
        )
        createUser(student).then((result) => {
          if (result.statusCode === 400) {
            alert('入力した学生の登録に失敗しました。\nemail: ' + result.email + '\nname:' + result.name)
            // eslint-disable-next-line no-console
            console.log('email: ' + result.email + ' name:' + result.name)
          }
          this.reset(this.manualForm)
          this.manualDialogClose()
        })
      }
    },
    appendDataAsJsonByMap(obj, data, map) {
      for (const key in map) {
        obj[key] = data[map[key]]
      }
    },
    appendPointAsJsonByList(obj, list) {
      for (const key in list) {
        obj[list[key]] = 0
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.form {
  &__scroll {
    max-height: 600px;
  }
  &__wrap {
    width: 90%;
    margin: 0 auto;
  }
}
</style>
