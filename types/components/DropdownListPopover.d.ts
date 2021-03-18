import React from 'react';
import { CellLocation, DataListType, EditorProps } from './types';
interface DropdownListPopoverProps extends EditorProps {
    location: CellLocation;
    position: StyleProps;
    items: DataListType;
    parent?: DOMRect;
}
export interface StyleProps {
    minWidth?: number;
    top?: number;
    bottom?: number;
    left?: number | string;
    right?: number | string;
}
declare const DropdownListPopover: React.FC<DropdownListPopoverProps>;
export default DropdownListPopover;
