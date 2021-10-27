import React from 'react';
import { CellLocation, DataListType, EditorProps } from './types';
interface DropdownListProps extends EditorProps {
    className?: string;
    location: CellLocation;
    dataList: DataListType;
    width?: number;
    parent?: DOMRect;
}
declare const DropdownList: React.VFC<DropdownListProps>;
export default DropdownList;
