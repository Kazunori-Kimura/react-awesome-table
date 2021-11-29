import React from 'react';
import { EditMode } from '..';
import { Cell, CellLocation, CellProps, CellRange, ChangeCellValueFunction, ColumnDefinition, EditorProps, GenerateRowKeyFunction } from './types';
declare type PropsBase<T> = Cell<T> & CellProps;
interface TableCellProps<T> extends PropsBase<T> {
    className?: string;
    column: ColumnDefinition<T>;
    columns: ColumnDefinition<T>[];
    row: Cell<T>[];
    cells: Cell<T>[][];
    data: T[];
    location: CellLocation;
    editorProps: EditorProps;
    getRowKey: GenerateRowKeyFunction<T>;
    onChangeCellValue: ChangeCellValueFunction;
    containerRect?: DOMRect;
    hasFocus: boolean;
    onSelect: (range: CellRange) => void;
    setMode: (mode: EditMode) => void;
}
declare function TableCell<T>({ mode, className, column, columns, location, row, cells, data, rowKey, current, editing, invalid, invalidMessage, readOnly, selected, value, editorProps, getRowKey, onChangeCellValue, onDoubleClick, onKeyDown, onMouseDown, onMouseOver, onMouseUp, containerRect, hasFocus, onSelect, setMode, }: TableCellProps<T>): React.ReactElement;
export default TableCell;
