import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TODO_APP_CODE = `'use client';

import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Sparkles, Tag } from 'lucide-react';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  category: 'Work' | 'Personal' | 'Urgent';
  createdAt: string;
}

function TodoApp() {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', title: 'Design UI Workspace Layout in Next.js', completed: true, category: 'Work', createdAt: '2026-07-24' },
    { id: '2', title: 'Test Live Preview & E2B Tunnel Engine', completed: false, category: 'Urgent', createdAt: '2026-07-24' },
    { id: '3', title: 'Verify Multi-Agent Orchestration Loop', completed: false, category: 'Personal', createdAt: '2026-07-24' },
  ]);

  const [input, setInput] = useState('');
  const [category, setCategory] = useState<'Work' | 'Personal' | 'Urgent'>('Work');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([{ id: Date.now().toString(), title: input.trim(), completed: false, category, createdAt: new Date().toISOString().split('T')[0] ?? '' }, ...todos]);
    setInput('');
  };

  const toggleTodo = (id: string) => setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const deleteTodo = (id: string) => setTodos(todos.filter((t) => t.id !== id));

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-start font-sans">
      <header className="max-w-xl w-full mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/80 border border-sky-800 text-sky-400 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Generated Application</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Smart Todo Workspace</h1>
        <p className="text-slate-400 text-xs mt-1">Organize your tasks with real-time state management and category filters.</p>
      </header>

      <main className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-6">
        <form onSubmit={addTodo} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="What needs to be done?" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-all" />
            <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-sky-950/50">
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1"><Tag className="w-3 h-3" /> Category:</span>
            {(['Work', 'Personal', 'Urgent'] as const).map((cat) => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={\`px-2.5 py-0.5 rounded-full border transition-all \${category === cat ? 'bg-sky-950 text-sky-300 border-sky-700 font-semibold' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}\`}>{cat}</button>
            ))}
          </div>
        </form>

        <div className="flex items-center justify-between border-y border-slate-800 py-2.5 text-xs text-slate-400">
          <span>{activeCount} tasks remaining</span>
          <div className="flex items-center gap-1">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={\`px-2.5 py-1 rounded-md uppercase text-[10px] tracking-wider font-semibold transition-colors \${filter === f ? 'bg-slate-800 text-sky-400' : 'hover:text-slate-200'}\`}>{f}</button>
            ))}
          </div>
        </div>

        <ul className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredTodos.length === 0 ? (
            <li className="text-center py-8 text-slate-500 text-xs">No tasks found in this view.</li>
          ) : filteredTodos.map((todo) => (
            <li key={todo.id} className={\`flex items-center justify-between p-3 rounded-lg border transition-all \${todo.completed ? 'bg-slate-950/40 border-slate-800/60 opacity-60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}\`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button onClick={() => toggleTodo(todo.id)} className="text-slate-400 hover:text-sky-400 transition-colors">
                  {todo.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={\`text-sm truncate \${todo.completed ? 'line-through text-slate-500' : 'text-slate-200'}\`}>{todo.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={\`text-[10px] px-2 py-0.5 rounded font-mono \${todo.category === 'Urgent' ? 'bg-red-950 text-red-400 border border-red-800' : todo.category === 'Work' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}\`}>{todo.category}</span>
                <button onClick={() => deleteTodo(todo.id)} className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors" title="Delete task">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default TodoApp;`;

async function main() {
  // 1. Find or create user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Demo User', email: 'demo@example.com' },
    });
    console.log(`Created user: ${user.id} (demo@example.com)`);
  } else {
    console.log(`Using existing user: ${user.id} (${user.email})`);
  }

  const projectName = 'Todo App Preview';
  const projectSlug = 'todo-app-preview';

  // 2. Upsert project
  let project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (project) {
    console.log(`Project already exists: ${project.id} (${project.name})`);
  } else {
    project = await prisma.project.create({
      data: {
        name: projectName,
        slug: projectSlug,
        description: 'A simple todo app to test the live preview system',
        ownerId: user.id,
        status: 'PLANNING' as any,
      },
    });
    console.log(`Created project: ${project.id} (${projectName})`);
  }

  // 3. Upsert repository
  let repo = await prisma.repository.findUnique({ where: { projectId: project.id } });
  if (!repo) {
    repo = await prisma.repository.create({
      data: {
        projectId: project.id,
        path: `/projects/${project.id}`,
        provider: 'internal',
      },
    });
    console.log(`Created repository: ${repo.id}`);
  } else {
    console.log(`Repository already exists: ${repo.id}`);
  }

  // 4. Upsert the todo app file
  const existingFile = await prisma.file.findFirst({
    where: { repositoryId: repo.id, path: 'src/components/todo-app.tsx' },
  });

  if (existingFile) {
    await prisma.file.update({
      where: { id: existingFile.id },
      data: { content: TODO_APP_CODE },
    });
    console.log(`Updated todo-app.tsx (file: ${existingFile.id})`);
  } else {
    await prisma.file.create({
      data: {
        repositoryId: repo.id,
        path: 'src/components/todo-app.tsx',
        content: TODO_APP_CODE,
        language: 'typescript',
      },
    });
    console.log(`Created todo-app.tsx`);
  }

  console.log(`\nDone! Preview URL: /api/preview/${project.id}`);
  console.log(`Dashboard URL: /dashboard/projects/${project.id}/workspace`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
