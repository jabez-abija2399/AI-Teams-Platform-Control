'use client'

import { useState } from 'react'
import { Plus, Trash2, Check, Edit3, Save, X, ListTodo, Circle, CheckCircle2 } from 'lucide-react'

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Learn Next.js App Router', completed: true, createdAt: '2 hours ago' },
    { id: 2, text: 'Build a todo list component', completed: false, createdAt: '1 hour ago' },
    { id: 3, text: 'Deploy to production', completed: false, createdAt: '30 min ago' },
  ])
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [nextId, setNextId] = useState(4)

  const addTodo = () => {
    if (!input.trim()) return
    setTodos([
      { id: nextId, text: input.trim(), completed: false, createdAt: 'Just now' },
      ...todos,
    ])
    setInput('')
    setNextId(nextId + 1)
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((t) => t.id !== id))
  }

  const startEdit = (id: number, text: string) => {
    setEditingId(id)
    setEditText(text)
  }

  const saveEdit = (id: number) => {
    if (!editText.trim()) return
    setTodos(todos.map((t) => (t.id === id ? { ...t, text: editText.trim() } : t)))
    setEditingId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const completedCount = todos.filter((t) => t.completed).length
  const activeCount = todos.length - completedCount

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-violet-700 text-xs font-medium mb-4">
          <ListTodo className="w-3.5 h-3.5" />
          AI Teams Platform
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Todo List</h1>
        <p className="text-sm text-slate-500">Manage your tasks efficiently</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-slate-900">{todos.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
          <div className="text-xs text-slate-500">Done</div>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{activeCount}</div>
          <div className="text-xs text-slate-500">Pending</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
              filter === f
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f} {f === 'all' ? `(${todos.length})` : f === 'active' ? `(${activeCount})` : `(${completedCount})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {filteredTodos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ListTodo className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              {filter === 'all'
                ? 'No todos yet. Add one above!'
                : filter === 'active'
                ? 'No pending tasks. Great job!'
                : 'No completed tasks yet.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredTodos.map((todo) => (
              <li key={todo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                <button onClick={() => toggleTodo(todo.id)} className="shrink-0">
                  {todo.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-violet-500 transition-colors" />
                  )}
                </button>

                {editingId === todo.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(todo.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-violet-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(todo.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {todo.text}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{todo.createdAt}</p>
                  </div>
                )}

                {editingId !== todo.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(todo.id, todo.text)} className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteTodo(todo.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
