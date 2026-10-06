<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  calculate,
  clearHistory,
  convertBase,
  deleteHistory,
  fetchHistory,
  fetchStats,
  toggleFavorite,
} from './api'

const expression = ref('')
const result = ref('')
const error = ref('')
const loading = ref(false)
const history = ref([])
const keyword = ref('')
const stats = ref({ totalCount: 0, lastExpression: '', lastResult: null })
const scientific = ref(false)
const theme = ref(localStorage.getItem('calc-theme') || 'day')
const tab = ref('history')
const baseValue = ref('42')
const fromBase = ref(10)
const toBase = ref(2)
const baseResult = ref('')
const backendDown = ref(false)

const mainKeys = [
  { label: 'AC', type: 'danger', send: 'C' },
  { label: '←', type: 'fn', send: 'DEL' },
  { label: '(', type: 'fn', send: '(' },
  { label: ')', type: 'fn', send: ')' },
  { label: '7', type: 'num', send: '7' },
  { label: '8', type: 'num', send: '8' },
  { label: '9', type: 'num', send: '9' },
  { label: '÷', type: 'op', send: '÷' },
  { label: '4', type: 'num', send: '4' },
  { label: '5', type: 'num', send: '5' },
  { label: '6', type: 'num', send: '6' },
  { label: '×', type: 'op', send: '×' },
  { label: '1', type: 'num', send: '1' },
  { label: '2', type: 'num', send: '2' },
  { label: '3', type: 'num', send: '3' },
  { label: '−', type: 'op', send: '-' },
  { label: '0', type: 'num', send: '0' },
  { label: '.', type: 'num', send: '.' },
  { label: '+', type: 'op', send: '+' },
  { label: '=', type: 'eq', send: '=' },
]

const sciKeys = [
  { label: 'sin', send: 'sin(' },
  { label: 'cos', send: 'cos(' },
  { label: 'tan', send: 'tan(' },
  { label: 'x^y', send: '^' },
  { label: 'ln', send: 'ln(' },
  { label: 'log', send: 'log(' },
  { label: '√', send: 'sqrt(' },
  { label: 'π', send: 'π' },
]

const displayResult = computed(() => {
  if (error.value || result.value === '' || result.value == null) return ''
  return result.value
})

function applyTheme() {
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('calc-theme', theme.value)
}

function toggleTheme() {
  theme.value = theme.value === 'day' ? 'night' : 'day'
  applyTheme()
}

function press(send) {
  error.value = ''
  if (send === '=') {
    runCalculate()
    return
  }
  if (send === 'C') {
    expression.value = ''
    result.value = ''
    return
  }
  if (send === 'DEL') {
    expression.value = expression.value.slice(0, -1)
    return
  }
  result.value = ''
  const map = { '×': '*', '÷': '/', 'π': 'pi' }
  expression.value += map[send] || send
}

async function runCalculate() {
  if (!expression.value.trim()) {
    error.value = '请输入表达式'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await calculate(expression.value)
    result.value = formatNumber(data.result)
    backendDown.value = false
    await refreshSide()
  } catch (err) {
    result.value = ''
    error.value = err.message || '计算失败'
    if (String(err.message).includes('Failed to fetch') || String(err.message).includes('Network')) {
      backendDown.value = true
      error.value = '后端未启动'
    }
  } finally {
    loading.value = false
  }
}

function formatNumber(value) {
  if (value == null) return ''
  return String(value)
}

function formatTime(value) {
  return String(value).replace('T', ' ').slice(5, 19)
}

async function refreshSide() {
  try {
    const [historyRes, statsRes] = await Promise.all([
      fetchHistory(1, 30, keyword.value),
      fetchStats(),
    ])
    history.value = historyRes.data.items
    stats.value = statsRes.data
    backendDown.value = false
  } catch {
    backendDown.value = true
  }
}

async function onDelete(id) {
  try {
    await deleteHistory(id)
    await refreshSide()
  } catch (err) {
    error.value = err.message || '删除失败'
  }
}

async function onClear() {
  if (!window.confirm('清空全部历史？')) return
  try {
    await clearHistory()
    await refreshSide()
  } catch (err) {
    error.value = err.message || '清空失败'
  }
}

async function onFavorite(id) {
  try {
    await toggleFavorite(id)
    await refreshSide()
  } catch (err) {
    error.value = err.message || '操作失败'
  }
}

function reuse(item) {
  expression.value = item.expression
  result.value = formatNumber(item.result)
  error.value = ''
}

async function onConvert() {
  error.value = ''
  try {
    const data = await convertBase(baseValue.value, fromBase.value, toBase.value)
    baseResult.value = data.data.result
  } catch (err) {
    error.value = err.message
  }
}

function onKeydown(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    if (event.key === 'Enter' && event.target.id === 'expr') {
      event.preventDefault()
      runCalculate()
    }
    return
  }
  if (event.key === 'Enter' || event.key === '=') {
    event.preventDefault()
    runCalculate()
    return
  }
  if (event.key === 'Backspace') {
    press('DEL')
    return
  }
  if (event.key === 'Escape') {
    press('C')
    return
  }
  if ('0123456789.+-*/()%^'.includes(event.key)) {
    expression.value += event.key
  }
}

