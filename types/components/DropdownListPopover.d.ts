import React from 'react';
import { CellLocation, DataListType, EditorProps } from './types';
interface DropdownListPopoverProps extends EditorProps {
    location: CellLocation;
    position: StyleProps;
    items: DataListType;
}
export interface StyleProps {
    minWidth?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}
declare const DropdownListPopover: React.FC<DropdownListPopoverProps>;
export default DropdownListPopover;
