'use client';

import React from 'react';

export function EventTimelineCard() {
  const events = [
    {
      agent: 'Designer',
      time: 'Just now',
      message: 'Updated color palette tokens in Design Spec.',
      active: true,
    },
    {
      agent: 'Architect',
      time: '1h ago',
      message: 'Completed Architecture Specification (Arch_StudyMate_v1.json).',
      active: false,
    },
    {
      agent: 'Architect',
      time: '1.5h ago',
      message: 'Began drafting database schemas and API endpoints.',
      active: false,
    },
    {
      agent: 'CEO',
      time: '2h ago',
      message: 'Product specification completed and approved.',
      active: false,
    },
  ];

  return (
    <section className="bg-surface rounded-lg p-6 border border-white/10 flex flex-col gap-4">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        EVENT TIMELINE
      </h3>

      <div className="flex flex-col gap-4 pl-3 border-l border-white/10 font-mono text-xs relative">
        {events.map((evt, idx) => (
          <div key={idx} className="flex flex-col gap-1 relative">
            <span
              className={`absolute -left-[17px] top-1.5 w-2 h-2 rounded-full ${
                evt.active ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/40'
              }`}
            />
            <div className="flex items-center justify-between">
              <span className={evt.active ? 'text-primary font-bold' : 'text-foreground font-bold'}>
                {evt.agent}
              </span>
              <span className="text-[10px] text-on-surface-variant">{evt.time}</span>
            </div>
            <p className="text-on-surface-variant font-sans text-xs">{evt.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