onMounted(() => {
  applyTheme()
  refreshSide()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="shell">
    <header class="top">
      <h1>计算器</h1>
      <nav>
        <button type="button" :class="{ on: !scientific }" @click="scientific = false">基础</button>
        <button type="button" :class="{ on: scientific }" @click="scientific = true">科学</button>
        <button type="button" @click="toggleTheme">{{ theme === 'day' ? '深色' : '浅色' }}</button>
      </nav>
    </header>

    <div class="board">
      <section class="calc">
        <div class="lcd">
          <div class="lcd-row">
            <span v-if="backendDown" class="warn">未连接后端</span>
            <span v-else>{{ stats.totalCount }} 次</span>
          </div>
          <input
            id="expr"
            v-model="expression"
            maxlength="80"
            autocomplete="off"
            spellcheck="false"
            placeholder="0"
          />
          <p v-if="error" class="err">{{ error }}</p>
          <p v-else-if="displayResult" class="ans">{{ displayResult }}</p>
        </div>

        <div v-if="scientific" class="sci">
          <button v-for="key in sciKeys" :key="key.label" type="button" @click="press(key.send)">
            {{ key.label }}
          </button>
        </div>

        <div class="pad">
          <button
            v-for="key in mainKeys"
            :key="key.label"
            type="button"
            :class="key.type"
            :disabled="key.send === '=' && loading"
            @click="press(key.send)"
          >
            {{ key.label }}
          </button>
        </div>
      </section>

      <aside>
        <div class="aside-top">
          <h2>记录</h2>
          <div class="tabs">
            <button type="button" :class="{ on: tab === 'history' }" @click="tab = 'history'">历史</button>
            <button type="button" :class="{ on: tab === 'tools' }" @click="tab = 'tools'">进制</button>
          </div>
        </div>

        <template v-if="tab === 'history'">
          <div class="find">
            <input v-model="keyword" placeholder="搜索" @keyup.enter="refreshSide" />
            <button type="button" @click="refreshSide">查询</button>
            <button type="button" class="quiet" @click="onClear">清空</button>
          </div>
          <ul>
            <li v-for="item in history" :key="item.id">
              <button class="item" type="button" @click="reuse(item)">
                <span>{{ item.expression }}</span>
                <b>{{ formatNumber(item.result) }}</b>
                <small>{{ formatTime(item.createdAt) }}</small>
              </button>
              <button class="icon" type="button" @click="onFavorite(item.id)">
                {{ item.favorite ? '★' : '☆' }}
              </button>
              <button class="icon" type="button" @click="onDelete(item.id)">×</button>
            </li>
            <li v-if="!history.length" class="empty">暂无记录</li>
          </ul>
        </template>

        <div v-else class="base">
          <input v-model="baseValue" />
          <select v-model.number="fromBase">
            <option :value="2">2 进制</option>
            <option :value="8">8 进制</option>
            <option :value="10">10 进制</option>
            <option :value="16">16 进制</option>
          </select>
          <select v-model.number="toBase">
            <option :value="2">2 进制</option>
            <option :value="8">8 进制</option>
            <option :value="10">10 进制</option>
            <option :value="16">16 进制</option>
          </select>
          <button type="button" @click="onConvert">转换</button>
          <p>{{ baseResult || '—' }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.shell {
  max-width: 920px;
  margin: 0 auto;
  padding: 36px 20px 72px;
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}

h1,
h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

nav,
.tabs,
.find,
.base {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

nav button,
.tabs button,
.find button,
.base button,
.icon {
  border: 0;
  background: none;
  padding: 0;
  color: var(--dim);
  cursor: pointer;
}

nav button.on,
.tabs button.on {
  color: var(--fg);
}

.board {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}

.calc,
aside {
  background: var(--panel);
  padding: 20px;
}

.lcd {
  background: var(--lcd);
  color: var(--lcd-fg);
  padding: 14px 14px 12px;
  margin-bottom: 12px;
}

.lcd-row {
  display: flex;
  justify-content: flex-end;
  font-size: 11px;
  color: #8d8a82;
  min-height: 16px;
}

.warn,
.err {
  color: #d7a39a;
}

.lcd input {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--lcd-fg);
  text-align: right;
  outline: none;
  font: 500 32px/1.15 "Noto Sans Mono", "Consolas", monospace;
  padding: 8px 0 0;
}

.ans,
.err {
  margin: 6px 0 0;
  text-align: right;
  font: 14px/1.4 "Noto Sans Mono", monospace;
}

.sci,
.pad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.sci {
  margin-bottom: 6px;
}

.sci button,
.pad button {
  height: 48px;
  border: 0;
  border-radius: 2px;
  background: var(--key);
  cursor: pointer;
  font-size: 18px;
}

.sci button {
  height: 32px;
  font-size: 12px;
  background: var(--key-fn);
}

.pad button:hover,
.sci button:hover {
  filter: brightness(0.97);
}

.pad .fn {
  background: var(--key-fn);
  font-size: 15px;
}

.pad .op {
  background: var(--key-op);
  color: var(--key-op-fg);
}

.pad .danger {
  background: var(--ac);
  color: #f4f3ef;
  font-size: 14px;
}

.pad .eq {
  background: var(--eq);
  color: var(--eq-fg);
}

.aside-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.find input,
.base input,
.base select {
  flex: 1;
  min-width: 72px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  padding: 6px 0;
  outline: none;
}

.quiet {
  color: var(--danger);
}

ul {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  max-height: 430px;
  overflow: auto;
}

li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 4px;
  align-items: start;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.item {
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
}

.item span,
.item b {
  display: block;
  font-family: "Noto Sans Mono", monospace;
}

.item b {
  font-size: 16px;
  font-weight: 600;
  margin-top: 2px;
}

.item small,
.empty {
  color: var(--dim);
  font-size: 12px;
}

.icon {
  width: 22px;
  padding-top: 2px;
}

.base {
  margin-top: 8px;
}

.base p {
  width: 100%;
  margin: 16px 0 0;
  font: 22px/1.3 "Noto Sans Mono", monospace;
}

@media (max-width: 800px) {
  .board {
    grid-template-columns: 1fr;
  }
}
</style>
