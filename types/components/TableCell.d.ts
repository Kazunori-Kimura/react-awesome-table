import React from 'react';
import { Cell, CellLocation, CellProps, ChangeCellValueFunction, ColumnDefinition, EditorProps, GenerateRowKeyFunction } from './types';
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
}
declare function TableCell<T>({ className, column, columns, location, row, cells, data, rowKey, current, editing, invalid, invalidMessage, readOnly, selected, value, editorProps, getRowKey, onChangeCellValue, onDoubleClick, onKeyDown, onMouseDown, onMouseOver, onMouseUp, containerRect, }: TableCellProps<T>): React.ReactElement;
export default TableCell;
