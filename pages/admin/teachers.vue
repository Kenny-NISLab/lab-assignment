<template>
  <div class="app__height">
    <Menu v-model="search.value" :icon="menuIcon" :title="menuTitle" :search="search" :buttons="btnItems" />

    <v-container class="my-3 teacher__height" fluid>
      <v-row justify="center" align="center" class="teacher__height">
        <v-card class="table__card" outlined>
          <CardTitle :title="cardTitle" :subtitle="cardSubtitle" />

          <v-data-table
            :search="search.value"
            :headers="headers"
            :items="teachers"
            items-per-page="20"
            hide-default-footer
            logding-text="loading-text"
            locale="ja-jp"
            class="elevation-0 ma-4"
          >
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.action="{ item }">
              <v-icon small class="mr-2" @click.stop="editItem(item)"> mdi-pencil </v-icon>
              <v-icon small @click.stop="deleteItem(item)"> mdi-delete </v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-row>
    </v-container>

    <v-dialog v-model="dialogEdit" max-width="600px">
      <v-card>
        <v-card-title>研究室の編集</v-card-title>
        <v-alert v-if="isNotUpdated" type="error" outlined dense border="left" class="mx-10">
          <div class="error__text">
            データを更新できませんでした。 <br />
            もう一度試してみてください。
          </div>
        </v-alert>
        <v-container class="form__scroll">
          <v-form class="form__wrap">
            <v-text-field
              ref="name"
              v-model="updatedName"
              name="name"
              label="教授名（半角スペースあり）"
              color="accent"
              prepend-icon="mdi-account"
              :rules="[nameRule.required, nameRule.checked]"
            />
            <v-text-field
              ref="lab"
              v-model="updatedLab"
              name="lab"
              label="研究室名"
              color="accent"
              prepend-icon="mdi-label"
              :rules="[labRule.required]"
            />
          </v-form>
        </v-container>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeEdit"> 閉じる </v-btn>
          <v-btn color="accent" text @click="saveEdit"> 保存する </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="600px">
      <v-card>
        <v-card-title>研究室の削除</v-card-title>
        <v-card-text>本当に削除してよろしいですか？</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDelete"> 閉じる </v-btn>
          <v-btn color="error" text @click="saveDelete"> 削除 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { CardTitle } from '~/components/card/index'
import { Menu } from '~/components/admin/index'

export default {
  name: 'AdminTeachers',
  components: {
    CardTitle,
    Menu,
  },
  data() {
    return {
      menuTitle: '教授一覧',
      menuIcon: 'mdi-school',
      search: {
        isDisplay: true,
        value: '',
      },
      btnItems: {
        accountPlus: {
          icon: 'mdi-account-plus',
          color: 'accent',
          title: '新規追加',
          disabled: false,
          displayDialog: true,
          slotName: 'teacher-plus',
        },
      },
      cardTitle: '研究室の管理',
      cardSubtitle: '研究室の新規作成や削除を行うことができます。研究室IDに関しては運用ルールに従って保存してください。',
      headers: [
        {
          text: '研究室ID',
          sortable: true,
          value: 'id',
        },
        {
          text: '教授名',
          sortable: true,
          value: 'name',
        },
        {
          text: '研究室名',
          sortable: true,
          value: 'lab',
        },
        {
          text: '編集/削除',
          value: 'action',
          width: '120',
          sortable: false,
        },
      ],
      loadingText: '現在データを取得中です。しばらくお待ちください。',
      dialogDelete: false,
      dialogEdit: false,
      isNotUpdated: false,
      editedItem: {
        id: '',
        name: '',
        lab: '',
      },
      updatedName: '',
      updatedLab: '',
      nameRule: {
        required: (value) => !!value || '入力してください',
        checked: (value) => this.$checkName(value) || '姓と名の間に半角スペースを1つ入力してください',
      },
      labRule: {
        required: (value) => !!value || '入力してください',
      },
    }
  },
  computed: {
    ...mapGetters({
      teachers: 'teachers/items',
    }),
    form() {
      return {
        name: this.updatedName,
        lab: this.updatedLab,
      }
    },
  },
  async created() {
    await this.$store.dispatch('teachers/get')
  },
  mounted() {
    this.startListener()
  },
  beforeDestroy() {
    this.stopListener()
  },
  methods: {
    ...mapActions({
      startListener: 'teachers/startListener',
      stopListener: 'teachers/stopListener',
    }),
    reset() {
      Object.keys(this.form).forEach((f) => {
        this.$refs[f].reset()
      })
    },
    editItem(item) {
      this.editedIndex = this.teachers.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.updatedName = this.editedItem.name
      this.updatedLab = this.editedItem.lab
      this.dialogEdit = true
    },
    deleteItem(item) {
      this.editedIndex = this.teachers.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.dialogDelete = true
    },
    closeEdit() {
      this.reset()
      this.isNotUpdated = false
      this.dialogEdit = false
    },
    closeDelete() {
      this.dialogDelete = false
    },
    saveEdit() {
      this.validate = false
      Object.keys(this.form).forEach((f) => {
        this.$refs[f].validate(true)
        if (!this.$refs[f].valid) {
          this.validate = true
        }
      })
      if (!this.validate) {
        this.dialogEdit = false
        this.$store
          .dispatch('teachers/update', {
            id: this.editedItem.id,
            name: this.form.name,
            lab: this.form.lab,
          })
          .then(() => {
            this.closeEdit()
          })
          .catch((err) => {
            this.isNotUpdated = true
            // eslint-disable-next-line no-console
            console.error(err.message)
          })
      }
    },
    saveDelete() {
      this.$store.dispatch('teachers/delete', {
        id: this.editedItem.id,
      })
      this.dialogDelete = false
    },
  },
}
</script>

<style lang="scss" scoped>
.teacher {
  &__height {
    height: 92%;
  }
}
.table {
  &__card {
    width: 90%;
    @include display_tab {
      width: 60%;
    }
  }
}

.error {
  &__text {
    font-size: 14px;
  }
}
</style>
