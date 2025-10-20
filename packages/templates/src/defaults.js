export const builtInTemplates = [
    {
        id: 'pomodoro-4x',
        name: 'Pomodoro 4x',
        repeat: 1,
        blocks: [
            { label: 'Focus', durationMinutes: 25, type: 'focus' },
            { label: 'Break', durationMinutes: 5, type: 'break' },
            { label: 'Focus', durationMinutes: 25, type: 'focus' },
            { label: 'Break', durationMinutes: 5, type: 'break' },
            { label: 'Focus', durationMinutes: 25, type: 'focus' },
            { label: 'Break', durationMinutes: 5, type: 'break' },
            { label: 'Focus', durationMinutes: 25, type: 'focus' },
            { label: 'Rest', durationMinutes: 15, type: 'break' }
        ]
    },
    {
        id: 'deep-work-3x',
        name: 'Deep Work 3x',
        repeat: 1,
        blocks: [
            { label: 'Focus', durationMinutes: 50, type: 'focus' },
            { label: 'Break', durationMinutes: 10, type: 'break' },
            { label: 'Focus', durationMinutes: 50, type: 'focus' },
            { label: 'Break', durationMinutes: 10, type: 'break' },
            { label: 'Focus', durationMinutes: 50, type: 'focus' }
        ]
    },
    {
        id: 'meditation-10',
        name: 'Meditation 10m',
        blocks: [{ label: 'Meditate', durationMinutes: 10, type: 'meditation' }]
    },
    {
        id: 'fitness-interval-8x',
        name: 'Fitness 8× (45s/15s)',
        blocks: [
            { label: 'Warmup', durationMinutes: 5, type: 'workout' },
            { label: 'Work', durationMinutes: 0.75, type: 'workout' },
            { label: 'Rest', durationMinutes: 0.25, type: 'rest' }
        ],
        repeat: 8
    }
];
