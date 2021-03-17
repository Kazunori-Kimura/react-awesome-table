import React, { RefObject } from 'react';
import { CellLocation, DataListType, EditorProps } from './types';
interface DropdownListPopoverProps extends EditorProps {
    location: CellLocation;
    position: StyleProps;
    items: DataListType;
    parent: RefObject<HTMLDivElement>;
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
