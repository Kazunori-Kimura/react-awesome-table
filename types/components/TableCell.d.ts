import React from 'react';
import { Cell, CellLocation, CellProps, ColumnDefinition, EditorProps } from './types';
declare type PropsBase<T> = Cell<T> & CellProps;
interface TableCellProps<T> extends PropsBase<T> {
    className?: string;
    column: ColumnDefinition<T>;
    row: Cell<T>[];
    location: CellLocation;
    editorProps: EditorProps;
}
declare function TableCell<T>({ className, column, location, row, rowKey, current, editing, invalid, invalidMessage, readOnly, selected, value, editorProps, onDoubleClick, onKeyDown, onMouseDown, onMouseOver, onMouseUp, }: TableCellProps<T>): React.ReactElement;
export default TableCell;
