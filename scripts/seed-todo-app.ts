import { prisma } from '../src/lib/prisma';

const TODO_APP_CODE = `'use client';

import { useState } from 'react';

type Priority = 'low' | 'medium' | 'high';
type Filter = 'all' | 'active' | 'completed';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: Date;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-slate-800 text-slate-400 border-slate-700',
  medium: 'bg-amber-950 text-amber-400 border-amber-900',
  high: 'bg-red-950 text-red-400 border-red-900',
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-red-400',
};

const INITIAL_TODOS: Todo[] = [
  { id: 1, text: 'Set up Next.js project structure', completed: true, priority: 'high', createdAt: new Date() },
  { id: 2, text: 'Build authentication module', completed: true, priority: 'high', createdAt: new Date() },
  { id: 3, text: 'Design dashboard UI components', completed: false, priority: 'medium', createdAt: new Date() },
  { id: 4, text: 'Integrate PostgreSQL with Prisma ORM', completed: false, priority: 'high', createdAt: new Date() },
  { id: 5, text: 'Write unit tests for API routes', completed: false, priority: 'low', createdAt: new Date() },
];

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    active: todos.filter((t) => !t.completed).length,
  };

  const addTodo = () => {
    if (!inputText.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: inputText.trim(), completed: false, priority, createdAt: new Date() },
    ]);
    setInputText('');
  };

  const toggleTodo = (id: number) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const deleteTodo = (id: number) => setTodos((prev) => prev.filter((t) => t.id !== id));

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id: number) => {
    if (!editText.trim()) return;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: editText.trim() } : t)));
    setEditingId(null);
  };

  const clearCompleted = () => setTodos((prev) => prev.filter((t) => !t.completed));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 py-10 font-sans">
      {/* Header */}
      <div className="w-full max-w-lg mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded-full text-xs font-mono mb-3">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          AI Teams Platform — Todo App
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Task Manager</h1>
        <p className="text-slate-500 text-sm mt-1">Built with Next.js App Router</p>
      </div>

      {/* Stats */}
      <div className="w-full max-w-lg grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-300' },
          { label: 'Active', value: stats.active, color: 'text-sky-400' },
          { label: 'Done', value: stats.completed, color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className={\`text-2xl font-bold \${s.color}\`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-5">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
            style={{ width: stats.total > 0 ? \`\${(stats.completed / stats.total) * 100}%\` : '0%' }}
          />
        </div>
      </div>

      {/* Input */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new task..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={addTodo}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Priority:</span>
          {(['low', 'medium', 'high'] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={\`px-2.5 py-1 rounded-md text-xs font-medium border transition-all \${
                priority === p ? PRIORITY_STYLES[p] + ' ring-1 ring-offset-1 ring-offset-slate-900' : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600'
              }\`}
            >
              <span className={\`inline-block w-1.5 h-1.5 rounded-full mr-1 \${priority === p ? PRIORITY_DOT[p] : 'bg-slate-600'}\`}></span>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="w-full max-w-lg flex gap-1 mb-3 bg-slate-900 border border-slate-800 rounded-xl p-1">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={\`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all \${
              filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }\`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={\`ml-1.5 px-1.5 py-0.5 rounded text-[10px] \${filter === f ? 'bg-slate-600 text-slate-200' : 'bg-slate-800 text-slate-600'}\`}>
              {f === 'all' ? todos.length : f === 'active' ? stats.active : stats.completed}
            </span>
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="w-full max-w-lg space-y-2">
        {filteredTodos.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-sm">
            {filter === 'completed' ? '🎉 No completed tasks yet.' : '✨ No tasks here. Add one above!'}
          </div>
        )}
        {filteredTodos.map((todo) => (
          <div
            key={todo.id}
            className={\`bg-slate-900 border rounded-xl px-4 py-3 flex items-center gap-3 group transition-all \${
              todo.completed ? 'border-slate-800 opacity-60' : 'border-slate-700 hover:border-slate-600'
            }\`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleTodo(todo.id)}
              className={\`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all \${
                todo.completed ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 hover:border-indigo-400'
              }\`}
            >
              {todo.completed && <span className="text-white text-[10px] font-bold">✓</span>}
            </button>

            {/* Text */}
            <div className="flex-1 min-w-0">
              {editingId === todo.id ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(todo.id); if (e.key === 'Escape') setEditingId(null); }}
                  onBlur={() => saveEdit(todo.id)}
                  className="w-full bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-sm text-white outline-none"
                />
              ) : (
                <span className={\`text-sm block truncate \${todo.completed ? 'line-through text-slate-500' : 'text-slate-200'}\`}>
                  {todo.text}
                </span>
              )}
            </div>

            {/* Priority Badge */}
            <span className={\`px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 \${PRIORITY_STYLES[todo.priority]}\`}>
              {todo.priority}
            </span>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(todo)}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-800 text-xs"
                title="Edit"
              >✎</button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 text-xs"
                title="Delete"
              >✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {stats.completed > 0 && (
        <div className="w-full max-w-lg mt-4 flex justify-end">
          <button
            onClick={clearCompleted}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors"
          >
            Clear {stats.completed} completed
          </button>
        </div>
      )}
    </main>
  );
}
`;

