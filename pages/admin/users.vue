<template>
  <div>
    <Menu v-model="search.value" :icon="menuIcon" :title="menuTitle" :search="search" :buttons="btnItems" />

    <v-container class="my-3" fluid>
      <v-row justify="center">
        <v-card class="table__card" outlined>
          <CardTitle :title="cardTitle" :subtitle="cardSubtitle" />

          <v-data-table
            v-model="checked"
            :search="search.value"
            :headers="headers"
            :items="users"
            :single-select="singleSelect"
            item-key="id"
            logding-text="loading-text"
            locale="ja-jp"
            class="elevation-0 ma-4"
          />
        </v-card>
      </v-row>
    </v-container>

    <DangerPanel />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { CardTitle } from '~/components/card/index'
import { Menu, DangerPanel } from '~/components/admin/index'

export default {
  name: 'AdminUsers',
  components: {
    CardTitle,
    Menu,
    DangerPanel,
  },
  data() {
    return {
      menuTitle: '学生一覧',
      menuIcon: 'mdi-account-multiple',
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
          slotName: 'account-plus',
        },
        fileExcel: {
          icon: 'mdi-file-excel',
          color: 'accent',
          title: 'Excel出力',
          disabled: false,
          displayDialog: true,
          slotName: 'file-excel',
        },
        email: {
          icon: 'mdi-email',
          color: 'accent',
          title: 'メール配信',
          disabled: false,
          displayDialog: true,
          slotName: 'email',
        },
        // 権限変更機能
        // とりあえず消しておく
        // 必要になったら、復活
        // accountOff: {
        //   icon: 'mdi-account-off',
        //   color: 'error',
        //   title: '権限変更',
        //   disabled: true,
        //   displayDialog: true,
        //   slotName: 'account-off',
        // },
      },
      cardTitle: 'ユーザの管理',
      cardSubtitle: 'ユーザを追加したり、ユーザに対して、パスワードを配信することができます',
      singleSelect: false,
      checked: [],
      headers: [
        {
          text: '学籍番号',
          sortable: true,
          value: 'id',
        },
        {
          text: '名前',
          sortable: false,
          value: 'name',
        },
        {
          text: 'メールアドレス',
          sortable: false,
          value: 'email',
        },
        {
          text: '希望設定済み',
          filterable: false,
          value: 'isPointAssigned',
        },
        {
          text: 'テスト/本番',
          filterable: false,
          value: 'status',
        },
        {
          text: 'ログイン可',
          filterable: false,
          value: 'isActive',
        },
        {
          text: '年度',
          value: 'year',
        },
      ],
      loadingText: '現在データを取得中です。しばらくお待ちください。',
    }
  },
  computed: {
    ...mapGetters({
      users: 'users/items',
    }),
  },
  created() {
    this.$store.dispatch('users/getAll')
  },
  mounted() {
    this.startListener()
  },
  beforeDestroy() {
    this.stopListener()
  },
  methods: {
    ...mapActions({
      startListener: 'users/startListener',
      stopListener: 'users/stopListener',
    }),
    // チェックボックスの機能を追加するなら以下のプロパティを追加する必要がある
    // show-select
    // @toggle-select-all="selectAllCheck($event)"
    // @item-selected="selectCheck($event)"
    // 権限設定が必要か分からないので、メソッドもコメントアウトしておく
    // selectAllCheck(event) {
    //   if (event.value) {
    //     this.btnItems.accountOff.disabled = false
    //   } else {
    //     this.btnItems.accountOff.disabled = true
    //   }
    // },
    // selectCheck(event) {
    //   if (event.value) {
    //     this.btnItems.accountOff.disabled = false
    //   }
    //   if (!event.value && this.checked.length === 1) {
    //     this.btnItems.accountOff.disabled = true
    //   }
    // },
  },
}
</script>

<style lang="scss" scoped>
.table {
  &__card {
    width: 90%;
  }
}
</style>
