import React, { useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ApplicantCard } from './ApplicantCard';
import type { ATSApplicant, ATSStatus } from '../../types';

interface KanbanBoardProps {
  applicants: ATSApplicant[];
  onApplicantClick: (applicant: ATSApplicant) => void;
  onStatusChange: (applicantId: string, newStatus: ATSStatus) => void;
}

interface Column {
  id: ATSStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'submitted', title: 'Submitted', color: 'bg-blue-500' },
  { id: 'screening', title: 'Screening', color: 'bg-yellow-500' },
  { id: 'interview', title: 'Interview', color: 'bg-purple-500' },
  { id: 'offer', title: 'Offer', color: 'bg-green-500' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-500' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applicants,
  onApplicantClick,
  onStatusChange,
}) => {
  // Group applicants by status
  const applicantsByStatus = columns.reduce((acc, column) => {
    acc[column.id] = applicants.filter((app) => app.status === column.id);
    return acc;
  }, {} as Record<ATSStatus, ATSApplicant[]>);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;

      // Dropped outside a valid droppable
      if (!destination) return;

      // Dropped in the same position
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const newStatus = destination.droppableId as ATSStatus;
      const applicantId = draggableId;

      // Update status
      onStatusChange(applicantId, newStatus);
    },
    [onStatusChange]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnApplicants = applicantsByStatus[column.id] || [];

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
            >
              {/* Column Header */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {column.title}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({columnApplicants.length})
                  </span>
                </div>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      min-h-[200px] p-2 rounded-lg border-2 border-dashed
                      ${
                        snapshot.isDraggingOver
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30'
                      }
                    `}
                  >
                    <div className="space-y-3">
                      {columnApplicants.map((applicant, index) => (
                        <Draggable
                          key={applicant.id}
                          draggableId={applicant.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <ApplicantCard
                                applicant={applicant}
                                onClick={onApplicantClick}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* Empty state */}
                    {columnApplicants.length === 0 && (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
                        No applicants
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
