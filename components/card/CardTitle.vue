<template>
  <div class="ma-3">
    <v-card-title>
      <h4>{{ title }}</h4>
    </v-card-title>
    <v-card-subtitle>{{ subtitle }}</v-card-subtitle>

    <v-divider class="mx-auto" />
  </div>
</template>

<script>
export default {
  name: 'CardTitle',
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
  },
  data() {
    return {}
  },
}
</script>

<style lang="scss" scoped></style>
