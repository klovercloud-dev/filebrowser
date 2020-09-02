<template>
  <button @click="unzip" :aria-label="$t('buttons.unzip')" :title="$t('buttons.unzip')" id="unzip-button" class="action">
    <i class="material-icons">file_download</i>
    <span>{{ $t('buttons.unzip') }}</span>
    <span v-if="selectedCount > 0" class="counter">{{ selectedCount }}</span>
  </button>
</template>

<script>
import {mapGetters, mapState} from 'vuex'
import { files as api } from '@/api'

export default {
  name: 'unzip-button',
  computed: {
    ...mapState(['req', 'selected']),
    ...mapGetters(['isListing', 'selectedCount'])
  },
  methods: {
    unzip: function () {

      if (!this.isListing) {

       api.unzip(null, this.$route.path)
        return
      }

      if (this.selectedCount === 1 && !this.req.items[this.selected[0]].isDir) {


        api.unzip(null, this.req.items[this.selected[0]].url)
        return
      }

     // this.$store.commit('showHover', 'download')
    }
  }
}
</script>
