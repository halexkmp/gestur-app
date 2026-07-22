import { Check, FileText, AlertTriangle, type LucideIcon } from 'lucide-react';
import { CalendarCellState } from '../../types';

export interface CellVisual {
  className: string;
  icon: LucideIcon | null;
  label: string;
}

const CELL_VISUALS: Record<CalendarCellState, CellVisual> = {
  WORKED: {
    className: 'bg-green-100 text-green-800 border-green-300',
    icon: Check,
    label: 'Trabalhou',
  },
  JUSTIFIED_ABSENCE: {
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: FileText,
    label: 'Falta justificada',
  },
  UNJUSTIFIED_ABSENCE: {
    className: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertTriangle,
    label: 'Falta não justificada',
  },
  NOT_SCHEDULED: {
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: null,
    label: 'Folga',
  },
  NO_DATA: {
    className: 'bg-gray-100 text-gray-400 border-gray-200 border-dashed',
    icon: null,
    label: 'Sem dados',
  },
};

export const getCellVisual = (state: CalendarCellState): CellVisual => CELL_VISUALS[state];
