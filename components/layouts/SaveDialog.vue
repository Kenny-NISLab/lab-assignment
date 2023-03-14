<template>
  <v-dialog :value="open" width="450px" @input="close">
    <v-card>
      <v-card-title>
        {{ cardTitle }}
      </v-card-title>

      <v-card-text>
        <p>{{ cardText }}</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close"> 閉じる </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'SaveDialog',
  props: {
    open: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  data() {
    return {
      cardTitle: '得点を保存しました',
    }
  },
  methods: {
    close() {
      this.$emit('close', false)
    },
  },
}
</script>

<style></style>
