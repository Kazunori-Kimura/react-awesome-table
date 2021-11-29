import React from 'react';
import { CellRange } from '..';
interface Props {
    getSelectedCellValus: () => string;
    pasteData: (text: string) => void;
    switchSelectMode: VoidFunction;
    onSelect: (range: CellRange) => void;
    onClose: VoidFunction;
}
/**
 * 右クリックメニュー
 */
declare const ContextMenuPopover: React.VFC<Props>;
export default ContextMenuPopover;
