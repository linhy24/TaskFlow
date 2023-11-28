// types.ts
export interface Task {
    id: string;
    content: string;
  }
  
  export interface Board {
    id: string;
    title: string;
    tasks: Task[];
  }
  