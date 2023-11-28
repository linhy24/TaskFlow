"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
    id: string;
    content: string;
    isNew: boolean;
}

interface TaskCardProps {
    id: string;
    content: string;
    handleEdit: () => void;
    isDragging: boolean;
    children?: React.ReactNode; // Allow children as an optional prop
}

const TaskCard: React.FC<TaskCardProps> = ({ id, content, handleEdit, isDragging }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`p-2 rounded-lg bg-white/60 dark:bg-zinc-700/60 shadow-sm hover:scale-105 hover:shadow-lg cursor-pointer`} onClick={() => handleEdit()}>
            {content}
        </div>
    );
};


const TaskPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editValue, setEditValue] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                delay: 150, // Delay in milliseconds before drag starts
                tolerance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        }),
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        setIsDragging(true);
    };

    const handleDragEnd = useCallback((event: any) => {
        const { active, over } = event;
        setIsDragging(false);
        if (active.id !== over?.id) {
            setTasks((prevTasks) => {
                const oldIndex = prevTasks.findIndex((task) => task.id === active.id);
                const newIndex = prevTasks.findIndex((task) => task.id === over.id);
                return arrayMove(prevTasks, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    }, []);

    const handleAddTask = () => {
        if (inputValue) {
            setTasks([...tasks, { id: `task-${tasks.length}`, content: inputValue, isNew: true }]);
            setInputValue('');
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setEditValue(task.content);
    };

    const saveEdit = () => {
        if (editingTask) {
            setTasks(tasks.map(task => task.id === editingTask.id ? { ...task, content: editValue } : task));
            setEditingTask(null);
        }
    };

    const cancelEdit = () => {
        setEditingTask(null);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            setEditingTask(null);
        }
    };

    useEffect(() => {
        if (editingTask) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingTask]);

    useEffect(() => {
        if (tasks.some(task => task.isNew)) {
            const timer = setTimeout(() => {
                setTasks(tasks.map(task => ({ ...task, isNew: false })));
            }, 300); // Duration of the animation
            return () => clearTimeout(timer);
        }
    }, [tasks]);

    // Effect to detect dark mode preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);

            const listener = (e: any) => {
                setIsDarkMode(e.matches);
            };

            window.matchMedia('(prefers-color-scheme: dark)').addListener(listener);
            return () => {
                window.matchMedia('(prefers-color-scheme: dark)').removeListener(listener);
            };
        }
    }, []);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-zinc-200 to-transparent dark:from-zinc-800 dark:to-transparent ">
                <div className="w-full max-w-5xl p-4 ">
                    <div className="flex justify-center items-center mb-6 space-x-4 ">
                        <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="border border-gray-300 p-2 rounded mr-2 flex-grow max-w-md dark:bg-zinc-700"
                            placeholder="Enter a task"
                        />
                        <button
                            onClick={handleAddTask}
                            className="group rounded-lg border border-transparent px-5 py-4 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 font-semibold"
                            style={{ fontFamily: "sans-serif" }}
                        >
                            Add Task
                        </button>
                    </div>

                    <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                        <div className="grid grid-cols-2 gap-4">
                            {/* First board with tasks */}
                            <div className="p-4 rounded-lg dark:bg-zinc-800/30 dark:border-neutral-800 backdrop-filter backdrop-blur-lg shadow-lg">
                                <h2 className="font-mono text-lg font-semibold mb-2">Board 1</h2>
                                <div className="space-y-2">
                                    {tasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            id={task.id}
                                            content={task.content}
                                            handleEdit={() => handleEditTask(task)}
                                            isDragging={activeId === task.id && isDragging}>
                                            {task.content}
                                        </TaskCard>
                                    ))}
                                </div>
                            </div>

                            {/* Second empty board */}
                            <div className="p-4 rounded-lg dark:bg-zinc-800/30 dark:border-neutral-800 backdrop-filter backdrop-blur-lg shadow-lg">
                                <h2 className="font-mono text-lg font-semibold mb-2">Board 2</h2>

                            </div>
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {isDragging && activeId ? (
                            <div style={{
                                padding: '10px',
                                borderRadius: '6px',
                                backgroundColor: isDarkMode ? '#6b7176' : 'white', // Example dark mode color
                                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)'
                            }}>
                                {tasks.find(task => task.id === activeId)?.content}
                            </div>
                        ) : null}
                    </DragOverlay>

                </div>

                {editingTask && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 transition-transform duration-300">
                        <div ref={modalRef} className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-6 shadow-lg w-full max-w-md scale-90 transition-all duration-300" style={{ transform: editingTask ? 'scale(1)' : 'scale(0.9)' }}>
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="border border-gray-300 p-2 rounded w-full dark:bg-zinc-700"
                            />
                            <div className="flex justify-end space-x-2 mt-4">
                                <button onClick={saveEdit} className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                                    Save
                                </button>
                                <button onClick={cancelEdit} className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
      `}</style>
            </div>
        </DndContext>
    );
};

export default TaskPage;
