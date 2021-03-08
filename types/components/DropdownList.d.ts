import React from 'react';
import { CellLocation, DataListType, EditorProps } from './types';
interface DropdownListProps extends EditorProps {
    className?: string;
    location: CellLocation;
    dataList: DataListType;
}
declare const DropdownList: React.FC<DropdownListProps>;
export default DropdownList;
