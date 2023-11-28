"use client";

import React, { useState, useCallback } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  id: string;
  content: string | undefined;
  isDragging: boolean;
}

// Task card component
const TaskCard: React.FC<TaskCardProps> = ({ id, content, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '10px 20px',
    marginBottom: '10px',
    borderRadius: '6px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    cursor: 'grab',
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="task-card">
      {content}
    </div>
  );
};

// Main page component
const TaskPage = () => {
  const [tasks, setTasks] = useState([
    { id: 'task-1', content: 'Task 1' },
    { id: 'task-2', content: 'Task 2' },
    { id: 'task-3', content: 'Task 3' },
  ]);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      setTasks((prevTasks) => {
        const oldIndex = prevTasks.findIndex((task) => task.id === active.id);
        const newIndex = prevTasks.findIndex((task) => task.id === over.id);
        return arrayMove(prevTasks, oldIndex, newIndex);
      });
    }
  }, []);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard key={task.id} id={task.id} content={task.content} isDragging={activeId === task.id} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId ? <TaskCard id={activeId} content={tasks.find(task => task.id === activeId)?.content} isDragging={true} /> : null}
      </DragOverlay>

      <style jsx>{`
        .task-list {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f4f4f4; // Light mode background
          border-radius: 10px;
        }

        .task-card {
          // Light mode styles
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
          .task-card {
            background-color: #333; // Dark mode card background
            color: #fff; // Light text for dark mode
            box-shadow: 0 2px 5px rgba(255, 255, 255, 0.2); // Adjusted shadow for dark mode
          }

          .task-list {
            background-color: #222; // Dark mode list background
          }
        }
      `}</style>
    </DndContext>
  );
};

export default TaskPage;