async function seedTodoApp() {
  console.log('🌱 Seeding Todo App project...');

  // Find the user
  const user = await prisma.user.findFirst({
    where: { email: 'abi@gmail.com' },
  });

  if (!user) {
    console.error('❌ User abi@gmail.com not found. Please login first.');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email})`);

  // Create the project
  const project = await prisma.project.upsert({
    where: { slug: 'todo-app-v2' },
    update: {
      name: 'Todo App',
      description: 'A clean task manager with priorities, filters, and progress tracking.',
      status: 'IN_PROGRESS',
      color: '#6366f1',
      icon: 'check-square',
    },
    create: {
      name: 'Todo App',
      slug: 'todo-app-v2',
      description: 'A clean task manager with priorities, filters, and progress tracking.',
      status: 'IN_PROGRESS',
      color: '#6366f1',
      icon: 'check-square',
      ownerId: user.id,
    },
  });

  console.log(`✅ Project created: ${project.name} (${project.id})`);

  // Create repository
  const repo = await prisma.repository.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      provider: 'internal',
      path: `/projects/${project.id}`,
    },
  });

  console.log(`✅ Repository created: ${repo.id}`);

  // Seed files
  const files = [
    {
      path: 'src/app/page.tsx',
      content: TODO_APP_CODE,
      language: 'typescript',
    },
    {
      path: 'src/app/layout.tsx',
      content: `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todo App — AI Teams Platform',
  description: 'A clean task manager built with Next.js App Router',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
      language: 'typescript',
    },
    {
      path: 'src/app/globals.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body { margin: 0; }
`,
      language: 'css',
    },
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'todo-app',
        version: '0.1.0',
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: { next: '^14.0.0', react: '^18.0.0', 'react-dom': '^18.0.0' },
        devDependencies: { typescript: '^5.0.0', tailwindcss: '^3.0.0' },
      }, null, 2),
      language: 'json',
    },
    {
      path: 'tailwind.config.ts',
      content: `import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
`,
      language: 'typescript',
    },
  ];

  for (const file of files) {
    const existing = await prisma.file.findFirst({
      where: { repositoryId: repo.id, path: file.path },
      select: { id: true },
    });

    if (existing) {
      await prisma.file.update({
        where: { id: existing.id },
        data: { content: file.content, language: file.language },
      });
    } else {
      await prisma.file.create({
        data: {
          repositoryId: repo.id,
          path: file.path,
          content: file.content,
          language: file.language,
        },
      });
    }
    console.log(`  📄 Seeded: ${file.path}`);
  }

  console.log(`\n✅ Todo App seeded successfully!`);
  console.log(`   Project ID: ${project.id}`);
  console.log(`   Preview:    http://localhost:3000/preview/${project.id}`);
  console.log(`   Workspace:  http://localhost:3000/dashboard/projects/${project.id}/workspace`);
}

seedTodoApp()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
