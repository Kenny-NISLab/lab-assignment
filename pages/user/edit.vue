<template>
  <v-row class="app__height my-3" justify="center" align-content="center">
    <v-card class="point__card" outlined>
      <CardTitle :title="title" :subtitle="subtitle" />

      <v-row class="mt-2 my-6 mx-10">
        <v-row>
          <v-col cols="12">
            <v-alert v-if="hasExceptVal || isNotMatched || hasTwoZeros" prominent type="error" outlined dense border="left" class="mx-auto">
              <ul>
                <li v-if="hasExceptVal">与えられた数値を入力してください</li>
                <li v-if="isNotMatched">合計得点が 100 点になるように入力してください</li>
                <li v-if="hasTwoZeros">0 点が 2 つ以上にならないように入力してください</li>
              </ul>
            </v-alert>
          </v-col>

          <v-col cols="12" class="mt-n4 mx-n3">
            <p class="ml-4 mb-n4">{{ subheader1 }}</p>
            <v-subheader>合計: {{ totalPoint }} 点</v-subheader>
            <v-divider />
          </v-col>

          <v-col v-for="(item, index) in items" :key="index" cols="12" lg="6">
            <v-row>
              <v-col cols="7">
                <v-subheader class="black--text">
                  {{ item.lab }} <br />
                  / {{ item.name }}
                </v-subheader>
                <v-subheader>以前の得点: {{ oldPoints[index] }}点</v-subheader>
              </v-col>
              <v-col cols="5">
                <v-text-field
                  :ref="item.id"
                  v-model="item.point"
                  suffix="点"
                  color="accent"
                  prepend-icon="mdi-calculator"
                  :rules="[pointRules.required, pointRules.degit, pointRules.over]"
                  :value="item.point"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-row class="mt-8">
          <v-col cols="12" class="mx-n3">
            <p class="ml-4">{{ subheader2 }}</p>
            <v-divider />
          </v-col>

          <v-col cols="12" lg="5">
            <v-subheader class="">以前の結果: {{ oldIsGraduate }}</v-subheader>
          </v-col>
          <v-col cols="12" lg="7">
            <v-form class="form__wrap">
              <v-select v-model="selected" :items="selectItems" label="大学院進学の希望調査" color="accent" return-object single-line />
            </v-form>
          </v-col>
        </v-row>
      </v-row>

      <CardButton :title="btnTitle" :icon="btnIcon" :submit="postPoints" />
    </v-card>
    <SaveDialog :open="saveConfirm" @close="close" />
  </v-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { SaveDialog } from '~/components/layouts/index'
import { CardTitle, CardButton } from '~/components/card/index'

export default {
  name: 'UserEdit',
  components: {
    CardTitle,
    CardButton,
    SaveDialog,
  },
  data() {
    return {
      title: '得点の編集と大学院進学希望の調査',
      subtitle: '希望研究室への得点と大学院進学の希望を設定できます',
      subheader1: '得点の編集',
      subheader2: '大学院進学希望の調査',
      btnTitle: '保存する',
      btnIcon: 'mdi-pencil',
      hasExceptVal: false, // 入力フォームに与えられた数値が入力されているか
      isNotMatched: false, // 合計点と一致しているか
      hasTwoZeros: false, // 0点が2つ以上存在していないか
      oldPoints: [],
      oldIsGraduate: '希望しない',
      items: [],
      pointRules: {
        required: (value) => !!value || value === 0 || '入力してください',
        degit: (value) => this.validDigit(value) || '0以上' + String(100 - this.items.length + 2) + '以下の数値を入力してください',
        over: (value) => this.totalPoint <= 100 || value === 0 || '合計で100点になるように入力してください',
      },
      selected: '',
      selectItems: ['希望しない', '希望する'],
      saveConfirm: false,
    }
  },
  computed: {
    ...mapGetters({
      uid: 'auth/userId',
      user: 'users/item',
      teachers: 'teachers/items',
    }),
    totalPoint() {
      const total = this.items.reduce((sum, item) => sum + Number(item.point), 0)
      if (total === 100) {
        this.teachers.forEach((teacher) => {
          if (this.$refs[teacher.id] != null) {
            this.$refs[teacher.id][0].resetValidation()
          }
        })
      }
      return total
    },
  },
  mounted() {
    const userPoint = Object.keys(this.user.point)
    this.teachers.forEach((teacher) => {
      const item = {
        id: teacher.id,
        name: teacher.name,
        lab: teacher.lab,
        point: 0,
      }
      if (userPoint.includes(teacher.id)) {
        item.point = Number(this.user.point[teacher.id])
      }
      this.items.push(item)
    })
    this.setOldPoints()
    this.setOldIsGraduate()
  },
  methods: {
    setOldPoints() {
      const points = this.items.map((item) => Number(item.point))
      this.oldPoints = points.slice()
    },
    setOldIsGraduate() {
      if (this.user.isGraduate) {
        this.oldIsGraduate = '希望する'
        this.selected = '希望する'
      } else {
        this.selected = '希望しない'
      }
    },
    postPoints() {
      let cnt = 0
      let sum = 0
      this.hasExceptVal = false
      this.isNotMatched = false
      this.hasTwoZeros = false

      for (const item of this.items) {
        // フォームのルールに沿わない値が入力されているかのチェック
        if (!this.validDigit(item.point) || item.point == null || item.point === '') {
          this.hasExceptVal = true
        }

        if (Number(item.point) === 0) {
          cnt++
        }

        sum += Number(item.point)
      }

      // 合計点が100点になっているかチェック
      if (sum !== 100) {
        this.isNotMatched = true
      }

      // 0点が2つ以上存在するかチェック
      if (cnt > 1) {
        this.hasTwoZeros = true
      }

      if (!this.hasExceptVal && !this.isNotMatched && !this.hasTwoZeros) {
        const points = {}
        this.items.forEach((item) => {
          points[item.id] = Number(item.point)
        })
        let selected = false
        if (this.selected === '希望する') {
          selected = true
        }
        this.$store.dispatch('users/update', {
          uid: this.uid,
          point: points,
          isGraduate: selected,
        })
        this.saveConfirm = true
      } else {
        window.scrollTo(0, 0)
      }
    },
    validDigit(value) {
      const num = 10 - this.items.length + 2
      // 研究室数が2以上20以下になることを想定した実装
      // 20個以上できた時はValidationを出さない（その時は誰か実装頼みます）
      if (num < -10) {
        return true
      }
      if (num > -10 && num < 0) {
        const re = new RegExp('^([0-9]|[1-7][0-9]|[8][0-' + String(10 + num) + '])$')
        return re.test(value)
      } else {
        const re = new RegExp('^([0-9]|[1-8][0-9]|[9][0-' + String(num) + '])$')
        return re.test(value)
      }
    },
    close() {
      this.saveConfirm = false
      this.$router.push('/user')
    },
  },
}
</script>

<style lang="scss" scoped>
.point {
  &__card {
    width: 90%;
    @include display_tab {
      max-width: 1000px;
      width: 80%;
    }
  }
}
</style>
