import { defineStore } from 'pinia'
import { ref } from 'vue'

function todayString() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const useHariStore = defineStore('hari', () => {
  const tanggal = ref(todayString())

  function setTanggal(t: string) {
    tanggal.value = t
  }

  return { tanggal, setTanggal }
})
